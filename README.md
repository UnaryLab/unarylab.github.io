# Unary Lab Website

Static site hosted on GitHub Pages at `https://unarylab.github.io/`.  
Push to `main` and GitHub Actions deploys automatically.

---

## Adding Content

### Home — `data/profile.json`
Edit directly. Fields: `name`, `phonetic`, `bio`, `email`, `scholar`, `github`, `linkedin`, `dblp`, `cv`, `photo`, `normy_caption`.

**Profile photo**: place at the path specified in `profile.json` (default: `file/headshot/Di Wu.jpg`).

**Normy photos**: drop images into `file/pet/normy-Di Wu/` — all are picked up automatically.

---

### News — `data/news.csv`
| Column | Format |
|--------|--------|
| Title  | plain text |
| Date   | `M/D/YY` (e.g. `3/27/26`) |
| Link   | URL (optional) |

---

### Publication — `data/publication.csv`
| Column | Notes |
|--------|-------|
| Title | plain text |
| Author | plain text |
| Selected | `yes` to appear in Selected tab |
| Tier | `top` to show 💎 |
| Venue | conference/journal name |
| Date | `M/D/YY` |
| Paper/Slide/Poster | URL **or** filename prefix (e.g. `2026-03-22-asplos`) |
| Video | URL (optional) |
| Code | URL (optional) |
| Award1 / Award2 / Award3 | award text (optional) |
| Software | name of software (must match `file/software/<name>.pdf`) |
| Description | shown on Software page if Software field is set |

**Paper files** go in `file/publication/` named `<prefix>-paper.pdf`, `-slide.pdf`, `-slide.pptx`, `-poster.pdf` (uppercase extensions also accepted).

---

### Software — driven by `data/publication.csv`
Rows where both `Software` and `Description` are filled appear on the Software page.  
Thumbnail goes in `file/software/<software-name>.pdf` (uppercase `.PDF` also accepted).

---

### Teaching — `data/teaching.csv`
| Column | Format |
|--------|--------|
| Title | course name |
| Role | e.g. `Instructor`, `Teaching Assistant` |
| Date | `M/D/YY` |
| Semester | `FA`, `SP`, `SU` |

**Leaderboard links** — `data/leaderboard.csv`:
| Column | Format |
|--------|--------|
| Title | display text |
| URL | full URL |

---

### Team — `data/team.csv`
| Column | Notes |
|--------|-------|
| Title | full name |
| Link | personal URL (optional) |
| Employment | post-graduation destination (alumni only) |
| Join | year (e.g. `2024`) |
| Leave | year — leave blank for current members |
| Degree | `PhD`, `MS`, or `BS` |
| Credit | special credit text (shown in darkred) |
| Internship | internship host (optional) |

**Headshots** go in `file/headshot/<Full Name>.<ext>`.  
Supported formats: `jpg` · `jpeg` · `png` · `webp` · `heic` (uppercase extensions also accepted).  
Names with affiliations in parentheses (e.g. `Arya Mahesh Patil (IIT Bombay)`) are matched by stripping the parenthetical.

---

### Photo — Events tab — `data/photo.csv` + `file/photo/`
| Column | Format |
|--------|--------|
| Title | caption text |
| Date | `M/D/YY` |

1. Add a row to `data/photo.csv`.
2. Create a folder under `file/photo/` named `YYYYMMDD-<slug>` (e.g. `20260503-gathering`).
3. Drop image files into that folder.

Supported formats: `jpg` · `jpeg` · `png` · `gif` · `webp` · `heic` (uppercase extensions also accepted).

The photo manifest (`data/photo_manifest.json`) is **auto-generated** on every deploy — no manual update needed.

### Photo — Healing the Day tab — `file/pet/`
Folder naming convention: `<pet-name>-<Owner Name>` (e.g. `normy-Di Wu`).  
The pet name and owner name are parsed from the folder name automatically.

1. Create a folder under `file/pet/` named `<pet-name>-<Owner Name>`.
2. Drop image files into that folder.

Supported formats: `jpg` · `jpeg` · `png` · `gif` · `webp` · `heic` (uppercase extensions also accepted).

The pet manifest (`data/pet_manifest.json`) is **auto-generated** on every deploy — no manual update needed.

---

### Site settings — `data/site.csv`
| Key | Value |
|-----|-------|
| `logo` | path to the nav bar logo (e.g. `file/logo/unary-logo-black.svg`) |
