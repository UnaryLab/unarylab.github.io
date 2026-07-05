/* ============================================================
   Unary Lab — Shared Utilities
   ============================================================ */

const _v = (() => {
  const s = document.querySelector('script[src*="utils.js"]');
  const m = s && s.src.match(/[?&]v=([^&]+)/);
  return m ? m[1] : Date.now();
})();

/* ── CSV Parser ───────────────────────────────────────
   Full state machine: handles quoted fields, escaped quotes (""),
   and newlines inside quoted cells. Headers are lowercased; values
   are trimmed. Returns an array of row objects keyed by header.
   ──────────────────────────────────────────────────── */
function parseCSV(text) {
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = [];
  let row = [], cur = '', inQ = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQ) {
      if (ch === '"') {
        if (s[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === ',') {
      row.push(cur); cur = '';
    } else if (ch === '\n') {
      row.push(cur); rows.push(row); row = []; cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  if (rows.length === 0) return [];

  const headers = rows[0].map(h => h.trim().toLowerCase());
  const data = [];
  for (let r = 1; r < rows.length; r++) {
    if (rows[r].length === 1 && rows[r][0].trim() === '') continue; // blank line
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (rows[r][idx] || '').trim(); });
    data.push(obj);
  }
  return data;
}

async function loadCSV(path) {
  const resp = await fetch(`${path}?v=${_v}`);
  if (!resp.ok) throw new Error(`Failed to load ${path}: HTTP ${resp.status}`);
  return parseCSV(await resp.text());
}

async function loadJSON(path) {
  const resp = await fetch(`${path}?v=${_v}`);
  if (!resp.ok) throw new Error(`Failed to load ${path}: HTTP ${resp.status}`);
  return resp.json();
}

/* ── File manifest ────────────────────────────────────
   data/file_manifest.json is generated at deploy time (and locally via
   scripts/generate_manifests.py). It lists the files in file/publication,
   file/headshot and file/software so pages resolve assets by lookup rather
   than probing the server with HEAD requests. Lookup is case-insensitive on
   both name and extension. Returns the real (correctly-cased) path or null.
   ──────────────────────────────────────────────────── */
let _fileManifest = null;
function loadFileManifest() {
  if (!_fileManifest) {
    _fileManifest = loadJSON('data/file_manifest.json').catch(() => ({}));
  }
  return _fileManifest;
}

function resolveFile(manifest, dir, filename) {
  const lc = filename.toLowerCase();
  const hit = (manifest[dir] || []).find(f => f.toLowerCase() === lc);
  return hit ? `file/${dir}/${encodeURIComponent(hit)}` : null;
}

/* Resolve a headshot by person name (parenthetical affiliations stripped),
   trying each supported extension. Used by the Team and Home pages. */
function resolveHeadshot(name, manifest) {
  const base = (name || '').replace(/\s*\(.*?\)\s*/g, '').trim();
  if (!base) return null;
  for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'heic']) {
    const hit = resolveFile(manifest, 'headshot', `${base}.${ext}`);
    if (hit) return hit;
  }
  return null;
}

/* Resolve a publication's paper/slide/poster links from the manifest given
   its `Paper/Slide/Poster` field. A full http(s) URL is treated as the paper
   link. Used by the Publication and Software pages. */
function resolvePubLinks(field, manifest) {
  field = (field || '').trim();
  if (!field) return { _paper: null, _slide: null, _poster: null };
  if (/^https?:\/\//.test(field)) return { _paper: field, _slide: null, _poster: null };
  const find = name => resolveFile(manifest, 'publication', name);
  return {
    _paper:  find(`${field}-paper.pdf`),
    _slide:  find(`${field}-slide.pdf`) || find(`${field}-slide.pptx`),
    _poster: find(`${field}-poster.pdf`),
  };
}

/* ── HTML escape ────────────────────────────────────── */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── Inline SVG icons (Lucide) ────────────────────────
   Replaces the Font Awesome CDN: no render-blocking external stylesheet
   for a handful of glyphs. Stroked, inherit color via currentColor.
   ──────────────────────────────────────────────────── */
const ICONS = {
  scholar:  '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5"/><path d="M22 10v6"/>',
  github:   '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 4 5 4 5 4c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 11c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
  email:    '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  dblp:     '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
  cv:       '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
  user:     '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
};
function icon(name) {
  const body = ICONS[name];
  return body
    ? `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`
    : '';
}

/* ── Status placeholder ───────────────────────────────── */
function placeholder(msg = 'Loading…') {
  return `<p class="placeholder-msg">${esc(msg)}</p>`;
}

/* ── Tab bar ──────────────────────────────────────────
   tabs: [{ id, label, html }] where html is a string or a () => string.
   Renders the bar + content area into rootEl and wires switching.
   ──────────────────────────────────────────────────── */
function setupTabs(rootEl, tabs, initialId) {
  const bar = tabs.map(t =>
    `<button class="pub-tab" data-tab="${esc(t.id)}">${esc(t.label)}</button>`
  ).join('');
  rootEl.innerHTML = `<div class="pub-tab-bar">${bar}</div><div class="tab-content"></div>`;
  const content = rootEl.querySelector('.tab-content');

  function show(id) {
    rootEl.querySelectorAll('.pub-tab').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === id));
    const t = tabs.find(x => x.id === id);
    content.innerHTML = t ? (typeof t.html === 'function' ? t.html() : t.html) : '';
  }

  rootEl.querySelectorAll('.pub-tab').forEach(b =>
    b.addEventListener('click', () => show(b.dataset.tab)));
  show(initialId || (tabs[0] && tabs[0].id));
}

/* ── Navigation ──────────────────────────────────────── */
async function injectNav() {
  const placeholderEl = document.getElementById('nav-placeholder');
  if (!placeholderEl) return;

  const current = (() => {
    const p = window.location.pathname.split('/').pop();
    return (p === '' || p === 'index.html') ? 'home' : p.replace('.html', '');
  })();

  const pages = [
    { id: 'home',        label: 'Home',         href: 'index.html' },
    { id: 'news',        label: 'News',         href: 'news.html' },
    { id: 'publication', label: 'Publication',  href: 'publication.html' },
    { id: 'software',    label: 'Software',     href: 'software.html' },
    { id: 'teaching',    label: 'Teaching',     href: 'teaching.html' },
    { id: 'team',        label: 'Team',         href: 'team.html' },
    { id: 'photo',       label: 'Photo',        href: 'photo.html' },
  ];

  let logo = 'file/logo/unary-logo-black.svg';
  try {
    const site = await loadCSV('data/site.csv');
    const row = site.find(r => r.key === 'logo');
    if (row && row.value) logo = row.value;
  } catch {}

  const links = pages.map(p =>
    `<a href="${p.href}"${p.id === current ? ' class="active"' : ''}><span data-label="${p.label}">${p.label}</span></a>`
  ).join('');

  placeholderEl.innerHTML = `
    <nav>
      <div class="nav-inner">
        <a class="site-title" href="index.html">
          <img src="${esc(logo)}" alt="Unary Lab" class="nav-logo">
          Unary Lab
        </a>
        <button class="nav-toggle" aria-label="Toggle navigation"
                onclick="document.getElementById('nav-links').classList.toggle('open')">&#9776;</button>
        <div class="nav-links" id="nav-links">${links}</div>
      </div>
    </nav>`;

  document.querySelectorAll('#nav-links a').forEach(a =>
    a.addEventListener('click', () =>
      document.getElementById('nav-links').classList.remove('open')
    )
  );
}

/* ── Date helpers ─────────────────────────────────────────────────────────
   Input format: M/D/YYYY  e.g. "3/27/2026" (legacy 2-digit years parse as 20YY)
   formatNewsDate → YYYY/MM   formatFullDate → YYYY/MM/DD
   ──────────────────────────────────────────────────────────────────────── */
function parseNewsDate(str) {
  if (!str || !str.trim()) return null;
  const parts = str.trim().split('/');
  if (parts.length < 3) return null;
  const m = parseInt(parts[0], 10);
  const d = parseInt(parts[1], 10) || 1;
  let y  = parseInt(parts[2], 10);
  if (y < 100) y += 2000;
  if (isNaN(m) || isNaN(y)) return null;
  return new Date(y, m - 1, d);
}

function formatNewsDate(str) {
  const d = parseNewsDate(str);
  if (!d) return '';
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatFullDate(str) {
  const d = parseNewsDate(str);
  if (!d) return '';
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function sortDescByDate(arr) {
  return [...arr].sort((a, b) => {
    const da = parseNewsDate(a.date), db = parseNewsDate(b.date);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return db - da;
  });
}

/* ── Renderers ───────────────────────────────────────── */

/* Bracketed external link, e.g. [paper]; returns '' when url is empty. */
function bracketLink(url, label) {
  return url ? `[<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>]` : '';
}

/* 🏅 award lines from a pub/software row's award1..3 fields. */
function renderAwards(p) {
  return [p.award1, p.award2, p.award3]
    .filter(Boolean)
    .map(a => `<div class="pub-award">🏅 ${esc(a)}</div>`)
    .join('');
}

function renderNewsItem(n) {
  const dateDisplay = formatNewsDate(n.date);
  const dateEl = dateDisplay ? `<span class="news-date">[${dateDisplay}]</span> ` : '';
  const linkEl = n.link ? ` <a href="${esc(n.link)}" target="_blank" rel="noopener">[link]</a>` : '';
  return `<li class="news-item">${dateEl}${esc(n.title)}${linkEl}</li>`;
}

function renderPubItem(p) {
  const gem = (p.tier || '').toLowerCase().trim() === 'top' ? '💎 ' : '';

  const linkParts = [
    bracketLink(p._paper,  'paper'),
    bracketLink(p._slide,  'slides'),
    bracketLink(p._poster, 'poster'),
    bracketLink(p.code,    'code'),
    bracketLink(p.video,   'video'),
  ].filter(Boolean).join(' ');

  const awards = renderAwards(p);

  const dateDisplay = formatNewsDate(p.date);

  return `
    <li class="pub-item">
      <div class="pub-info">
        <div class="pub-title">${gem}${esc(p.title)}</div>
        <div class="pub-venue"><em>${esc(p.venue)}</em>${dateDisplay ? `, ${dateDisplay}` : ''}</div>
        <div class="pub-authors">${esc(p.author)}</div>
        ${linkParts ? `<div class="pub-links">${linkParts}</div>` : ''}
        ${awards}
      </div>
    </li>`;
}

/* ── Lightbox ────────────────────────────────────────── */
function initLightbox() {
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = '<button class="lightbox-close" aria-label="Close">&times;</button><img src="" alt=""><iframe class="lightbox-pdf" src="" title=""></iframe>';
  document.body.appendChild(lb);

  const img = lb.querySelector('img');
  const pdf = lb.querySelector('.lightbox-pdf');

  function closeLightbox() {
    lb.classList.remove('open');
    pdf.src = '';
  }

  lb.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

  window.openLightbox = (src) => {
    const isPdf = src.toLowerCase().includes('.pdf');
    img.style.display = isPdf ? 'none' : 'block';
    pdf.style.display = isPdf ? 'block' : 'none';
    if (isPdf) { pdf.src = src; } else { img.src = src; }
    lb.classList.add('open');
  };

  document.addEventListener('click', e => {
    if (e.target.matches('.photo-grid img')) {
      window.openLightbox(e.target.src);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  injectNav();
  initLightbox();
});
