# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static personal/lab website for Unary Lab, hosted on GitHub Pages at `https://unarylab.github.io/` (custom domain `www.unarylab.com` via `CNAME`). **No build step, no package.json, no framework, no tests.** Plain HTML + one stylesheet + one JS file. Pushing to `main` triggers the GitHub Actions deploy.

## Local development

`file://` will not work because pages `fetch()` data files (CORS). Serve over HTTP:

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

Locally, HTML references assets as `style.css?v=1` / `utils.js?v=1`. CI rewrites these `?v=` values to the commit short-SHA on deploy (see below), so do **not** hand-edit them to a real SHA; leave them as-is.

## Architecture

**Content is data-driven, not hardcoded in HTML.** Each page is a thin HTML shell whose inline `<script>` fetches a CSV/JSON file from `data/` and renders it client-side. Adding content = editing a `data/*.csv` file and dropping assets into `file/`, never editing markup.

- **`js/utils.js`**: the shared core, loaded by every page. Provides: `parseCSV`/`loadCSV`/`loadJSON` (fetch + parse, with `?v=` cache-bust), `esc` (HTML escaping; always use when injecting CSV/JSON values into innerHTML), `injectNav` (builds the nav bar; the page list lives here, in the `pages` array), date helpers (`parseNewsDate` parses `M/D/YY`, `formatNewsDate` produces `YYYY/MM`, `sortDescByDate`), the `renderNewsItem`/`renderPubItem` renderers, the lightbox, and **`probeFile`**.
- **`probeFile(url)`**: does a HEAD request and, via `_caseVariants`, retries with lowercase/uppercase file extension. This is how the site tolerates `.jpg` vs `.JPG`, `.pdf` vs `.PDF`. Asset resolution throughout (publications, headshots, software thumbnails) relies on naming conventions + `probeFile`, not on paths stored in the data files.
- **`css/style.css`**: single stylesheet. Font stack is Gill Sans with the Cabin Google Font as the free fallback (matches the original site).
- **Page scripts** (inline in each `.html`) handle page-specific logic, e.g. `publication.html` resolves `<prefix>-paper.pdf`/`-slide.pdf`/`-slide.pptx`/`-poster.pdf` via `probeFile`, groups by year, and splits Selected vs Full tabs.

### Data files (`data/`)

CSV headers are lowercased on parse, so refer to columns in lowercase in JS. `profile.json` drives the home page; `site.csv` holds key/value settings (e.g. `logo`). The full column schema for each CSV is documented in `README.md`; consult it before changing a data file's shape.

The Software page is **derived from `publication.csv`** (rows where both `Software` and `Description` are filled), not a separate data file.

### Assets (`file/`)

Referenced by convention, matched at runtime by `probeFile`:
- `file/publication/<prefix>-{paper,slide,poster}.{pdf,pptx}`: `<prefix>` is given in the CSV's `Paper/Slide/Poster` column (or a full `http(s)://` URL bypasses probing).
- `file/headshot/<Full Name>.<ext>`: parenthetical affiliations in a name are stripped before matching.
- `file/software/<name>.pdf`: thumbnail; `<name>` matches the CSV `Software` field.
- `file/photo/YYYYMMDD-<slug>/` and `file/pet/<pet>---<Owner Name>/`: image folders; their manifests are **auto-generated on deploy** (don't hand-edit `photo_manifest.json` / `pet_manifest.json`).

## Deploy (`.github/workflows`)

On push to `main`, the workflow: (1) regenerates `data/photo_manifest.json` and `data/pet_manifest.json` by scanning `file/photo/` and `file/pet/` directories, commits them back with `[skip ci]`; (2) stamps the commit short-SHA into every `style.css?v=` and `utils.js?v=` reference in the `*.html` files for cache-busting; (3) uploads the whole repo and deploys to Pages. The manifest commit means manifests in the repo may lag the directories, which is expected; CI is the source of truth.

## Conventions

- `.nojekyll` is present, so GitHub Pages serves files as-is (no Jekyll processing).
- `.claude/` is gitignored; this `CLAUDE.md` at the repo root is tracked.
- Dates everywhere use `M/D/YY` input format (e.g. `3/27/26`).
