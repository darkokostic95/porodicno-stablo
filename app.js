'use strict';

/* ---------- Basics ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const KEY = 'porodicno-stablo:kostic';

// Node geometry (tree units)
const W = 160, H = 232, CG = 34, SG = 40, ROWH = H + 96;
const TRUNK = 230, TOPPAD = 44;
const OV = { cy: 58, rx: 44, ry: 54 };
const SERIF = 'Cormorant Garamond, Georgia, Times New Roman, serif';
const SANS = 'Inter, Helvetica Neue, Arial, sans-serif';
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600&display=swap';

const THEMES = {
  pergament: { name: 'Pergament', bg: '#f2e8d3', ink: '#3a2817', muted: '#7d6346', line: '#8f7350', accent: '#a07c3b', node: '#f8f0de', texture: true,
    bark: '#80613d', bark2: '#4f3920', leaf: '#7d8b4c', leafVein: '#55612d', ribbon: '#f6ecd3', ribbon2: '#e2cfa5',
    scene: '#eadcbc', glow: 'rgba(255,246,222,.95)', vig: 'rgba(90,58,20,.5)', dust: '214,170,90' },
  moderno: { name: 'Moderno', bg: '#faf8f3', ink: '#1f2421', muted: '#6b706a', line: '#b7b9b1', accent: '#2f5d50', node: '#ffffff',
    bark: '#5b675f', bark2: '#37413b', leaf: '#6f9479', leafVein: '#46644f', ribbon: '#ffffff', ribbon2: '#e6e9e1',
    scene: '#f1efe8', glow: 'rgba(255,255,255,.95)', vig: 'rgba(40,55,48,.22)', dust: '120,150,130' },
  noc: { name: 'Noć i zlato', bg: '#1d1a16', ink: '#f0e6d2', muted: '#b4a486', line: '#6a5c48', accent: '#d2ad62', node: '#27231e',
    bark: '#8b7350', bark2: '#4d3d27', leaf: '#8d9b58', leafVein: '#5f6b33', ribbon: '#2f2920', ribbon2: '#221d16',
    scene: '#14110d', glow: 'rgba(210,173,98,.2)', vig: 'rgba(0,0,0,.7)', dust: '232,196,120' },
  gravura: { name: 'Gravura (crno-belo)', bg: '#ffffff', ink: '#000000', muted: '#000000', line: '#000000', accent: '#000000', node: 'none', engrave: true,
    bark: '#000', bark2: '#000', leaf: '#000', leafVein: '#000', ribbon: '#fff', ribbon2: '#fff' },
};
const PAPERS = { A4: [210, 297], A3: [297, 420], A2: [420, 594], A1: [594, 841], '50x70': [500, 700] };

const FORMATS = [
  { id: 'png', name: 'Slika (PNG)', desc: 'Za deljenje, ekran i štampu u fotokopirnici' },
  { id: 'pdf', name: 'PDF za štampu', desc: 'Vektorski, oštar na svakoj veličini papira' },
  { id: 'svg', name: 'SVG vektor', desc: 'Za dizajnere, štampariju i dalje doterivanje' },
  { id: 'engrave', name: 'Gravura (SVG)', desc: 'Crno-bele linije za laser na drvetu' },
  { id: 'json', name: 'Arhiva (JSON)', desc: 'Rezervna kopija svih podataka i slika' },
  { id: 'ged', name: 'GEDCOM', desc: 'Za MyHeritage, Ancestry, FamilySearch' },
];

/* ---------- Text helpers ---------- */
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const yr = s => { const m = String(s || '').match(/\d{4}/); return m ? m[0] : String(s || '').trim(); };
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj');
const uid = () => 'p' + Math.random().toString(36).slice(2, 9);

const L2C = { lj: 'љ', nj: 'њ', 'dž': 'џ', a: 'а', b: 'б', v: 'в', g: 'г', d: 'д', 'đ': 'ђ', e: 'е', 'ž': 'ж', z: 'з', i: 'и', j: 'ј', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р', s: 'с', t: 'т', 'ć': 'ћ', u: 'у', f: 'ф', h: 'х', c: 'ц', 'č': 'ч', 'š': 'ш' };
function toCyr(str) {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const two = str.substr(i, 2), tl = two.toLowerCase();
    if (tl.length === 2 && L2C[tl]) {
      let c = L2C[tl];
      if (two[0] !== two[0].toLowerCase()) c = c.toUpperCase();
      out += c; i++; continue;
    }
    const ch = str[i], l = ch.toLowerCase();
    out += L2C[l] ? (ch !== l ? L2C[l].toUpperCase() : L2C[l]) : ch;
  }
  return out;
}
/* Interface in Cyrillic: every visible label is transliterated when Cyrillic is chosen.
   Acronyms (PNG, PDF), foreign words (px, MyHeritage) and app names stay as they are. */
const KEEP_RE = /(Object to Path|MyHeritage|FamilySearch|Ancestry|LightBurn|Inkscape|Illustrator|Affinity|Enter)/;
function uiCyr(str) {
  return String(str).split(KEEP_RE).map((part, i) => (i % 2 ? part : part.replace(/[A-Za-zČĆŽŠĐčćžšđ]+/g, w => {
    if (/[qwxyQWXY]/.test(w) || (w.length > 1 && w === w.toUpperCase())) return w;
    return toCyr(w);
  }))).join('');
}
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'PRE', 'svg']);
const UI_ATTRS = ['placeholder', 'title', 'aria-label'];
const origText = new WeakMap(), origAttr = new WeakMap();
function skipEl(el) {
  for (let e = el; e && e !== document.body; e = e.parentElement) {
    if (SKIP_TAGS.has(e.tagName) || e.namespaceURI === 'http://www.w3.org/2000/svg' || e.getAttribute?.('translate') === 'no') return true;
  }
  return false;
}
function translitUI(root = document.body) {
  const cyr = script() === 'cyr';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim() || skipEl(n.parentElement)) continue;
    if (!origText.has(n)) origText.set(n, n.nodeValue);
    const v = cyr ? uiCyr(origText.get(n)) : origText.get(n);
    if (n.nodeValue !== v) n.nodeValue = v;
  }
  const els = root.querySelectorAll ? [root, ...root.querySelectorAll('[placeholder],[title],[aria-label]')] : [];
  els.forEach(el => {
    if (!el.getAttribute || skipEl(el)) return;
    const o = origAttr.get(el) || {};
    UI_ATTRS.forEach(a => {
      if (!el.hasAttribute(a)) return;
      if (!(a in o)) o[a] = el.getAttribute(a);
      const v = cyr ? uiCyr(o[a]) : o[a];
      if (el.getAttribute(a) !== v) el.setAttribute(a, v);
    });
    origAttr.set(el, o);
  });
}
// Re-apply to anything the app adds or changes later
new MutationObserver(muts => {
  if (script() !== 'cyr') return;
  muts.forEach(m => {
    if (m.type === 'attributes') {
      const o = origAttr.get(m.target) || {};
      const cur = m.target.getAttribute(m.attributeName);
      if (cur !== null && cur !== uiCyr(o[m.attributeName] ?? '')) { o[m.attributeName] = cur; origAttr.set(m.target, o); }
      translitUI(m.target);
    } else {
      m.addedNodes.forEach(n => {
        if (n.nodeType === 3) { if (n.parentElement) translitUI(n.parentElement); }
        else if (n.nodeType === 1) translitUI(n);
      });
    }
  });
}).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: UI_ATTRS });
const nativeConfirm = window.confirm.bind(window);
window.confirm = msg => nativeConfirm(script() === 'cyr' ? uiCyr(msg) : msg);

const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'porodicno-stablo';

/* ---------- Data ---------- */
function sampleData() { return JSON.parse(JSON.stringify(window.POCETNI_PODACI)); }

function emptyData() {
  const id = uid();
  return {
    version: 1, title: 'Naša porodica', root: id,
    people: { [id]: { id, first: 'Ime', last: 'Prezime', gender: '', birth: '', death: '', birthPlace: '', deathPlace: '', maiden: '', photo: '', bio: '' } },
    families: [], settings: { theme: 'pergament', script: 'cyr' },
  };
}

function valid(d) { return d && typeof d === 'object' && d.people && Array.isArray(d.families) && Object.keys(d.people).length; }

function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); return valid(d) ? d : null; } catch { return null; }
}

let data = load() || sampleData();
upgrade(data);

// Bring an archive saved earlier in this browser up to date with newer starting data,
// filling only fields that are still empty so the user's own edits are kept.
function upgrade(d) {
  const src = window.POCETNI_PODACI;
  if (!src || (d.rev || 1) >= (src.rev || 1)) return;
  Object.values(src.people).forEach(sp => {
    const p = d.people[sp.id];
    if (!p) return;
    ['last', 'maiden', 'nick'].forEach(k => { if (!p[k] && sp[k]) p[k] = sp[k]; });
  });
  if ((d.rev || 1) < 3) d.settings = { ...(d.settings || {}), script: 'cyr' };
  d.rev = src.rev;
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* ok */ }
}
data.settings = data.settings || {};
const state = { selected: null, editing: false, view: { tx: 0, ty: 0, k: 1 }, layout: null };

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    setSave('Sačuvano u ovom pregledaču');
  } catch {
    setSave('Nije sačuvano — prostor je pun. Izvezite arhivu (JSON).', true);
  }
}
function setSave(msg, err) { const el = $('#saveState'); el.textContent = msg; el.classList.toggle('err', !!err); }

const theme = () => data.settings.theme || 'pergament';
const script = () => data.settings.script || 'cyr';
const rootId = () => (data.people[data.root] ? data.root : Object.keys(data.people)[0]);

/* ---------- Relationships ---------- */
const famsOf = pid => data.families.filter(f => f.partners.includes(pid));
const parentFam = pid => data.families.find(f => f.children.includes(pid));
const parentsOf = pid => (parentFam(pid)?.partners || []).filter(id => data.people[id]);
const spousesOf = pid => famsOf(pid).flatMap(f => f.partners.filter(x => x !== pid && data.people[x]));
const childrenOf = pid => famsOf(pid).flatMap(f => f.children.filter(c => data.people[c]));
const birthNum = pid => parseInt(yr(data.people[pid]?.birth)) || 9999;

/* ---------- Layout ----------
   Main tree: descendants of the root person.
   Side branches: when someone married into the family has their own parents,
   their family is drawn beside the main tree, aligned by generation. The
   person appears there as a faded "ghost" linked by a dashed line to the real one. */
function layout(root, maxDepth = 99) {
  const seen = new Set();
  let ghostId = null, ghostSide = 'left', spouseLeft = new Set();

  function build(pid, depth) {
    seen.add(pid);
    if (pid === ghostId) return { pid, members: [pid], spouses: [], groups: [], rowW: W, childW: 0, width: W, ghost: true };
    const fams = famsOf(pid);
    const spouses = [];
    fams.forEach(f => f.partners.forEach(x => {
      if (x !== pid && data.people[x] && !spouses.includes(x) && !seen.has(x)) { spouses.push(x); seen.add(x); }
    }));
    let members;
    if (spouses.length === 2) members = [spouses[0], pid, spouses[1]];
    else if (spouses.length === 1 && spouseLeft.has(spouses[0])) members = [spouses[0], pid];
    else members = [pid, ...spouses];
    const groups = [];
    if (depth + 1 < maxDepth) {
      fams.forEach(f => {
        const kids = f.children.filter(c => data.people[c] && !seen.has(c)).sort((a, b) => birthNum(a) - birthNum(b));
        if (ghostId && f.children.includes(ghostId) && !kids.includes(ghostId)) {
          if (ghostSide === 'left') kids.push(ghostId); else kids.unshift(ghostId);
        }
        const units = kids.map(c => build(c, depth + 1));
        const sp = f.partners.find(x => x !== pid && data.people[x]);
        groups.push({ spouse: sp && members.includes(sp) ? sp : null, units });
      });
    }
    const all = groups.flatMap(g => g.units);
    const rowW = members.length * W + (members.length - 1) * CG;
    const childW = all.reduce((a, u) => a + u.width, 0) + Math.max(0, all.length - 1) * SG;
    return { pid, members, spouses: spouses.filter(s => members.includes(s)), groups, rowW, childW, width: Math.max(rowW, childW) };
  }

  function place(u, x0, y, out) {
    const cx = x0 + u.width / 2, rs = cx - u.rowW / 2, pos = {};
    u.members.forEach((m, i) => {
      pos[m] = rs + i * (W + CG) + W / 2;
      if (i === u.members.length - 1 && !out.tops.length) out.tops.push(null);
      out.nodes.push({ pid: m, x: pos[m], y, primary: m === u.pid, ghost: !!u.ghost });
    });
    if (out.tops[0] === null) out.tops[0] = { x: u.spouses.length ? (pos[u.pid] + pos[u.spouses[0]]) / 2 : pos[u.pid], y, single: !u.spouses.length, pid: u.pid };
    u.spouses.forEach(s => out.marriages.push({ a: Math.min(pos[u.pid], pos[s]), b: Math.max(pos[u.pid], pos[s]), y: y + OV.cy }));
    let cxs = x0 + (u.width - u.childW) / 2;
    const childY = y + ROWH;
    u.groups.forEach(g => {
      const kidIds = g.units.map(cu => cu.pid);
      const kids = g.units.map(cu => { const kx = place(cu, cxs, childY, out); cxs += cu.width + SG; return kx; });
      if (!kids.length) return;
      const withSpouse = g.spouse && pos[g.spouse] != null;
      out.links.push({
        ax: withSpouse ? (pos[u.pid] + pos[g.spouse]) / 2 : pos[u.pid],
        ay: withSpouse ? y + OV.cy + 9 : y + H - 4,
        busY: y + H + (ROWH - H) / 2 - 2, kids, kidIds, childY, pid: u.pid, couple: !!withSpouse,
      });
    });
    return pos[u.pid];
  }

  function mainTree() {
    seen.clear();
    const out = { nodes: [], links: [], marriages: [], ghostLinks: [], tops: [] };
    const r = build(root, 0);
    place(r, 0, 0, out);
    return { out, width: r.width };
  }

  // Married-in people who have their own parents in the archive
  const findAnchors = out => (maxDepth < 99 ? [] : out.nodes.filter(n => !n.primary && parentFam(n.pid)));

  // Pass 1 decides on which side each branch goes; pass 2 puts that spouse on that side of the couple.
  let { out: main, width: mainW } = mainTree();
  const sides = {};
  findAnchors(main).forEach(n => { sides[n.pid] = n.x < mainW / 2 ? 'left' : 'right'; });
  spouseLeft = new Set(Object.keys(sides).filter(k => sides[k] === 'left'));
  if (spouseLeft.size) main = mainTree().out;

  const GAP = SG * 2 + 40;
  const rowOf = n => Math.round(n.y / ROWH);
  const extents = nodes => {
    const e = {};
    nodes.forEach(n => {
      const r = rowOf(n), o = e[r] || (e[r] = [Infinity, -Infinity]);
      o[0] = Math.min(o[0], n.x - W / 2); o[1] = Math.max(o[1], n.x + W / 2);
    });
    return e;
  };
  const occ = extents(main.nodes);
  const shiftOut = (o, dx, dy) => {
    o.nodes.forEach(n => { n.x += dx; n.y += dy; });
    o.links.forEach(l => { l.ax += dx; l.ay += dy; l.busY += dy; l.childY += dy; l.kids = l.kids.map(k => k + dx); });
    o.marriages.forEach(m => { m.a += dx; m.b += dx; m.y += dy; });
    o.ghostLinks.forEach(g => { g.x1 += dx; g.x2 += dx; g.y += dy; });
    o.tops.forEach(t => { t.x += dx; t.y += dy; });
  };

  findAnchors(main).forEach(real => {
    let top = real.pid, k = 0;
    for (let i = 0; i < 30; i++) {
      const next = parentFam(top)?.partners.find(x => data.people[x]);
      if (!next || seen.has(next)) break;
      top = next; k++;
    }
    if (!k) return;
    const side = sides[real.pid] || 'left';
    ghostId = real.pid; ghostSide = side;
    const unit = build(top, 0);
    ghostId = null;
    const out = { nodes: [], links: [], marriages: [], ghostLinks: [], tops: [] };
    place(unit, 0, (rowOf(real) - k) * ROWH, out);

    const ext = extents(out.nodes);
    let dx = side === 'left' ? Infinity : -Infinity;
    Object.keys(ext).forEach(r => {
      if (!occ[r]) return;
      dx = side === 'left' ? Math.min(dx, occ[r][0] - GAP - ext[r][1]) : Math.max(dx, occ[r][1] + GAP - ext[r][0]);
    });
    if (!isFinite(dx)) {
      const all = Object.values(occ), mine = Object.values(ext);
      dx = side === 'left'
        ? Math.min(...all.map(o => o[0])) - GAP - Math.max(...mine.map(o => o[1]))
        : Math.max(...all.map(o => o[1])) + GAP - Math.min(...mine.map(o => o[0]));
    }
    shiftOut(out, dx, 0);
    Object.entries(extents(out.nodes)).forEach(([r, o]) => {
      const c = occ[r] || (occ[r] = [Infinity, -Infinity]);
      c[0] = Math.min(c[0], o[0]); c[1] = Math.max(c[1], o[1]);
    });
    const g = out.nodes.find(n => n.ghost);
    if (g) main.ghostLinks.push({ x1: g.x, x2: real.x, y: real.y + OV.cy });
    main.nodes.push(...out.nodes); main.links.push(...out.links); main.marriages.push(...out.marriages); main.tops.push(...out.tops);
  });

  const minX = Math.min(...main.nodes.map(n => n.x - W / 2)), maxX = Math.max(...main.nodes.map(n => n.x + W / 2));
  const minY = Math.min(...main.nodes.map(n => n.y)), maxY = Math.max(...main.nodes.map(n => n.y));
  shiftOut(main, -minX, -minY);

  // Flip vertically: the oldest generation sits at the roots, the youngest in the crown.
  const span = maxY - minY, fy = y => span - y + TOPPAD;
  main.nodes.forEach(n => { n.gen = Math.round(n.y / ROWH); n.y = fy(n.y); });
  main.links = main.links.map(l => ({
    ax: l.ax, kids: l.kids, kidIds: l.kidIds, pid: l.pid, couple: l.couple,
    gen: Math.round((l.childY - ROWH) / ROWH), py: fy(l.childY - ROWH), cy: fy(l.childY),
  }));
  main.marriages.forEach(m => { m.y = fy(m.y - OV.cy) + OV.cy; });
  main.ghostLinks.forEach(g => { g.y = fy(g.y - OV.cy) + OV.cy; });
  main.tops.forEach(t => { t.y = fy(t.y); });
  return { ...main, span, width: maxX - minX, height: span + TOPPAD + H + TRUNK, gens: Math.round(span / ROWH) + 1 };
}

/* ---------- SVG rendering: an organic, growing tree ---------- */
function lifeLine(p) {
  const b = yr(p.birth), d = yr(p.death);
  if (b && d) return `${b} – ${d}`;
  if (b) return `* ${b}`;
  if (d) return `† ${d}`;
  return '';
}
const initials = p => (((p.first || '?')[0] || '') + ((p.last || '')[0] || '')).toUpperCase();
const ini = p => (script() === 'cyr' ? toCyr(initials(p)) : initials(p));
const roman = n => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][n] || String(n);
const rand = seed => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const LEAF = 'M0 0C6-5 7-14 0-22C-7-14-6-5 0 0Z';

// Cubic curve that leaves the start vertically and arrives at the end vertically.
function bez(x0, y0, x1, y1, bend = 0.55) {
  const dy = y0 - y1;
  const c1x = x0, c1y = y0 - dy * bend, c2x = x1, c2y = y1 + dy * 0.35;
  return t => {
    const mt = 1 - t;
    const x = mt * mt * mt * x0 + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * x1;
    const y = mt * mt * mt * y0 + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * y1;
    const dx = 3 * mt * mt * (c1x - x0) + 6 * mt * t * (c2x - c1x) + 3 * t * t * (x1 - c2x);
    const dyy = 3 * mt * mt * (c1y - y0) + 6 * mt * t * (c2y - c1y) + 3 * t * t * (y1 - c2y);
    return { x, y, a: Math.atan2(dyy, dx) };
  };
}
// Filled branch shape that tapers from width w0 to w1
function taper(x0, y0, x1, y1, w0, w1, bend) {
  const B = bez(x0, y0, x1, y1, bend), N = 26, Lp = [], Rp = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, p = B(t), w = (w0 + (w1 - w0) * t) / 2;
    const nx = -Math.sin(p.a), ny = Math.cos(p.a);
    Lp.push(`${(p.x + nx * w).toFixed(1)} ${(p.y + ny * w).toFixed(1)}`);
    Rp.unshift(`${(p.x - nx * w).toFixed(1)} ${(p.y - ny * w).toFixed(1)}`);
  }
  return `M${Lp.join('L')}L${Rp.join('L')}Z`;
}
// Points of the beaded ring around each medallion (same for every node)
const BEADS = Array.from({ length: 30 }, (_, i) => {
  const a = (i / 30) * Math.PI * 2;
  return [(Math.cos(a) * (OV.rx + 10)).toFixed(1), (OV.cy + Math.sin(a) * (OV.ry + 10)).toFixed(1)];
});

// Y of the lowest text line under a medallion (mirrors the layout of texts in treeSVG)
function textBottom(p, o) {
  if (!p) return H - 8;
  let bottom = 151, ly = 170;
  if (p.last) { bottom = 168; ly = 187; }
  if (p.nick) { bottom = ly; ly += 17; }
  if (o.years && lifeLine(p)) { bottom = ly; ly += 17; }
  if (o.maiden && p.maiden) { bottom = ly; ly += 16; }
  if (o.places && p.birthPlace) bottom = ly;
  return bottom + 4;
}

function lineage(pid) {
  const s = new Set([pid]);
  spousesOf(pid).forEach(x => s.add(x));
  (function up(id) { parentsOf(id).forEach(p => { if (!s.has(p)) { s.add(p); up(p); } }); })(pid);
  (function down(id) { childrenOf(id).forEach(c => { if (!s.has(c)) { s.add(c); down(c); } }); })(pid);
  return s;
}

function treeSVG(L, T, o) {
  const tr = s => (o.script === 'cyr' ? toCyr(s) : s);
  const eng = !!T.engrave;
  const solid = eng ? '#000' : T.accent;
  const focus = o.focus || null;
  const cls = (base, on) => (focus ? `${base} ${on ? 'lit' : 'dim'}` : base);
  const id = o.idp;
  const bark = eng ? 'fill="#fff" stroke="#000" stroke-width="1.2"' : `fill="url(#${id}bark)"`;
  const leafFill = eng ? 'fill="#fff" stroke="#000" stroke-width=".9"' : `fill="${T.leaf}"`;
  // thin paper-coloured outline so names stay readable over branches
  const halo = `paint-order="stroke" stroke="${eng ? '#fff' : T.bg}" stroke-width="4.5" stroke-linejoin="round"`;

  let s = `<defs>
    <filter id="${id}sepia" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.36 0.62 0.16 0 0.03  0.32 0.56 0.14 0 0.02  0.25 0.44 0.11 0 0  0 0 0 1 0"/></filter>
    <linearGradient id="${id}bark" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${T.bark2}"/><stop offset=".42" stop-color="${T.bark}"/><stop offset=".6" stop-color="${T.bark}"/><stop offset="1" stop-color="${T.bark2}"/></linearGradient>
    <radialGradient id="${id}ground"><stop offset="0" stop-color="${T.bark2}" stop-opacity=".45"/><stop offset="1" stop-color="${T.bark2}" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}halo"><stop offset=".55" stop-color="${T.accent}" stop-opacity=".55"/><stop offset="1" stop-color="${T.accent}" stop-opacity="0"/></radialGradient>
  </defs>`;

  // Generation numbers on the left (screen only)
  if (o.labels) {
    for (let g = 0; g < L.gens; g++) {
      const y = L.span - g * ROWH + TOPPAD + OV.cy;
      s += `<g class="genlabel" style="--d:${(0.4 + g * 0.55).toFixed(2)}s"><text x="-120" y="${y}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="46" fill="${solid}" opacity=".75">${roman(g + 1)}</text>`;
      s += `<text x="-120" y="${y + 24}" text-anchor="middle" font-family="${SANS}" font-size="8.5" letter-spacing="3" fill="${T.muted}">${esc(tr('GENERACIJA'))}</text>`;
      s += `<path d="M-150 ${y + 36}H-90" stroke="${solid}" stroke-width=".8" opacity=".5"/></g>`;
    }
  }

  let wood = '', leaves = '';
  // Trunk and roots under each oldest couple
  (L.tops || []).forEach((t, i) => {
    const main = i === 0, len = main ? TRUNK : 120, w = main ? 46 : 22;
    const base = t.y + H + len - 40;
    if (!eng) wood += `<ellipse cx="${t.x}" cy="${base + 18}" rx="${w * 4}" ry="${w * 0.7}" fill="url(#${id}ground)"/>`;
    // a lone ancestor sits on top of the trunk; a couple has it rising between them
    const trunkTop = t.single ? t.y + textBottom(data.people[t.pid], o) + 6 : t.y + OV.cy;
    wood += `<path class="branch trunk" style="--d:0s" d="${taper(t.x, base, t.x, trunkTop, w, w * (t.single ? 0.6 : 0.4), 0.5)}" ${bark}/>`;
    [-1, -0.6, -0.25, 0.2, 0.55, 1].forEach((k, j) => {
      const ex = t.x + k * w * 2.8, ey = base + 26 + rand(j + i * 7) * 34;
      wood += `<path class="branch root" style="--d:.1s" d="${taper(t.x + k * w * 0.25, base - 18, ex, ey, w * 0.42, 1.4, 0.25)}" ${bark}/>`;
    });
  });

  // Branches from parents up to each child, with leaves along them
  L.links.forEach((l, li) => {
    const w0 = Math.max(6, 24 - l.gen * 4.5), w1 = Math.max(2.4, w0 * 0.38);
    const sy = l.couple ? l.py + OV.cy : l.py + OV.cy - OV.ry - 6;
    const d = 0.35 + l.gen * 0.55;
    l.kids.forEach((kx, ki) => {
      const ky = l.cy + H - 10;
      // fan the branch bases out a little so many children don't grow from one point
      const sx = l.ax + (ki - (l.kids.length - 1) / 2) * Math.min(7, w0 * 0.35);
      const on = !focus || (focus.has(l.pid) && focus.has(l.kidIds[ki]));
      wood += `<path class="${cls('branch', on)}" style="--d:${d.toFixed(2)}s" d="${taper(sx, sy, kx, ky, w0, w1)}" ${bark}/>`;
      wood += `<circle class="${cls('knot', on)}" style="--d:${(d + 0.6).toFixed(2)}s" cx="${kx}" cy="${ky}" r="${w1 * 0.9 + 1}" fill="${eng ? '#fff' : T.bark2}"${eng ? ' stroke="#000"' : ''}/>`;
      const B = bez(sx, sy, kx, ky);
      [0.28, 0.44, 0.6, 0.74, 0.88].forEach((t, j) => {
        const r = rand(li * 31 + ki * 7 + j * 3 + 1);
        if (r < 0.18) return;
        const p = B(t), side = (j + ki) % 2 ? 1 : -1;
        const ang = (p.a * 180) / Math.PI + 90 + side * (48 + r * 28);
        const sc = 0.75 + r * 0.7;
        leaves += `<g class="${cls('leafg', on)}" transform="translate(${p.x.toFixed(1)},${p.y.toFixed(1)}) rotate(${ang.toFixed(1)}) scale(${sc.toFixed(2)})">`
          + `<g class="leaf" style="--d:${(d + 0.5 + t).toFixed(2)}s;--s:${(2.6 + r * 3).toFixed(1)}s"><path d="${LEAF}" ${leafFill} opacity="${eng ? 1 : (0.7 + r * 0.3).toFixed(2)}"/>`
          + `<path d="M0-1L0-18" stroke="${eng ? '#000' : T.leafVein}" stroke-width=".7" fill="none"/></g></g>`;
      });
    });
  });
  s += wood + leaves;

  // Golden thread from someone's place in their parents' family to their place in the main tree
  (L.ghostLinks || []).forEach(gl => {
    const a = Math.min(gl.x1, gl.x2) + OV.rx + 12, b = Math.max(gl.x1, gl.x2) - OV.rx - 12;
    if (b > a) s += `<path class="thread" d="M${a} ${gl.y}Q${(a + b) / 2} ${gl.y + 46} ${b} ${gl.y}" fill="none" stroke="${solid}" stroke-width="2" stroke-dasharray="1 8" stroke-linecap="round"/>`;
  });

  // Marriage: two linked rings between the partners
  L.marriages.forEach(m => {
    const mid = (m.a + m.b) / 2;
    s += `<g class="rings"><circle cx="${mid - 4}" cy="${m.y}" r="6" fill="none" stroke="${solid}" stroke-width="1.8"/><circle cx="${mid + 4}" cy="${m.y}" r="6" fill="none" stroke="${solid}" stroke-width="1.8"/></g>`;
  });

  // People
  L.nodes.forEach(n => {
    const p = data.people[n.pid];
    if (!p) return;
    const sel = o.selected === p.id && !n.ghost;
    const on = !focus || focus.has(p.id);
    const d = (0.75 + n.gen * 0.55 + rand(n.x) * 0.25).toFixed(2);
    let g = `<g class="${cls('node', on)}${n.ghost ? ' ghost' : ''}${sel ? ' sel' : ''}" data-pid="${p.id}" transform="translate(${n.x},${n.y})" style="--d:${d}s"${n.ghost ? ' opacity=".5"' : ''}><g class="pop">`;
    g += `<rect x="${-W / 2}" y="-30" width="${W}" height="${H + 30}" fill="transparent"/>`;
    if (sel) {
      g += `<ellipse cx="0" cy="${OV.cy}" rx="${OV.rx + 34}" ry="${OV.ry + 34}" fill="url(#${id}halo)" class="glow"/>`;
      g += `<ellipse class="halo" cx="0" cy="${OV.cy}" rx="${OV.rx + 18}" ry="${OV.ry + 18}" fill="none" stroke="${solid}" stroke-width="1.5" stroke-dasharray="3 7" stroke-linecap="round"/>`;
    }
    g += '<g class="medal">';
    if (!n.ghost) g += BEADS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="${solid}" opacity=".75"/>`).join('');
    // sprig on top
    const ty = OV.cy - OV.ry - 12;
    g += `<g transform="translate(0,${ty})"><path d="${LEAF}" transform="rotate(-62) scale(.7)" ${leafFill}/><path d="${LEAF}" transform="rotate(62) scale(.7)" ${leafFill}/><circle r="3.4" fill="${solid}"/></g>`;
    g += `<ellipse cx="0" cy="${OV.cy}" rx="${OV.rx + 5}" ry="${OV.ry + 5}" fill="none" stroke="${solid}" stroke-width=".9"/>`;
    g += `<ellipse class="ring" cx="0" cy="${OV.cy}" rx="${OV.rx}" ry="${OV.ry}" fill="${eng ? '#fff' : T.node}" stroke="${solid}" stroke-width="${sel ? 3 : 2}"${n.ghost ? ' stroke-dasharray="5 5"' : ''}/>`;
    if (p.photo && o.photos && !eng && !n.ghost) {
      const cid = `${id}c${p.id}`;
      g += `<clipPath id="${cid}"><ellipse cx="0" cy="${OV.cy}" rx="${OV.rx - 1}" ry="${OV.ry - 1}"/></clipPath>`;
      g += `<image href="${p.photo}" x="${-OV.rx}" y="${OV.cy - OV.ry}" width="${OV.rx * 2}" height="${OV.ry * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${cid})"${o.sepia ? ` filter="url(#${id}sepia)"` : ''}/>`;
    } else {
      g += `<text x="0" y="${OV.cy + 12}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-weight="500" font-size="34" fill="${solid}">${esc(tr(initials(p)))}</text>`;
    }
    g += `<ellipse cx="0" cy="${OV.cy}" rx="${OV.rx - 5}" ry="${OV.ry - 5}" fill="none" stroke="${solid}" stroke-width=".6" opacity=".55"/>`;
    g += '</g>';

    // Ribbon with the name
    const name = tr(p.first || '');
    const hw = Math.max(44, Math.min(76, name.length * 5.2 + 22));
    const rib = eng ? '#fff' : T.ribbon, rib2 = eng ? '#fff' : T.ribbon2;
    g += `<path d="M${-hw + 6} 127H${-hw - 16}L${-hw - 8} 137L${-hw - 16} 147H${-hw + 6}Z" fill="${rib2}" stroke="${solid}" stroke-width=".9"/>`;
    g += `<path d="M${hw - 6} 127H${hw + 16}L${hw + 8} 137L${hw + 16} 147H${hw - 6}Z" fill="${rib2}" stroke="${solid}" stroke-width=".9"/>`;
    g += `<path d="M${-hw} 123Q0 116 ${hw} 123V151Q0 144 ${-hw} 151Z" fill="${rib}" stroke="${solid}" stroke-width="1.1"/>`;
    g += `<text x="0" y="142" text-anchor="middle" font-family="${SERIF}" font-weight="600" font-size="18" fill="${T.ink}">${esc(name)}</text>`;

    let ly = 170;
    if (p.last) { g += `<text x="0" y="168" text-anchor="middle" font-family="${SANS}" font-weight="500" font-size="9.5" letter-spacing="2.4" fill="${T.muted}" ${halo}>${esc(tr(p.last.toUpperCase()))}</text>`; ly = 187; }
    if (p.nick) { g += `<text x="0" y="${ly}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="15" fill="${T.muted}" ${halo}>${esc(tr('„' + p.nick + '“'))}</text>`; ly += 17; }
    if (o.years) {
      const life = lifeLine(p);
      if (life) { g += `<text x="0" y="${ly}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="15" fill="${T.ink}" ${halo}>${esc(life)}</text>`; ly += 17; }
    }
    if (o.maiden && p.maiden) { g += `<text x="0" y="${ly}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="13" fill="${T.muted}" ${halo}>${esc(tr('rođ. ' + p.maiden))}</text>`; ly += 16; }
    if (o.places && p.birthPlace) g += `<text x="0" y="${ly}" text-anchor="middle" font-family="${SANS}" font-size="9.5" fill="${T.muted}" ${halo}>${esc(tr(p.birthPlace))}</text>`;
    s += g + '</g></g>';
  });
  return s;
}

/* Full printable sheet: background, frame, title, tree, footer */
function poster(o, fontCSS = '') {
  const T = THEMES[o.theme] || THEMES.pergament;
  const L = layout(o.root, o.gens || 99);
  const tr = s => (o.script === 'cyr' ? toCyr(s) : s);
  const tw = Math.max(L.width, W), th = L.height;
  let vbW, vbH, m, Ht, s, tx, ty, mmW, mmH;

  if (o.paper === 'auto') {
    m = Math.max(90, Math.max(tw, th) * 0.06);
    Ht = o.showTitle ? Math.max(240, tw * 0.1) : 0;
    vbW = tw + 2 * m; vbH = th + Ht + 2 * m + m * 0.4; s = 1; tx = m; ty = m + Ht;
    const k = 594 / Math.max(vbW, vbH); mmW = vbW * k; mmH = vbH * k;
  } else {
    let [pw, ph] = PAPERS[o.paper];
    const land = o.orient === 'land' || (o.orient === 'auto' && tw > th * 1.15);
    if (land) [pw, ph] = [ph, pw];
    mmW = pw; mmH = ph; vbW = pw * 4; vbH = ph * 4;
    m = Math.min(vbW, vbH) * 0.065;
    Ht = o.showTitle ? vbH * 0.15 : 0;
    const aw = vbW - 2 * m, ah = vbH - 2 * m - Ht - m * 0.4;
    s = Math.min(aw / tw, ah / th);
    tx = m + (aw - tw * s) / 2; ty = m + Ht + (ah - th * s) / 2;
  }

  const u = Math.max(vbW, vbH) / 1000; // stroke unit
  const ac = T.engrave ? '#000' : T.accent;
  const id = o.idp;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW.toFixed(1)} ${vbH.toFixed(1)}" width="${vbW.toFixed(0)}" height="${vbH.toFixed(0)}">`;
  out += fontCSS;
  out += `<defs>
    <filter id="${id}grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${(0.9 * 1000 / Math.max(vbW, 1000)).toFixed(3)}" numOctaves="3" seed="4"/><feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.3  0 0 0 0 0.15  0.5 0 0 0 -0.16"/></filter>
    <filter id="${id}stain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${(2.5 / vbW).toFixed(5)}" numOctaves="2" seed="11"/><feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.36  0 0 0 0 0.16  0.55 0 0 0 -0.22"/></filter>
    <radialGradient id="${id}vig" cx="50%" cy="50%" r="72%"><stop offset="60%" stop-color="#6b4a20" stop-opacity="0"/><stop offset="100%" stop-color="#6b4a20" stop-opacity=".22"/></radialGradient>
  </defs>`;
  out += `<rect width="100%" height="100%" fill="${T.bg}"/>`;
  if (T.texture) {
    out += `<rect width="100%" height="100%" filter="url(#${id}stain)"/>`;
    out += `<rect width="100%" height="100%" filter="url(#${id}grain)"/>`;
    out += `<rect width="100%" height="100%" fill="url(#${id}vig)"/>`;
  }

  // Double frame with corner diamonds
  const f1 = m * 0.36, f2 = m * 0.48;
  out += `<rect x="${f1}" y="${f1}" width="${vbW - 2 * f1}" height="${vbH - 2 * f1}" fill="none" stroke="${ac}" stroke-width="${1.6 * u}"/>`;
  out += `<rect x="${f2}" y="${f2}" width="${vbW - 2 * f2}" height="${vbH - 2 * f2}" fill="none" stroke="${ac}" stroke-width="${0.6 * u}"/>`;
  const dd = (f2 - f1) * 0.9;
  [[f1, f1], [vbW - f1, f1], [f1, vbH - f1], [vbW - f1, vbH - f1]].forEach(([x, y]) => {
    out += `<path d="M${x} ${y - dd}L${x + dd} ${y}L${x} ${y + dd}L${x - dd} ${y}Z" fill="${T.engrave ? '#fff' : T.bg}" stroke="${ac}" stroke-width="${1.2 * u}"/>`;
  });

  // Title block
  if (o.showTitle) {
    const cx = vbW / 2;
    const ts = Math.min(Ht * 0.36, vbW * 0.055);
    out += `<text x="${cx}" y="${m + Ht * 0.5}" text-anchor="middle" font-family="${SERIF}" font-weight="500" font-size="${ts}" fill="${T.ink}">${esc(tr(o.title || ''))}</text>`;
    const dy = m + Ht * 0.68, w1 = ts * 3.2, w0 = ts * 0.45, d = ts * 0.1;
    out += `<path d="M${cx - w1} ${dy}H${cx - w0}M${cx + w0} ${dy}H${cx + w1}" stroke="${ac}" stroke-width="${1 * u}"/>`;
    out += `<path d="M${cx} ${dy - d}L${cx + d} ${dy}L${cx} ${dy + d}L${cx - d} ${dy}Z" fill="${ac}"/>`;
    out += `<circle cx="${cx - w0 * 0.6}" cy="${dy}" r="${d * 0.35}" fill="${ac}"/><circle cx="${cx + w0 * 0.6}" cy="${dy}" r="${d * 0.35}" fill="${ac}"/>`;
    if (o.subtitle) out += `<text x="${cx}" y="${m + Ht * 0.88}" text-anchor="middle" font-family="${SANS}" font-weight="500" font-size="${ts * 0.2}" letter-spacing="${ts * 0.06}" fill="${T.muted}">${esc(tr(o.subtitle.toUpperCase()))}</text>`;
  }

  out += `<g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${s.toFixed(4)})">${treeSVG(L, T, o)}</g>`;

  const now = new Date();
  const months = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];
  out += `<text x="${vbW / 2}" y="${vbH - f2 - m * 0.16}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="${m * 0.17}" fill="${T.muted}">${esc(tr(`Sastavljeno ${months[now.getMonth()]} ${now.getFullYear()}.`))}</text>`;
  out += '</svg>';
  return { svg: out, vbW, vbH, mmW, mmH, gens: L.gens, count: L.nodes.filter(n => !n.ghost).length };
}

/* ---------- Screen: scene, camera, interaction ---------- */
const svgEl = $('#treeSvg'), vp = $('#viewport'), canvas = $('#canvas');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function renderTree() {
  const T = THEMES[theme()];
  const L = layout(rootId());
  state.layout = L;
  const cs = canvas.style;
  cs.setProperty('--scene', T.scene); cs.setProperty('--glow', T.glow); cs.setProperty('--vig', T.vig);
  document.body.dataset.theme = theme();
  vp.innerHTML = treeSVG(L, T, {
    idp: 's', script: script(), photos: true, sepia: theme() === 'pergament', years: true, maiden: true, places: false,
    selected: state.selected, focus: state.selected ? lineage(state.selected) : null, labels: true,
  });
}
function applyView() { const v = state.view; vp.setAttribute('transform', `translate(${v.tx.toFixed(2)},${v.ty.toFixed(2)}) scale(${v.k.toFixed(4)})`); }

let camAnim = 0;
function animateView(target, dur = 900) {
  cancelAnimationFrame(camAnim);
  if (reduceMotion) { state.view = target; applyView(); return; }
  const from = { ...state.view }, t0 = performance.now();
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const step = now => {
    const t = Math.min(1, (now - t0) / dur), e = ease(t);
    state.view = { tx: from.tx + (target.tx - from.tx) * e, ty: from.ty + (target.ty - from.ty) * e, k: from.k + (target.k - from.k) * e };
    applyView();
    if (t < 1) camAnim = requestAnimationFrame(step);
  };
  camAnim = requestAnimationFrame(step);
}
const isPhone = () => innerWidth <= 860;
const panelOpen = () => panel.classList.contains('open') && !isPhone();
function usable() {
  const r = svgEl.getBoundingClientRect();
  if (isPhone()) {
    const top = $('.topbar').getBoundingClientRect().bottom + 12;
    const h = panel.classList.contains('open') ? innerHeight - panel.offsetHeight - 16 : r.height;
    return { w: r.width, h, top };
  }
  return { w: r.width - (panelOpen() ? 420 : 0), h: r.height, top: 90 };
}
function fitView(full = false) {
  const L = state.layout, u = usable();
  // On phones the default view fills the screen height and centres the main trunk;
  // the rest of the tree is a swipe away.
  if (isPhone() && !full) {
    const k = Math.min(0.5, (u.h - u.top - 10) / L.height);
    const cx = (L.tops[0] || { x: L.width / 2 }).x;
    return { k, tx: u.w / 2 - cx * k, ty: u.top + (u.h - u.top - L.height * k) / 2 };
  }
  const x0 = -175, x1 = L.width + 20, y0 = 0, y1 = L.height;
  const k = Math.min((u.w - 60) / (x1 - x0), (u.h - u.top - 30) / (y1 - y0), 1.1);
  return { k, tx: (u.w - (x1 - x0) * k) / 2 - x0 * k, ty: u.top + (u.h - u.top - 20 - (y1 - y0) * k) / 2 - y0 * k };
}
function fit(animate = true) { if (!state.layout) return; const v = fitView(); if (animate) animateView(v); else { state.view = v; applyView(); } }
function centerOn(pid) {
  const n = state.layout?.nodes.find(n => n.pid === pid && !n.ghost); if (!n) return;
  const u = usable(), k = Math.max(state.view.k, isPhone() ? 0.7 : 0.85);
  animateView({ k, tx: u.w / 2 - n.x * k, ty: u.top / 2 + u.h / 2 - (n.y + 90) * k }, 1100);
}
function zoomAt(f, mx, my) {
  cancelAnimationFrame(camAnim);
  const v = state.view, nk = Math.min(3, Math.max(0.1, v.k * f));
  v.tx = mx - (mx - v.tx) * (nk / v.k); v.ty = my - (my - v.ty) * (nk / v.k); v.k = nk;
  applyView();
}

// Tree grows from the roots, generation by generation, while the camera pulls back
let growT;
function growTree() {
  if (reduceMotion) { fit(false); return; }
  const L = state.layout;
  svgEl.classList.remove('grow'); void svgEl.getBoundingClientRect(); svgEl.classList.add('grow');
  clearTimeout(growT); growT = setTimeout(() => svgEl.classList.remove('grow'), (L.gens * 0.55 + 3.5) * 1000);
  const end = fitView(), t = L.tops[0] || { x: L.width / 2, y: L.height };
  const u = usable(), k = end.k * 1.9;
  state.view = { k, tx: u.w / 2 - t.x * k, ty: u.h * 0.62 - (t.y + H) * k };
  applyView();
  const startView = { ...state.view };
  setTimeout(() => animateView(end, 3400), 250);
  // safety net: if the camera got stuck at the start, settle it on the final view
  setTimeout(() => { const v = state.view; if (v.k === startView.k && v.tx === startView.tx) animateView(fitView(), 900); }, 4200);
}

svgEl.addEventListener('wheel', e => {
  e.preventDefault();
  const r = svgEl.getBoundingClientRect();
  zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
}, { passive: false });

// One finger / mouse pans, two fingers pinch-zoom, a tap selects
let drag = null, pinch = null;
const pts = new Map();
const local = e => { const r = svgEl.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
svgEl.addEventListener('pointerdown', e => {
  cancelAnimationFrame(camAnim);
  pts.set(e.pointerId, local(e));
  svgEl.setPointerCapture(e.pointerId);
  if (pts.size === 2) {
    const [a, b] = [...pts.values()];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, v = state.view;
    pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, k: v.k, wx: (mid.x - v.tx) / v.k, wy: (mid.y - v.ty) / v.k };
    if (drag) drag.moved = true;
    return;
  }
  drag = { x: e.clientX, y: e.clientY, tx: state.view.tx, ty: state.view.ty, moved: false, node: e.target.closest('.node')?.dataset.pid };
});
svgEl.addEventListener('pointermove', e => {
  if (!pts.has(e.pointerId)) return;
  pts.set(e.pointerId, local(e));
  if (pinch && pts.size >= 2) {
    const [a, b] = [...pts.values()];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const k = Math.min(3, Math.max(0.05, pinch.k * Math.hypot(a.x - b.x, a.y - b.y) / pinch.dist));
    state.view = { k, tx: mid.x - pinch.wx * k, ty: mid.y - pinch.wy * k };
    applyView();
    return;
  }
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) > 6) { drag.moved = true; svgEl.classList.add('panning'); hideTip(); }
  if (drag.moved) { state.view.tx = drag.tx + dx; state.view.ty = drag.ty + dy; applyView(); }
});
function endPointer(e) {
  pts.delete(e.pointerId);
  if (pinch) {
    if (pts.size < 2) pinch = null;
    // keep panning with the finger that stays down
    if (pts.size === 1) {
      const [p] = pts.values(), r = svgEl.getBoundingClientRect();
      drag = { x: p.x + r.left, y: p.y + r.top, tx: state.view.tx, ty: state.view.ty, moved: true };
    } else drag = null;
    return;
  }
  if (e.type === 'pointerup' && drag && !drag.moved) {
    if (drag.node) { select(drag.node); centerOn(drag.node); } else if (state.selected) select(null);
  }
  drag = null; svgEl.classList.toggle('panning', false);
}
svgEl.addEventListener('pointerup', endPointer);
svgEl.addEventListener('pointercancel', endPointer);
$$('.zoom button').forEach(b => b.addEventListener('click', () => {
  const r = svgEl.getBoundingClientRect(), z = b.dataset.z;
  if (z === 'fit') animateView(fitView(true));
  else if (z === 'grow') growTree();
  else zoomAt(z === 'in' ? 1.25 : 0.8, r.width / 2, r.height / 2);
}));

// Hover card
const tip = $('#tip');
function hideTip() { tip.classList.remove('on'); }
svgEl.addEventListener('pointermove', e => {
  if (drag?.moved || e.pointerType === 'touch') return;
  const n = e.target.closest('.node');
  if (!n) return hideTip();
  const p = data.people[n.dataset.pid];
  const life = lifeLine(p);
  tip.innerHTML = `<b>${esc(p.first)}${p.nick ? ` <i>„${esc(p.nick)}“</i>` : ''} ${esc(p.last)}</b>`
    + `<span>${esc(life || 'godine još nisu upisane')}${p.maiden ? ` · rođ. ${esc(p.maiden)}` : ''}</span>`
    + `<em>${n.classList.contains('ghost') ? 'Prikaz u roditeljskoj porodici' : 'Klik za priču i lozu'}</em>`;
  const x = Math.min(e.clientX + 18, innerWidth - 260), y = Math.min(e.clientY + 18, innerHeight - 90);
  tip.style.transform = `translate(${x}px, ${y}px)`;
  tip.classList.add('on');
});
svgEl.addEventListener('pointerleave', hideTip);

/* Floating gold dust and the occasional falling leaf */
function ambient() {
  const c = $('#ambient'), ctx = c.getContext('2d');
  if (reduceMotion) return;
  let w = 0, h = 0, dpr = 1;
  const size = () => { dpr = Math.min(2, devicePixelRatio || 1); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; };
  new ResizeObserver(size).observe(c); size();
  const motes = Array.from({ length: isPhone() ? 36 : 70 },() => ({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.9, vy: 0.00004 + Math.random() * 0.00012, ph: Math.random() * 6.28, sp: 0.5 + Math.random() }));
  const falling = [];
  let nextLeaf = performance.now() + 1500;
  const leafPath = new Path2D('M0 0C6-5 7-14 0-22C-7-14-6-5 0 0Z');
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const T = THEMES[theme()];
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    motes.forEach(m => {
      m.y -= m.vy * 16; if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
      const x = (m.x + Math.sin(now * 0.0004 * m.sp + m.ph) * 0.01) * w, y = m.y * h;
      const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(now * 0.0016 * m.sp + m.ph));
      const g = ctx.createRadialGradient(x, y, 0, x, y, m.r * 5);
      g.addColorStop(0, `rgba(${T.dust},${a})`); g.addColorStop(1, `rgba(${T.dust},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, m.r * 5, 0, 6.29); ctx.fill();
    });
    if (now > nextLeaf && falling.length < 6) {
      falling.push({ x: Math.random() * w, y: -30, vx: (Math.random() - 0.5) * 0.4, vy: 0.45 + Math.random() * 0.5, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.03, s: 0.6 + Math.random() * 0.6, ph: Math.random() * 6.28 });
      nextLeaf = now + 2200 + Math.random() * 3500;
    }
    for (let i = falling.length - 1; i >= 0; i--) {
      const f = falling[i];
      f.y += f.vy; f.x += f.vx + Math.sin(now * 0.0015 + f.ph) * 0.6; f.rot += f.vr;
      if (f.y > h + 40) { falling.splice(i, 1); continue; }
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot + Math.sin(now * 0.002 + f.ph) * 0.5); ctx.scale(f.s, f.s);
      ctx.globalAlpha = 0.55; ctx.fillStyle = T.leaf; ctx.fill(leafPath);
      ctx.restore();
    }
  }
  requestAnimationFrame(frame);
}

/* Opening screen */
function intro() {
  const el = $('#intro');
  if (!el) return;
  const tr = s => (script() === 'cyr' ? toCyr(s) : s);
  const words = tr(data.title).split(' ');
  let i = 0;
  $('#introTitle').innerHTML = words.map(wd => `<span class="word">${[...wd].map(ch => `<span class="ch" style="--i:${i++}">${esc(ch)}</span>`).join('')}</span>`).join(' ');
  const L = state.layout;
  $('#introSub').textContent = tr(`${Object.keys(data.people).length} imena · ${L.gens} generacija · jedna loza`);
  let done = false;
  const enter = () => {
    if (done) return; done = true;
    el.classList.add('out');
    document.body.classList.remove('intro-on');
    setTimeout(() => { el.hidden = true; }, 1500);
    growTree();
  };
  $('#introBtn').addEventListener('click', enter);
  document.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') enter(); }, { once: true });
}

/* ---------- Side card ---------- */
const panel = $('#panel');

function select(pid, edit = false) {
  state.selected = pid && data.people[pid] ? pid : null;
  state.editing = edit;
  if (state.selected) state.overview = false;
  svgEl.classList.remove('grow'); // a click ends the growth animation instead of restarting it
  renderTree(); renderPanel();
}

function relLabel(pid, kind) {
  const g = data.people[pid].gender;
  if (kind === 'parent') return g === 'm' ? 'otac' : g === 'f' ? 'majka' : 'roditelj';
  if (kind === 'spouse') return g === 'm' ? 'suprug' : g === 'f' ? 'supruga' : 'supružnik';
  if (kind === 'sibling') return g === 'm' ? 'brat' : g === 'f' ? 'sestra' : 'brat/sestra';
  return g === 'm' ? 'sin' : g === 'f' ? 'ćerka' : 'dete';
}
function rel(pid, kind) {
  const p = data.people[pid];
  const face = p.photo ? `<img src="${p.photo}" alt="">` : esc(ini(p));
  return `<button class="rel" data-go="${pid}"><span class="rel-m">${face}</span><span class="rel-t">${esc(p.first)}${p.nick ? ` „${esc(p.nick)}“` : ''}<small>${relLabel(pid, kind)}</small></span></button>`;
}

function renderPanel() {
  const p = data.people[state.selected];
  panel.classList.toggle('open', !!p || !!state.overview);
  document.body.classList.toggle('sheet-open', !!p || !!state.overview);
  document.body.classList.toggle('menu-open', false);
  if (!p) { if (state.overview) renderOverview(); return; }
  if (state.editing) return renderEdit(p);

  const parents = parentsOf(p.id), spouses = spousesOf(p.id), kids = childrenOf(p.id);
  const siblings = (parentFam(p.id)?.children || []).filter(c => c !== p.id && data.people[c]);
  const born = [p.birth, p.birthPlace].filter(Boolean).join(', ');
  const died = [p.death, p.deathPlace].filter(Boolean).join(', ');
  const life = lifeLine(p);
  let h = `<button class="panel-x" data-act="close" aria-label="Zatvori">×</button><div class="reveal">
    <div class="seal" aria-hidden="true">${esc(ini(p))}</div>
    <div class="frame"><div class="portrait">${p.photo ? `<img src="${p.photo}" alt="">` : `<span>${esc(ini(p))}</span>`}</div></div>
    <h2 class="pname">${esc(p.first)}</h2>
    ${p.nick ? `<div class="nick">„${esc(p.nick)}“</div>` : ''}
    <div class="plast">${esc(p.last || '')}</div>
    <div class="life"><span>✦</span>${esc(life || 'godine čekaju da budu upisane')}<span>✦</span></div>
    ${p.maiden ? `<div class="maiden">rođ. ${esc(p.maiden)}</div>` : ''}
    ${born || died ? `<dl class="facts">${born ? `<dt>Rođenje</dt><dd>${esc(born)}</dd>` : ''}${died ? `<dt>Smrt</dt><dd>${esc(died)}</dd>` : ''}</dl>` : ''}
    <div class="orn"><i></i><b>❦</b><i></i></div>
    <h3>Priča</h3>
    ${p.bio ? `<p class="story">${esc(p.bio)}</p>` : '<p class="story empty">Ova stranica čeka svoju priču — zanimanje, uspomene, anegdotu koju porodica prepričava. Kliknite „Uredi“.</p>'}
    ${parents.length ? `<h3>Roditelji</h3><div class="rels">${parents.map(x => rel(x, 'parent')).join('')}</div>` : ''}
    ${spouses.length ? `<h3>Brak</h3><div class="rels">${spouses.map(x => rel(x, 'spouse')).join('')}</div>` : ''}
    ${siblings.length ? `<h3>Braća i sestre</h3><div class="rels">${siblings.map(x => rel(x, 'sibling')).join('')}</div>` : ''}
    ${kids.length ? `<h3>Deca</h3><div class="rels">${kids.map(x => rel(x, 'child')).join('')}</div>` : ''}
    <p class="hint">Na stablu je zlatom istaknuta loza: preci i potomci.</p>
    <div class="actions"><button class="btn primary sm" data-act="edit">Uredi</button>`;
  const fams = famsOf(p.id);
  if (fams.length <= 1) h += '<button class="btn sm" data-act="child">+ Dete</button>';
  else fams.forEach(f => { const sp = data.people[f.partners.find(x => x !== p.id)]; h += `<button class="btn sm" data-act="child" data-fam="${f.id}">+ Dete${sp ? ' sa ' + esc(sp.first) : ''}</button>`; });
  h += '<button class="btn sm" data-act="spouse">+ Supružnik</button>';
  if (!parentFam(p.id)) h += '<button class="btn sm" data-act="parents">+ Roditelji</button>';
  if (p.id !== rootId()) h += '<button class="btn ghost danger sm" data-act="delete">Obriši</button>';
  h += '</div></div>';
  panel.innerHTML = h;
  panel.scrollTop = 0;
}

function renderOverview() {
  const L = state.layout || layout(rootId());
  const years = Object.values(data.people).map(p => parseInt(yr(p.birth))).filter(Boolean);
  panel.innerHTML = `<button class="panel-x" data-act="close" aria-label="Zatvori">×</button><div class="reveal">
    <div class="kicker">Porodična arhiva</div>
    <h2 class="pname script">${esc(data.title)}</h2>
    <div class="orn"><i></i><b>❦</b><i></i></div>
    <div class="stats">
      <div class="stat"><b>${Object.keys(data.people).length}</b><span>imena</span></div>
      <div class="stat"><b>${roman(L.gens)}</b><span>generacija</span></div>
      <div class="stat"><b>${years.length ? Math.min(...years) : '—'}</b><span>najstariji zapis</span></div>
    </div>
    <div class="form"><label>Naziv porodice<input data-title value="${esc(data.title)}"></label></div>
    <p class="muted">Kliknite na medaljon da otvorite priču te osobe i vidite njenu lozu. Prevlačite da šetate kroz stablo, točkićem uvećavate, a ✦ dole levo ponovo pušta rast drveta.</p>
    <p class="muted">Podaci se čuvaju u ovom pregledaču. Za rezervnu kopiju ili deljenje sa rođacima: <b>Izvezi → Arhiva (JSON)</b>, a oni je otvaraju preko <b>Uvezi</b>.</p>
    <div class="actions">
      <button class="btn primary sm" data-act="select-root">Kreni od korena</button>
      <button class="btn ghost sm" data-act="sample">Vrati početne podatke</button>
      <button class="btn ghost sm" data-act="new">Novo prazno stablo</button>
    </div></div>`;
}

function renderEdit(p) {
  const f = (k, label, ph = '') => `<label>${label}<input data-field="${k}" value="${esc(p[k])}" placeholder="${ph}"></label>`;
  panel.innerHTML = `<button class="panel-x" data-act="close" aria-label="Zatvori">×</button><div class="reveal">
    <div class="kicker">Uređivanje</div>
    <div class="frame"><div class="portrait">${p.photo ? `<img src="${p.photo}" alt="">` : `<span>${esc(ini(p))}</span>`}</div></div>
    <div class="actions" style="justify-content:center;margin-top:0">
      <label class="btn sm" style="cursor:pointer">Izaberi fotografiju<input type="file" accept="image/*" data-photo hidden></label>
      ${p.photo ? '<button class="btn ghost sm" data-act="rm-photo">Ukloni</button>' : ''}
    </div>
    <div class="form" style="margin-top:14px">
      <div class="two">${f('first', 'Ime')}${f('last', 'Prezime')}</div>
      ${f('nick', 'Nadimak', 'npr. Mile, Jela')}
      <div class="two">${f('maiden', 'Rođeno prezime')}
        <label>Pol<select data-field="gender">
          <option value="" ${!p.gender ? 'selected' : ''}>—</option>
          <option value="m" ${p.gender === 'm' ? 'selected' : ''}>Muški</option>
          <option value="f" ${p.gender === 'f' ? 'selected' : ''}>Ženski</option>
        </select></label></div>
      <div class="two">${f('birth', 'Rođen(a)', 'npr. 1932 ili 12.03.1932')}${f('birthPlace', 'Mesto rođenja')}</div>
      <div class="two">${f('death', 'Preminuo/la', 'prazno ako je živ(a)')}${f('deathPlace', 'Mesto smrti')}</div>
      <label>Priča, uspomene, zanimanje<textarea data-field="bio">${esc(p.bio)}</textarea></label>
    </div>
    <div class="actions"><button class="btn primary sm" data-act="done">Gotovo</button></div></div>`;
}

let renderT;
panel.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.title !== undefined) { data.title = el.value; $('#docTitle').textContent = data.title; save(); return; }
  const k = el.dataset.field; if (!k) return;
  data.people[state.selected][k] = el.value;
  save();
  clearTimeout(renderT); renderT = setTimeout(renderTree, 120);
});
panel.addEventListener('change', async e => {
  if (e.target.dataset.photo === undefined || !e.target.files[0]) return;
  try {
    data.people[state.selected].photo = await readPhoto(e.target.files[0]);
    save(); renderTree(); renderPanel();
  } catch { toast('Fotografija nije mogla da se učita.'); }
});
panel.addEventListener('click', e => {
  const go = e.target.closest('[data-go]');
  if (go) { select(go.dataset.go); centerOn(go.dataset.go); return; }
  if (!state.selected && !['close', 'select-root', 'new', 'sample'].includes(e.target.closest('[data-act]')?.dataset.act)) return;
  const b = e.target.closest('[data-act]'); if (!b) return;
  const p = data.people[state.selected];
  const act = b.dataset.act;
  if (act === 'close') { state.overview = false; if (state.selected) select(null); else renderPanel(); setTimeout(() => fit(), 50); }
  else if (act === 'edit') { state.editing = true; renderPanel(); }
  else if (act === 'done') { state.editing = false; renderPanel(); }
  else if (act === 'rm-photo') { p.photo = ''; save(); renderTree(); renderPanel(); }
  else if (act === 'child') addChild(p.id, b.dataset.fam);
  else if (act === 'spouse') addSpouse(p.id);
  else if (act === 'parents') addParents(p.id);
  else if (act === 'delete') removePerson(p.id);
  else if (act === 'select-root') { select(rootId()); centerOn(rootId()); }
  else if (act === 'new') { if (confirm('Obrisati trenutno stablo i početi od nule? Prvo izvezite arhivu ako želite kopiju.')) reset(emptyData()); }
  else if (act === 'sample') { if (confirm('Vratiti početne podatke porodice? Sve izmene napravljene na stranici biće izgubljene.')) reset(sampleData()); }
});

function newPerson(extra) {
  const id = uid();
  data.people[id] = { id, first: 'Novo', last: '', gender: '', birth: '', death: '', birthPlace: '', deathPlace: '', maiden: '', photo: '', bio: '', ...extra };
  return id;
}
function afterAdd(id) { save(); select(id, true); setTimeout(() => { centerOn(id); $('[data-field="first"]')?.select(); }, 30); }

function addChild(pid, famId) {
  let fam = famId ? data.families.find(f => f.id === famId) : famsOf(pid).at(-1);
  if (!fam) { fam = { id: 'f' + uid(), partners: [pid], children: [] }; data.families.push(fam); }
  const lastName = data.people[fam.partners.find(x => data.people[x]?.gender === 'm') || pid].last;
  const id = newPerson({ first: 'Dete', last: lastName });
  fam.children.push(id);
  afterAdd(id);
}
function addSpouse(pid) {
  const id = newPerson({ first: 'Supružnik', last: data.people[pid].last });
  const single = famsOf(pid).find(f => f.partners.length === 1);
  if (single) single.partners.push(id); else data.families.push({ id: 'f' + uid(), partners: [pid, id], children: [] });
  afterAdd(id);
}
function addParents(pid) {
  const last = data.people[pid].maiden || data.people[pid].last;
  const father = newPerson({ first: 'Otac', last, gender: 'm' });
  const mother = newPerson({ first: 'Majka', last, gender: 'f' });
  data.families.push({ id: 'f' + uid(), partners: [father, mother], children: [pid] });
  if (pid === rootId()) data.root = father;
  afterAdd(father);
}
function removePerson(pid) {
  const p = data.people[pid];
  const spouseOnly = state.layout?.nodes.some(n => n.pid === pid && !n.primary && !n.ghost);
  if (spouseOnly) {
    if (!confirm(`Obrisati ${p.first} ${p.last}?`)) return;
    data.families.forEach(f => { f.partners = f.partners.filter(x => x !== pid); });
  } else {
    const gone = new Set();
    (function walk(id) {
      gone.add(id);
      famsOf(id).forEach(f => {
        f.partners.forEach(x => { if (x !== id && !parentFam(x)) gone.add(x); });
        f.children.forEach(walk);
      });
    })(pid);
    const extra = gone.size - 1;
    if (!confirm(`Obrisati ${p.first} ${p.last}${extra ? ` i još ${extra} (supružnike i potomke)` : ''}? Ovo se ne može poništiti.`)) return;
    gone.forEach(id => delete data.people[id]);
    data.families = data.families.filter(f => !f.partners.some(x => gone.has(x) && !data.people[x]) || f.partners.some(x => data.people[x] && !gone.has(x)));
  }
  data.families.forEach(f => { f.partners = f.partners.filter(x => data.people[x]); f.children = f.children.filter(x => data.people[x]); });
  data.families = data.families.filter(f => f.partners.length && (f.partners.length > 1 || f.children.length));
  save(); select(null);
}
function reset(d) { data = d; data.settings = data.settings || {}; save(); syncChrome(); select(null); fit(); }

function readPhoto(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = rej;
    fr.onload = () => {
      const img = new Image();
      img.onerror = rej;
      img.onload = () => {
        const k = Math.min(1, 420 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.85));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/* ---------- Top bar ---------- */
function syncChrome() {
  $('#docTitle').textContent = data.title;
  document.title = (script() === 'cyr' ? uiCyr : String)(data.title + ' · Porodično stablo');
  translitUI();
  $$('#scriptSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === script()));
  $('#themeSel').value = theme();
}
$('#themeSel').innerHTML = ['pergament', 'moderno', 'noc'].map(k => `<option value="${k}">${THEMES[k].name}</option>`).join('');
$('#themeSel').addEventListener('change', e => { data.settings.theme = e.target.value; save(); renderTree(); });
$$('#scriptSeg button').forEach(b => b.addEventListener('click', () => { data.settings.script = b.dataset.v; save(); syncChrome(); renderTree(); }));

$('#search').addEventListener('input', e => {
  const q = norm(e.target.value.trim()); if (!q) return;
  const hit = Object.values(data.people).find(p => norm(`${p.first} ${p.last} ${p.maiden} ${p.nick || ''}`).includes(q));
  if (hit) { select(hit.id); centerOn(hit.id); }
});

$('#importBtn').addEventListener('click', () => $('#importFile').click());
$('#importFile').addEventListener('change', async e => {
  const file = e.target.files[0]; e.target.value = '';
  if (!file) return;
  try {
    const d = JSON.parse(await file.text());
    if (!valid(d)) throw new Error();
    if (confirm(`Uvesti „${d.title || 'arhivu'}“ (${Object.keys(d.people).length} osoba)? Trenutno stablo biće zamenjeno.`)) { reset(d); toast('Arhiva je uvezena.'); }
  } catch { toast('Ovo nije ispravan fajl arhive.'); }
});

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 3200);
}

/* ---------- Export ---------- */
const ex = {
  format: 'png', theme: theme(), script: script(), paper: 'A3', orient: 'auto', res: 4000, scope: 'all', gens: 0,
  photos: true, sepia: true, years: true, maiden: true, places: false, showTitle: true, title: '', subtitle: '',
};
const modal = $('#exportModal');

$('#exFormats').innerHTML = FORMATS.map(f => `<button class="fmt" data-f="${f.id}"><b>${f.name}</b><span>${f.desc}</span></button>`).join('');
$('#exTheme').innerHTML = ['pergament', 'moderno', 'noc'].map(k => `<option value="${k}">${THEMES[k].name}</option>`).join('');

const bind = { exTheme: 'theme', exScript: 'script', exPaper: 'paper', exOrient: 'orient', exRes: 'res', exScope: 'scope', exGens: 'gens', exTitleText: 'title', exSubtitle: 'subtitle' };
const checks = { exPhotos: 'photos', exSepia: 'sepia', exYears: 'years', exMaiden: 'maiden', exPlaces: 'places', exShowTitle: 'showTitle' };

function openExport() {
  ex.theme = theme(); ex.script = script();
  ex.title = data.title;
  const L = layout(rootId());
  ex.subtitle = `Porodično stablo · ${L.gens} generacija`;
  Object.entries(bind).forEach(([id, k]) => { $('#' + id).value = ex[k]; });
  Object.entries(checks).forEach(([id, k]) => { $('#' + id).checked = ex[k]; });
  $('#exScope').querySelector('[value="sel"]').disabled = !state.selected;
  if (!state.selected) { ex.scope = 'all'; $('#exScope').value = 'all'; }
  modal.hidden = false;
  updateExport();
}
function closeExport() { modal.hidden = true; }

function exportOpts() {
  const engrave = ex.format === 'engrave';
  return {
    ...ex, idp: 'x', gens: +ex.gens,
    theme: engrave ? 'gravura' : ex.theme,
    photos: engrave ? false : ex.photos,
    root: ex.scope === 'sel' && state.selected ? state.selected : rootId(),
  };
}

function updateExport() {
  $$('.fmt').forEach(b => b.classList.toggle('on', b.dataset.f === ex.format));
  const visual = ['png', 'pdf', 'svg', 'engrave'].includes(ex.format);
  $$('[data-for="visual"]').forEach(s => { s.hidden = !visual; });
  $('[data-for="png"]').hidden = ex.format !== 'png';
  $('#exTheme').disabled = ex.format === 'engrave';
  $('#exPhotos').disabled = $('#exSepia').disabled = ex.format === 'engrave';

  const notes = {
    png: 'Slika visoke rezolucije. Za štampu A3 i veće izaberite „Za veliku štampu“.',
    pdf: 'Otvoriće se prozor za štampu — izaberite „Sačuvaj kao PDF“. Veličina papira je već podešena; isključite zaglavlja i podnožja ako ih pregledač doda.',
    svg: 'Vektorski fajl sa ugrađenim fontovima. Otvara se u Illustrator-u, Inkscape-u, Affinity-ju ili ga pošaljite štampariji.',
    engrave: 'Samo crne linije i tekst, bez fotografija i pozadine. U programu za laser (LightBurn, Inkscape) tekst pretvorite u putanje (komanda Object to Path).',
    json: 'Kompletna arhiva: sve osobe, veze, priče i fotografije. Sačuvajte je kao rezervnu kopiju ili pošaljite rođacima da je otvore preko „Uvezi“.',
    ged: 'Standardni genealoški format. Fotografije i podešavanja izgleda se ne prenose.',
  };
  $('#exNote').textContent = notes[ex.format];
  $('#exGo').textContent = ex.format === 'pdf' ? 'Otvori za PDF' : 'Preuzmi';

  const prev = $('#exPreview');
  if (visual) {
    const P = poster(exportOpts());
    prev.innerHTML = P.svg;
    const size = ex.paper === 'auto' ? `${Math.round(P.mmW / 10)} × ${Math.round(P.mmH / 10)} cm` : `${ex.paper} · ${(P.mmW / 10).toFixed(1).replace('.', ',')} × ${(P.mmH / 10).toFixed(1).replace('.', ',')} cm`;
    let meta = `${P.count} osoba · ${P.gens} generacija · ${size}`;
    if (ex.format === 'png') meta += ` · ${ex.res} × ${Math.round(ex.res * P.vbH / P.vbW)} px`;
    $('#exMeta').textContent = meta;
  } else {
    const text = ex.format === 'json' ? JSON.stringify(data, (k, v) => (k === 'photo' && v ? '[fotografija]' : v), 2) : toGedcom();
    prev.innerHTML = `<pre>${esc(text.slice(0, 4000))}${text.length > 4000 ? '\n…' : ''}</pre>`;
    $('#exMeta').textContent = `${Object.keys(data.people).length} osoba · ${data.families.length} porodica`;
  }
}

$('#exFormats').addEventListener('click', e => { const b = e.target.closest('.fmt'); if (b) { ex.format = b.dataset.f; updateExport(); } });
Object.entries(bind).forEach(([id, k]) => $('#' + id).addEventListener('input', e => { ex[k] = e.target.value; updateExport(); }));
Object.entries(checks).forEach(([id, k]) => $('#' + id).addEventListener('change', e => { ex[k] = e.target.checked; updateExport(); }));
$('#exportBtn').addEventListener('click', openExport);
$('#exClose').addEventListener('click', closeExport);
$('#exCancel').addEventListener('click', closeExport);
modal.addEventListener('click', e => { if (e.target === modal) closeExport(); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!modal.hidden) closeExport(); else if (state.selected) select(null);
});

$('#exGo').addEventListener('click', async () => {
  const btn = $('#exGo'), label = btn.textContent;
  btn.disabled = true; btn.textContent = 'Pripremam…';
  const name = slug(data.title);
  try {
    if (ex.format === 'json') download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `${name}-arhiva.json`);
    else if (ex.format === 'ged') download(new Blob([toGedcom()], { type: 'text/plain;charset=utf-8' }), `${name}.ged`);
    else {
      const fonts = await fontStyle();
      const P = poster(exportOpts(), fonts);
      if (ex.format === 'png') await exportPNG(P, +ex.res, `${name}.png`);
      else if (ex.format === 'pdf') await exportPDF(P);
      else download(new Blob([P.svg], { type: 'image/svg+xml' }), `${name}${ex.format === 'engrave' ? '-gravura' : ''}.svg`);
    }
    if (ex.format !== 'pdf') toast('Fajl je preuzet.');
  } catch (err) {
    console.error(err);
    toast('Izvoz nije uspeo. Probajte manju rezoluciju ili drugi format.');
  } finally { btn.disabled = false; btn.textContent = label; }
});

function download(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
}

// Embed Google Fonts in exported SVG/PNG so the file looks the same everywhere.
let fontCache = null;
async function fontStyle() {
  if (fontCache !== null) return fontCache;
  try {
    const css = await (await fetch(FONT_URL)).text();
    const keep = css.split('/* ').slice(1).filter(b => /^(latin|latin-ext|cyrillic) \*\//.test(b)).map(b => b.replace(/^[^*]*\*\//, ''));
    const files = {};
    let out = keep.join('\n');
    const urls = [...new Set([...out.matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]))];
    await Promise.all(urls.map(async u => {
      const blob = await (await fetch(u)).blob();
      files[u] = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
    }));
    urls.forEach(u => { out = out.split(u).join(files[u]); });
    fontCache = `<style>${out}</style>`;
  } catch { fontCache = ''; }
  return fontCache;
}

async function exportPNG(P, width, filename) {
  const h = Math.round(width * P.vbH / P.vbW);
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(P.svg);
  await img.decode();
  const c = document.createElement('canvas'); c.width = width; c.height = h;
  const ctx = c.getContext('2d');
  // First draw triggers loading of extra font parts (č, ć, đ, Cyrillic); the second draw uses them.
  ctx.drawImage(img, 0, 0, width, h);
  await new Promise(r => setTimeout(r, 900));
  ctx.clearRect(0, 0, width, h);
  ctx.drawImage(img, 0, 0, width, h);
  const blob = await new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('canvas'))), 'image/png'));
  download(blob, filename);
}

async function exportPDF(P) {
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(f);
  const w = P.mmW.toFixed(1), h = P.mmH.toFixed(1);
  const d = f.contentDocument;
  d.open();
  d.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(data.title)}</title><style>
    @page { size: ${w}mm ${h}mm; margin: 0; }
    html, body { margin: 0; padding: 0; height: ${h}mm; overflow: hidden; }
    svg { display: block; width: ${w}mm; height: ${(P.mmH - 0.4).toFixed(1)}mm; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  </style></head><body>${P.svg}</body></html>`);
  d.close();
  try { await f.contentDocument.fonts.ready; } catch { /* ok */ }
  await new Promise(r => setTimeout(r, 300));
  const prevTitle = document.title; document.title = data.title;
  f.contentWindow.focus(); f.contentWindow.print();
  document.title = prevTitle;
  setTimeout(() => f.remove(), 60000);
}

function gedDate(s) {
  s = String(s || '').trim();
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/);
  if (!m) return s;
  return `${+m[1]} ${['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][+m[2] - 1] || ''} ${m[3]}`.replace('  ', ' ');
}
function toGedcom() {
  const I = {}, F = {};
  Object.keys(data.people).forEach((id, i) => { I[id] = `@I${i + 1}@`; });
  data.families.forEach((f, i) => { F[f.id] = `@F${i + 1}@`; });
  const L = ['0 HEAD', '1 SOUR PORODICNO_STABLO', '1 GEDC', '2 VERS 5.5.1', '2 FORM LINEAGE-LINKED', '1 CHAR UTF-8'];
  Object.values(data.people).forEach(p => {
    L.push(`0 ${I[p.id]} INDI`, `1 NAME ${p.first} /${p.last}/`);
    if (p.nick) L.push(`2 NICK ${p.nick}`);
    if (p.maiden) L.push(`1 NAME ${p.first} /${p.maiden}/`, '2 TYPE birth');
    if (p.gender) L.push(`1 SEX ${p.gender === 'm' ? 'M' : 'F'}`);
    if (p.birth || p.birthPlace) { L.push('1 BIRT'); if (p.birth) L.push(`2 DATE ${gedDate(p.birth)}`); if (p.birthPlace) L.push(`2 PLAC ${p.birthPlace}`); }
    if (p.death || p.deathPlace) { L.push('1 DEAT'); if (p.death) L.push(`2 DATE ${gedDate(p.death)}`); if (p.deathPlace) L.push(`2 PLAC ${p.deathPlace}`); }
    data.families.forEach(f => {
      if (f.partners.includes(p.id)) L.push(`1 FAMS ${F[f.id]}`);
      if (f.children.includes(p.id)) L.push(`1 FAMC ${F[f.id]}`);
    });
    if (p.bio) p.bio.split('\n').forEach((line, i) => L.push(i ? `2 CONT ${line}` : `1 NOTE ${line}`));
  });
  data.families.forEach(f => {
    L.push(`0 ${F[f.id]} FAM`);
    const [a, b] = f.partners;
    const isWife = id => data.people[id]?.gender === 'f';
    const husb = isWife(a) ? b : a, wife = husb === a ? b : a;
    if (husb && data.people[husb]) L.push(`1 HUSB ${I[husb]}`);
    if (wife && data.people[wife]) L.push(`1 WIFE ${I[wife]}`);
    f.children.forEach(c => { if (I[c]) L.push(`1 CHIL ${I[c]}`); });
  });
  L.push('0 TRLR');
  return L.join('\n');
}

/* ---------- Start ---------- */
$('#menuBtn').addEventListener('click', () => document.body.classList.toggle('menu-open'));
$('#search').addEventListener('change', () => document.body.classList.toggle('menu-open', false));
$('#archiveBtn').addEventListener('click', () => {
  state.overview = !(state.overview && !state.selected);
  if (state.selected) select(null); else renderPanel();
  setTimeout(() => fit(), 60);
});
syncChrome();
renderTree();
renderPanel();
fit(false);
// Keep the whole tree in view while the window changes size, until the user moves it.
let userMoved = false;
svgEl.addEventListener('pointerdown', () => { userMoved = true; });
svgEl.addEventListener('wheel', () => { userMoved = true; });
new ResizeObserver(() => { if (!userMoved) fit(false); }).observe(svgEl);
if (document.fonts) document.fonts.ready.then(renderTree);
ambient();
intro();
