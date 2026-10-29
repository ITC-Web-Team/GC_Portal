/* eslint-disable */
import React, { useEffect, useRef } from "react";
import "./portal.css";
import logo from "../assets/logo.webp";
import trophy from "../assets/trophy.png";

/* ====== CONFIG: paste your API token (or set REACT_APP_GC_TOKEN in .env) ====== */
const API = "https://gcbackend.tech-iitb.org";
const TOKEN = process.env.REACT_APP_GC_TOKEN || "3af5accdebeb5b899e6f9197b0b822f657af008f";
/* Where clicking a GC card goes. Matches your existing route /GC/Genre1/:id */
const gcUrl = (id) => `/GC/Genre1/${id}`;
/* ================================================================================ */

const get = (path) =>
  fetch(API + path, { headers: { "Content-Type": "application/json", Authorization: "Token " + TOKEN } })
    .then((r) => { if (!r.ok) throw new Error(path + " " + r.status); return r.json(); });
const safe = (path) => get(path).catch((e) => { console.error(e); return []; });

const GENRES = [
  { key: "software", lb: "genregenre1", gc: "genre1", label: "Software", icon: "terminal" },
  { key: "hardware", lb: "genregenre2", gc: "genre2", label: "Hardware", icon: "gear" },
  { key: "sciences", lb: "genregenre3", gc: "genre3", label: "Pure Sciences", icon: "flask" },
  { key: "noncore", lb: "genregenre4", gc: "genre4", label: "Non Core", icon: "pen" },
];

async function load() {
  const [hostels, overall, ...rest] = await Promise.all([
    get("/hostels/"),
    safe("/overall/"),
    ...GENRES.map((g) => safe(`/${g.lb}/`)),
    ...GENRES.map((g) => safe(`/gc/${g.gc}/`)),
  ]);
  const lbs = rest.slice(0, 4), gcs = rest.slice(4);
  const toMap = (a) => Object.fromEntries((a || []).map((r) => [r.name, Number(r.total_score) || 0]));
  const SCORES = { overall: toMap(overall) };
  GENRES.forEach((g, i) => (SCORES[g.key] = toMap(lbs[i])));
  const HOSTELS = hostels.map((h) => ({ id: h.name, name: h.tittle || "", img: h.image }));
  const GCS = [];
  GENRES.forEach((g, i) =>
    (gcs[i] || []).forEach((x) =>
      GCS.push({
        id: x.id, n: x.name, c: x.club, g: g.label, i: g.icon,
        p: /high/i.test(x.prep) ? "High" : /med|mid/i.test(x.prep) ? "Mid" : "Low",
      })
    )
  );
  return { HOSTELS, SCORES, GCS };
}

const HTML = `<div class="progress" id="progress"></div>
<div class="glow" id="glow"></div>
<canvas class="confetti" id="confetti"></canvas>

<div class="nav-wrap" id="navWrap">
  <nav class="nav">
    <a href="#home" class="logo" aria-label="Institute Technical Council">
      <img src="@@LOGO@@" alt="ITC - Institute Technical Council">
    </a>
    <div class="links" id="links">
      <span class="pill" id="pill"></span>
      <a href="#leaderboard" class="active">Leaderboard</a>
      <a href="#hostels">Hostels</a>
      <a href="#rules">Rules</a>
      <a href="#gcs">GCs</a>
    </div>
    <button class="burger" id="burger" aria-label="Menu"><i></i><i></i><i></i></button>
  </nav>
</div>

<header class="hero hero-bg" id="home">
  <canvas id="stars"></canvas>
  <h1 class="title" id="title" aria-label="Technical GC Portal"></h1>
  <div class="notch"></div>
  <div class="trophy-wrap" id="trophyWrap">
    <div class="trophy" id="trophy">
      <img src="@@TROPHY@@" alt="Tech GC trophy" draggable="false">
    </div>
  </div>
</header>

<main>
  <section id="leaderboard">
    <h2 class="reveal">Leaderboard 24-25</h2>
    <div class="tabs reveal" id="tabs" role="tablist">
      <span class="ink" id="ink"></span>
      <button data-g="overall" role="tab"><i data-ico="trophy"></i>Overall</button>
      <button data-g="software" role="tab"><i data-ico="code"></i>Software</button>
      <button data-g="hardware" role="tab"><i data-ico="cpu"></i>Hardware</button>
      <button data-g="sciences" role="tab"><i data-ico="atom"></i>Pure sciences</button>
      <button data-g="noncore" role="tab"><i data-ico="file"></i>Non Core</button>
    </div>
    <div class="podium" id="podium"></div>
    <div class="empty" id="empty"><b data-ico="hourglass"></b>No points on the board yet for this genre.</div>
    <div class="rows" id="rows"></div>
  </section>

  <section id="hostels">
    <h2 class="reveal">Hostels</h2>
    <p class="sub reveal">One trophy. Tap a hostel to see its scorecard.</p>
    <div class="grid" id="grid"></div>
  </section>

  <section id="rules">
    <h2 class="reveal">Rules</h2>
    <div class="rules hero-bg reveal">
      <p id="rulesText">Tech GC is a year long event that aims to bring together the entire IITB community to participate in a series of competitions. We have a lot of exciting events lined up for you, so make sure you keep an eye out for them!</p>
      <div class="facts">
        <div><b id="cH" data-count="0">0</b><span>Hostels</span></div>
        <div><b id="cG" data-count="0">0</b><span>Genres</span></div>
        <div><b id="cC" data-count="0">0</b><span>GCs</span></div>
        <div><b id="cT" data-count="0">0</b><span>Top score</span></div>
      </div>
    </div>
  </section>

  <section id="gcs">
    <h2 class="reveal">GCs</h2>
    <div class="chips reveal" id="chips">
      <button class="on" data-f="all">All</button>
      <button data-f="Software">Software</button>
      <button data-f="Hardware">Hardware</button>
      <button data-f="Pure Sciences">Pure Sciences</button>
      <button data-f="Non Core">Non Core</button>
    </div>
    <div class="gcs" id="gcList"></div>
  </section>
</main>

<footer>
  Developed by <b>Web Team</b> with <span class="heart" data-ico="heart"></span>
</footer>

<div class="modal" id="modal"><div class="sheet hero-bg" id="sheet"></div></div>`;

export default function Portal() {
  const root = useRef(null);

  useEffect(() => {
    let dead = false;
    const cleanups = [];
    const __on = (t, f, o) => { window.addEventListener(t, f, o); cleanups.push(() => window.removeEventListener(t, f, o)); };
    const __openGC = (id) => window.location.assign(gcUrl(id));

    (async () => {
      let data;
      try { data = await load(); }
      catch (e) {
        console.error(e);
        if (root.current) root.current.innerHTML = '<p style="padding:140px 20px;text-align:center;color:#fff">Could not load data. Check your API token.</p>';
        return;
      }
      if (dead || !root.current) return;
      root.current.innerHTML = HTML.replace("@@LOGO@@", logo).replace("@@TROPHY@@", trophy);
      const { HOSTELS, SCORES, GCS } = data;

      /* ---------------- design script (unchanged logic) ---------------- */
const IMG='';
const GENRE_LABEL = {overall:'Overall',software:'Software',hardware:'Hardware',sciences:'Pure Sciences',noncore:'Non Core'};
const ICONS = {
  trophy:'<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  code:'<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  cpu:'<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>',
  atom:'<circle cx="12" cy="12" r="1"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(45 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-45 12 12)"/>',
  file:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8M16 13H8M16 17H8"/>',
  globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  terminal:'<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
  gear:'<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  plane:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  bot:'<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h.01M16 16h.01"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  zap:'<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  pulse:'<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  flask:'<path d="M9 3h6"/><path d="M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9V3"/><path d="M7.5 15h9"/>',
  pen:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  crown:'<path fill="currentColor" d="m2 7 4.5 5L12 4l5.5 8L22 7l-2 12H4Z"/>',
  hourglass:'<path d="M5 22h14M5 2h14"/><path d="M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.400 4.400a2 2 0 0 0-.6 1.400V22"/><path d="M7 2v4.200a2 2 0 0 0 .6 1.400L12 12l4.400-4.400a2 2 0 0 0 .6-1.400V2"/>',
  heart:'<path fill="currentColor" stroke="none" d="M20.800 4.600a5.500 5.500 0 0 0-7.800 0L12 5.700l-1-1.100a5.500 5.500 0 0 0-7.800 7.800l1 1L12 21.200l7.800-7.800 1-1a5.500 5.500 0 0 0 0-7.800z"/>'
};
const svg = n => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
document.querySelectorAll('[data-ico]').forEach(el => el.innerHTML = svg(el.dataset.ico));
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const byId = Object.fromEntries(HOSTELS.map(h => [h.id, h]));
const score = (g, id) => SCORES[g][id] || 0;
const ord = n => n + (['th','st','nd','rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : n % 10] || 'th');

function avatar(h){
  return `<span class="avatar"><img src="${IMG + h.img}" alt="" loading="lazy" onerror="this.replaceWith(document.createTextNode('${h.id}'))"></span>`;
}
function ranking(g){
  const list = HOSTELS.map((h, i) => ({h, s:score(g, h.id), i})).sort((a, b) => b.s - a.s || a.i - b.i);
  let rank = 0, prev = null;
  list.forEach(r => { if (r.s !== prev) { rank++; prev = r.s; } r.rank = rank; });
  return list;
}
function countUp(el, to, dur=1200){
  if (reduce) { el.textContent = to; return; }
  const dec = to % 1 ? 1 : 0, t0 = performance.now();
  (function tick(t){
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
    el.textContent = (to * e).toFixed(dec);
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

/* ---------- hero title ---------- */
$('#title').innerHTML = [...'TECHNICAL GC PORTAL'].map((c, i) =>
  c === ' ' ? ' ' : `<span style="animation-delay:${.15 + i * .045}s">${c}</span>`).join('');

/* ---------- starfield ---------- */
(function(){
  const cv = $('#stars'), cx = cv.getContext('2d'), hero = $('#home');
  let w, h, pts = [], mouse = {x:-999, y:-999};
  function size(){
    w = cv.width = hero.offsetWidth; h = cv.height = hero.offsetHeight;
    pts = Array.from({length:Math.min(90, Math.round(w / 16))}, () => ({
      x:Math.random() * w, y:Math.random() * h, vx:(Math.random() - .5) * .3, vy:(Math.random() - .5) * .3, r:Math.random() * 1.8 + .6
    }));
  }
  size(); __on('resize', size);
  hero.addEventListener('pointermove', e => { const b = cv.getBoundingClientRect(); mouse.x = e.clientX - b.left; mouse.y = e.clientY - b.top; });
  hero.addEventListener('pointerleave', () => mouse.x = -999);
  function draw(){
    cx.clearRect(0, 0, w, h);
    for (const p of pts){
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 140){ p.x += dx / d * 1.2; p.y += dy / d * 1.2; }
      cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.3);
      cx.fillStyle = 'rgba(190,220,255,.7)'; cx.fill();
      if (d < 200){
        cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(mouse.x, mouse.y);
        cx.strokeStyle = `rgba(79,227,240,${.35 * (1 - d / 200)})`; cx.stroke();
      }
    }
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++){
      const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 110){
        cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y);
        cx.strokeStyle = `rgba(180,160,255,${.16 * (1 - d / 110)})`; cx.stroke();
      }
    }
    if (!reduce && !dead) requestAnimationFrame(draw);
  }
  draw();
})();

/* ---------- trophy tilt + confetti ---------- */
(function(){
  const wrap = $('#trophyWrap'), t = $('#trophy'), hero = $('#home');
  hero.addEventListener('pointermove', e => {
    const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    t.style.transform = `rotateY(${x * 28}deg) rotateX(${-y * 16}deg)`;
  });
  hero.addEventListener('pointerleave', () => t.style.transform = '');
  const cv = $('#confetti'), cx = cv.getContext('2d');
  let bits = [], running = false;
  function fit(){ cv.width = innerWidth; cv.height = innerHeight; }
  fit(); __on('resize', fit);
  function burst(x, y){
    const cols = ['#4fe3f0', '#ffc83d', '#ff7a59', '#fff', '#a987ff', '#1414b8'];
    for (let i = 0; i < 140; i++){
      const a = Math.random() * 6.28, v = Math.random() * 13 + 4;
      bits.push({x, y, vx:Math.cos(a) * v, vy:Math.sin(a) * v - 7, s:Math.random() * 8 + 4, c:cols[i % cols.length], r:Math.random() * 6, vr:(Math.random() - .5) * .5, life:1});
    }
    if (!running){ running = true; loop(); }
  }
  function loop(){
    cx.clearRect(0, 0, cv.width, cv.height);
    bits = bits.filter(b => b.life > 0 && b.y < cv.height + 30);
    for (const b of bits){
      b.vy += .35; b.vx *= .985; b.x += b.vx; b.y += b.vy; b.r += b.vr; b.life -= .008;
      cx.save(); cx.translate(b.x, b.y); cx.rotate(b.r); cx.globalAlpha = Math.max(0, b.life);
      cx.fillStyle = b.c; cx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); cx.restore();
    }
    if (bits.length) requestAnimationFrame(loop); else running = false;
  }
  window.celebrate = burst;
})();

/* ---------- leaderboard ---------- */
const ROW_H = 76;
const rowsEl = $('#rows'), podiumEl = $('#podium'), emptyEl = $('#empty');
const rowEls = {};
HOSTELS.forEach(h => {
  const el = document.createElement('div');
  el.className = 'row';
  el.innerHTML = `<span class="bar"></span><span class="rk"></span>${avatar(h)}<span class="who">${h.id}<small>${h.name}</small></span><span class="sc">0</span>`;
  el.onclick = () => openHostel(h.id);
  rowsEl.append(el); rowEls[h.id] = el;
});
let current = null;
function showGenre(g){
  if (g === current) return;
  current = g;
  const list = ranking(g), max = list[0].s, has = max > 0;
  $$('#tabs button').forEach(b => {
    const on = b.dataset.g === g;
    b.setAttribute('aria-selected', on);
    if (on){ const ink = $('#ink'); ink.style.width = b.offsetWidth + 'px'; ink.style.transform = `translateX(${b.offsetLeft}px)`; }
  });
  emptyEl.style.display = has ? 'none' : 'block';
  const top = has ? list.slice(0, 3) : [];
  podiumEl.innerHTML = top.map((r, i) => `
    <div class="pod p${i + 1}" data-id="${r.h.id}">
      ${i === 0 ? `<span class="crown">${svg('crown')}</span>` : ''}
      <div class="top">${avatar(r.h)}<div><div class="code">${r.h.id}</div><div class="nm">${r.h.name}</div></div></div>
      <div class="stats"><div><b>${ord(r.rank)}</b><span>Rank</span></div><div style="text-align:right"><b class="num" data-to="${r.s}">0</b><span>Total score</span></div></div>
    </div>`).join('');
  $$('.pod', podiumEl).forEach(p => { tilt(p, 10); p.onclick = () => openHostel(p.dataset.id); countUp($('.num', p), +$('.num', p).dataset.to); });
  podiumEl.style.display = has ? '' : 'none';
  const rest = has ? list.slice(3) : list;
  list.forEach(r => rowEls[r.h.id].classList.toggle('hide', has && r.rank <= 3 && list.indexOf(r) < 3));
  rest.forEach((r, i) => {
    const el = rowEls[r.h.id];
    el.style.transform = `translateY(${i * ROW_H}px)`;
    el.style.transitionDelay = i * 25 + 'ms';
    $('.rk', el).textContent = has ? r.rank : '–';
    $('.bar', el).style.width = (max ? r.s / max * 100 : 0) + '%';
    countUp($('.sc', el), r.s, 900);
  });
  rowsEl.style.height = rest.length * ROW_H + 'px';
}
$$('#tabs button').forEach(b => b.onclick = () => showGenre(b.dataset.g));

/* ---------- 3D tilt helper ---------- */
function tilt(el, deg=12){
  el.addEventListener('pointermove', e => {
    const b = el.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
    el.style.transform = `perspective(700px) rotateY(${(x - .5) * deg}deg) rotateX(${(.5 - y) * deg}deg) translateY(-6px)`;
    el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
  });
  el.addEventListener('pointerleave', () => el.style.transform = '');
}

/* ---------- hostels ---------- */
const overall = ranking('overall');
$('#grid').innerHTML = HOSTELS.map((h, i) => {
  const r = overall.find(x => x.h.id === h.id);
  return `<div class="hostel reveal" data-id="${h.id}" style="transition-delay:${i % 6 * 60}ms">
    <span class="badge">#${r.rank}</span>
    <div class="ph"><img src="${IMG + h.img}" alt="${h.name}" loading="lazy" onerror="this.replaceWith(document.createTextNode('${h.id}'))"></div>
    <h3>${h.id}</h3><p>${h.name}</p></div>`;
}).join('');
$$('.hostel').forEach(c => { tilt(c, 16); c.onclick = () => openHostel(c.dataset.id); });

/* ---------- hostel modal ---------- */
const modal = $('#modal'), sheet = $('#sheet');
function openHostel(id){
  const h = byId[id], r = overall.find(x => x.h.id === id);
  const genres = ['software', 'hardware', 'sciences', 'noncore'];
  sheet.innerHTML = `
    <button class="x" aria-label="Close">✕</button>
    <div class="head">${avatar(h)}<div><h3>${h.id}</h3><p>${h.name}</p></div></div>
    <div class="big"><div><b>${ord(r.rank)}</b><span>Overall rank</span></div><div><b id="mScore">0</b><span>Total score</span></div></div>
    ${genres.map(g => {
      const max = ranking(g)[0].s, s = score(g, id);
      return `<div class="meter"><div class="lb"><span>${GENRE_LABEL[g]}</span><span>${s}</span></div><div class="tr"><div class="fl" data-w="${max ? s / max * 100 : 0}"></div></div></div>`;
    }).join('')}`;
  modal.classList.add('show');
  countUp($('#mScore'), r.s);
  requestAnimationFrame(() => requestAnimationFrame(() => $$('.fl', sheet).forEach(f => f.style.width = f.dataset.w + '%')));
  $('.x', sheet).onclick = closeModal;
  if (r.rank === 1) celebrate(innerWidth / 2, innerHeight / 3);
}
function closeModal(){ modal.classList.remove('show'); }
modal.onclick = e => { if (e.target === modal) closeModal(); };
__on('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ---------- GCs ---------- */
$('#gcList').innerHTML = GCS.map((g, i) => `
  <div class="gc reveal" data-id="${g.id}" data-g="${g.g}" style="transition-delay:${i % 4 * 70}ms;cursor:pointer">
    <span class="ic">${svg(g.i)}</span><span class="prep ${g.p.toLowerCase()}">${g.p} Prep</span>
    <span class="genre">${g.g}</span><h3>${g.n}</h3><p class="club">${g.c}</p>
  </div>`).join('');
$$('.gc').forEach(c => c.onclick = () => __openGC(c.dataset.id));
$$('#chips button').forEach(b => b.onclick = () => {
  $$('#chips button').forEach(x => x.classList.toggle('on', x === b));
  $$('.gc').forEach(c => {
    const show = b.dataset.f === 'all' || c.dataset.g === b.dataset.f;
    c.classList.toggle('gone', !show);
    if (show) c.animate([{opacity:0, transform:'scale(.85)'}, {opacity:1, transform:'none'}], {duration:400, easing:'cubic-bezier(.2,1.3,.4,1)'});
  });
});

/* ---------- rules: words light up on scroll ---------- */
const rt = $('#rulesText');
rt.innerHTML = rt.textContent.split(' ').map(w => `<span class="w">${w}</span>`).join(' ');
const words = $$('.w', rt);

/* ---------- scroll: reveal, nav, progress ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in'); io.unobserve(e.target);
  $$('[data-count]', e.target).forEach(n => countUp(n, +n.dataset.count, 1500));
}), {threshold:.15});
$$('.reveal').forEach(el => io.observe(el));

const navLinks = $$('#links a'), pill = $('#pill');
function movePill(a){
  if (!a){ pill.style.opacity = 0; return; }
  pill.style.opacity = 1; pill.style.width = a.offsetWidth + 'px'; pill.style.transform = `translateX(${a.offsetLeft}px)`;
}
navLinks.forEach(a => {
  a.addEventListener('mouseenter', () => movePill(a));
  a.addEventListener('click', () => $('#navWrap').classList.remove('open'));
});
$('#links').addEventListener('mouseleave', () => movePill(null));
$('#burger').onclick = () => $('#navWrap').classList.toggle('open');

$('#cH').dataset.count=HOSTELS.length;$('#cG').dataset.count=4;$('#cC').dataset.count=GCS.length;$('#cT').dataset.count=Math.max(...Object.values(SCORES.overall),0);
const sections = ['leaderboard', 'hostels', 'rules', 'gcs'].map(id => document.getElementById(id));
function onScroll(){
  const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
  $('#progress').style.transform = `scaleX(${max ? y / max : 0})`;
  $('#navWrap').classList.toggle('scrolled', y > 40);
  let act = 'leaderboard';
  sections.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .45) act = s.id; });
  navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + act));
  if (!reduce) $('#title').style.transform = `translateY(${y * .25}px)`;
  const b = rt.getBoundingClientRect(), p = (innerHeight * .85 - b.top) / (b.height + innerHeight * .35);
  words.forEach((w, i) => w.classList.toggle('lit', reduce || i / words.length < p));
}
__on('scroll', onScroll, {passive:true});

const glow = $('#glow');
__on('pointermove', e => { glow.style.opacity = 1; glow.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`; });

__on('resize', () => { const g = current; current = null; showGenre(g); });
showGenre('overall');
onScroll();
document.fonts && document.fonts.ready.then(() => { const g = current; current = null; showGenre(g); });
    })();

    return () => {
      dead = true;
      cleanups.forEach((f) => f());
      if (root.current) root.current.innerHTML = "";
    };
  }, []);

  return <div ref={root} />;
}