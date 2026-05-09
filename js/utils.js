/* ============================================================
   Unary Lab — Shared Utilities
   ============================================================ */

const _v = (() => {
  const s = document.querySelector('script[src*="utils.js"]');
  const m = s && s.src.match(/[?&]v=([^&]+)/);
  return m ? m[1] : Date.now();
})();

/* ── CSV Parser ─────────────────────────────────────── */
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length === 0) return [];
  const headers = splitLine(lines[0]);
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = splitLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => { obj[h.trim().toLowerCase()] = (vals[idx] || '').trim(); });
    data.push(obj);
  }
  return data;
}

function splitLine(line) {
  const result = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      result.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
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

/* ── HTML escape ────────────────────────────────────── */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Navigation ──────────────────────────────────────── */
async function injectNav() {
  const placeholder = document.getElementById('nav-placeholder');
  if (!placeholder) return;

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

  placeholder.innerHTML = `
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

/* ── News date helpers ───────────────────────────────────────────────────
   Input format: M/D/YY  e.g. "3/27/26" or "10/7/25"
   Display format: YYYY/MM  e.g. "2026/03"
   ──────────────────────────────────────────────────────────────────────── */
function parseNewsDate(str) {
  if (!str || !str.trim()) return null;
  const parts = str.trim().split('/');
  if (parts.length < 2) return null;
  const m = parseInt(parts[0], 10);
  const d = parseInt(parts[1], 10) || 1;
  let y  = parts.length >= 3 ? parseInt(parts[2], 10) : 0;
  if (y < 100) y += 2000;
  if (isNaN(m) || isNaN(y)) return null;
  return new Date(y, m - 1, d);
}

function formatNewsDate(str) {
  const d = parseNewsDate(str);
  if (!d) return '';
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function probeFile(url) {
  for (const u of _caseVariants(url)) {
    try {
      const r = await fetch(u, { method: 'HEAD', cache: 'no-store' });
      if (r.ok) return u;
    } catch {}
  }
  return null;
}
function _caseVariants(url) {
  const dot = url.lastIndexOf('.');
  if (dot === -1) return [url];
  const base = url.slice(0, dot + 1), ext = url.slice(dot + 1);
  const lo = ext.toLowerCase(), hi = ext.toUpperCase();
  return lo === hi ? [url] : [base + lo, base + hi];
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
function renderNewsItem(n) {
  const dateDisplay = formatNewsDate(n.date);
  const dateEl = dateDisplay ? `<span class="news-date">[${dateDisplay}]</span> ` : '';
  const linkEl = n.link ? ` <a href="${esc(n.link)}" target="_blank" rel="noopener">[link]</a>` : '';
  return `<li class="news-item">${dateEl}${esc(n.title)}${linkEl}</li>`;
}

function renderPubItem(p) {
  const gem = (p.tier || '').toLowerCase().trim() === 'top' ? '💎 ' : '';

  const linkParts = [
    p._paper  && `[<a href="${esc(p._paper)}"  target="_blank" rel="noopener">paper</a>]`,
    p._slide  && `[<a href="${esc(p._slide)}"  target="_blank" rel="noopener">slides</a>]`,
    p._poster && `[<a href="${esc(p._poster)}" target="_blank" rel="noopener">poster</a>]`,
    p.code    && `[<a href="${esc(p.code)}"    target="_blank" rel="noopener">code</a>]`,
    p.video   && `[<a href="${esc(p.video)}"   target="_blank" rel="noopener">video</a>]`,
  ].filter(Boolean).join(' ');

  const awards = [p.award1, p.award2, p.award3]
    .filter(Boolean)
    .map(a => `<div class="pub-award">🏅 ${esc(a)}</div>`)
    .join('');

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
  lb.innerHTML = '<span class="lightbox-close">&times;</span><img src="" alt=""><iframe class="lightbox-pdf" src="" title=""></iframe>';
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
