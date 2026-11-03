// 게임 규칙과 공용 도구: 조각 배치, 힌트, 풀이 검사, 꾸미기 장식, 노노그램 판
import { PICTURES } from './pictures.js';

export const MARGIN = 5;        // 큰 그림 둘레 장식 테두리 칸 수
export const MAX_HELPERS = 2;   // 한 조각에 들어올 수 있는 도우미 수
export const CHECKS_PER_PIECE = 1; // 조각마다 쓸 수 있는 검사하기 횟수
export const ROWL = 'ABCDE';

// ox, oy: 60×50 그림에서 잘라 쓸 위치(조각 단위). 조각 경계로 자르므로 조각마다 퍼즐 검사는 유지된다
export const LAYOUTS = [
  { n: 16, c: 4, r: 4, ox: 1, oy: 0 },
  { n: 20, c: 5, r: 4, ox: 1, oy: 0 },
  { n: 25, c: 5, r: 5, ox: 1, oy: 0 },
  { n: 30, c: 6, r: 5, ox: 0, oy: 0 },
];
export const LEVELS = {
  normal: { name: '보통', note: '조각마다 3~5회 훑어야 풀려요' },
  hard: { name: '어려움', note: '조각마다 4~6회 훑어야 풀려요' },
};
export const layoutOf = (n) => LAYOUTS.find((l) => l.n === n) || LAYOUTS[2];
export const pictureOf = (id) => PICTURES.find((p) => p.id === id) || PICTURES[0];
export { PICTURES };

// 방 설정(meta)으로 조각 목록을 만든다. 모든 기기가 같은 결과를 얻는다
export function buildPieces(meta) {
  const L = layoutOf(meta.pieces);
  const pic = pictureOf(meta.picture);
  const rows = pic.levels[meta.level] || pic.levels.normal;
  const out = [];
  for (let r = 0; r < L.r; r++) for (let c = 0; c < L.c; c++) {
    const sol = [], ch = [];
    for (let y = 0; y < 10; y++) {
      sol.push([]); ch.push([]);
      for (let x = 0; x < 10; x++) {
        const k = rows[(r + L.oy) * 10 + y][(c + L.ox) * 10 + x];
        sol[y].push(k === k.toUpperCase() ? 1 : 0);
        ch[y].push(k);
      }
    }
    const fills = sol.flat().reduce((a, v) => a + v, 0);
    out.push({ id: out.length, r, c, label: ROWL[r] + (c + 1), sol, ch, fills });
  }
  return { L, pic, pieces: out, w: L.c * 10, h: L.r * 10 };
}

// 칸 상태 문자열: 100글자, '0' 빈칸, '1' 칠함, '2' ×표시
export const EMPTY = '0'.repeat(100);
export const toGrid = (s) => { const t = s || EMPTY; const g = []; for (let r = 0; r < 10; r++) { g.push([]); for (let c = 0; c < 10; c++) g[r].push(+t[r * 10 + c] || 0); } return g; };
export const fromGrid = (g) => g.map((r) => r.join('')).join('');

export function hintOf(a) {
  const h = []; let n = 0;
  for (const b of a) { if (b) n++; else if (n) { h.push(n); n = 0; } }
  if (n) h.push(n);
  return h;
}
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
// 칠한 모양이 정답과 같은가 (힌트만으로 답이 하나로 풀리게 만들었으므로 힌트가 다 맞으면 곧 정답)
export const isSolved = (sol, g) => sol.every((row, r) => row.every((v, c) => (v === 1) === (g[r][c] === 1)));
export const lineMatches = (line, target) => same(hintOf(line.map((v) => (v === 1 ? 1 : 0))), hintOf(target));
export const filledCount = (g) => g.flat().filter((v) => v === 1).length;

// 힌트만으로 다 풀리는지 (그림/gen.py의 solve와 같은 방식)
const LINECACHE = {};
function linesFor(n) {
  if (LINECACHE[n]) return LINECACHE[n];
  const m = {};
  for (let x = 0; x < (1 << n); x++) {
    const bits = []; for (let i = 0; i < n; i++) bits.push(x >> i & 1);
    const k = hintOf(bits).join(','); (m[k] = m[k] || []).push(x);
  }
  return (LINECACHE[n] = m);
}
export function lineSolvable(sol) {
  const n = sol.length, L = linesFor(n), full = (1 << n) - 1;
  const rows = sol.map((r) => L[hintOf(r).join(',')].slice());
  const cols = [...Array(n)].map((_, j) => L[hintOf(sol.map((r) => r[j])).join(',')].slice());
  const on = Array(n).fill(0), off = Array(n).fill(0); let ch = true;
  while (ch) {
    ch = false;
    for (let i = 0; i < n; i++) {
      rows[i] = rows[i].filter((m) => (m & on[i]) === on[i] && (m & off[i]) === 0);
      let a = full, o = 0; for (const m of rows[i]) { a &= m; o |= m; }
      const na = on[i] | a, nb = off[i] | (full & ~o);
      if (na !== on[i] || nb !== off[i]) { on[i] = na; off[i] = nb; ch = true; }
    }
    for (let j = 0; j < n; j++) {
      let a0 = 0, b0 = 0; for (let i = 0; i < n; i++) { a0 |= ((on[i] >> j) & 1) << i; b0 |= ((off[i] >> j) & 1) << i; }
      cols[j] = cols[j].filter((m) => (m & a0) === a0 && (m & b0) === 0);
      let a = full, o = 0; for (const m of cols[j]) { a &= m; o |= m; }
      const nb = full & ~o;
      for (let i = 0; i < n; i++) {
        if ((a >> i & 1) && !(on[i] >> j & 1)) { on[i] |= 1 << j; ch = true; }
        if ((nb >> i & 1) && !(off[i] >> j & 1)) { off[i] |= 1 << j; ch = true; }
      }
    }
  }
  return on.every((v, i) => ((v | off[i]) & full) === full);
}

// ───── 꾸미기 장식: 5×5 퍼즐을 풀면 그 그림이 칠판 둘레에 붙는다 ─────
export const SPRITES = [
  { name: '별', c: '#FFE14D', g: ['..#..', '.###.', '#####', '.###.', '.#.#.'] },
  { name: '하트', c: '#FF4FA3', g: ['.#.#.', '#####', '#####', '.###.', '..#..'] },
  { name: '꽃', c: '#FF4FA3', g: ['.#.#.', '#####', '.###.', '#####', '.#.#.'] },
  { name: '달', c: '#FFE14D', g: ['.###.', '##...', '##...', '##...', '.###.'] },
  { name: '나무', c: '#39FF88', g: ['..#..', '.###.', '#####', '..#..', '.###.'] },
  { name: '집', c: '#4FC3FF', g: ['..#..', '.###.', '#####', '##.##', '##.##'] },
  { name: '웃는 얼굴', c: '#FFE14D', g: ['.###.', '#.#.#', '#####', '#...#', '.###.'] },
  { name: '음표', c: '#4FC3FF', g: ['..##.', '..#.#', '..#..', '###..', '###..'] },
  { name: '보석', c: '#4FC3FF', g: ['..#..', '.###.', '##.##', '.###.', '..#..'] },
  { name: '왕관', c: '#FFE14D', g: ['#.#.#', '#####', '#####', '#.#.#', '#####'] },
  { name: '버섯', c: '#FF4FA3', g: ['.###.', '#####', '#.#.#', '.###.', '.#.#.'] },
  { name: '로켓', c: '#4FC3FF', g: ['..#..', '.###.', '.#.#.', '.###.', '#.#.#'] },
].map((s, i) => ({ ...s, i, sol: s.g.map((r) => [...r].map((ch) => (ch === '#' ? 1 : 0))) }))
  .filter((s) => lineSolvable(s.sol));

export function rng(seed) {
  let a = 0; for (const ch of String(seed)) a = (a * 31 + ch.charCodeAt(0)) >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function shuffle(a, rand = Math.random) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// 장식 자리: 그림 둘레에 6칸 간격. 방 코드로 순서를 섞어 모든 기기가 같게 본다
export function decorSlots(w, h, seed) {
  const W = w + MARGIN * 2, H = h + MARGIN * 2, out = [];
  for (let x = 0; x + 5 <= W; x += 6) { out.push([x, 0]); out.push([x, H - 5]); }
  for (let y = 6; y + 5 <= H - 5; y += 6) { out.push([0, y]); out.push([W - 5, y]); }
  return shuffle(out, rng(seed));
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ───── 큰 그림 그리기 (칠판, 완성 이미지 공용) ─────
// cells: 조각 id → 칸 상태 문자열, done: 조각 id → true
export function drawPicture(cv, { built, cells = {}, done = {}, decor = [], slots = [], all = false, scale = 8 }) {
  const { pieces, w, h, pic } = built;
  const W = w + MARGIN * 2, H = h + MARGIN * 2;
  cv.width = W * scale; cv.height = H * scale;
  const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
  x.fillStyle = '#141A2E'; x.fillRect(0, 0, cv.width, cv.height);
  x.fillStyle = '#10152A';
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
    if ((xx < MARGIN || yy < MARGIN || xx >= W - MARGIN || yy >= H - MARGIN) && (xx + yy) % 2 === 0) x.fillRect(xx * scale, yy * scale, scale, scale);
  }
  for (const p of pieces) {
    const full = all || done[p.id];
    const st = cells[p.id] || EMPTY;
    for (let y = 0; y < 10; y++) for (let xx = 0; xx < 10; xx++) {
      const gx = (MARGIN + p.c * 10 + xx) * scale, gy = (MARGIN + p.r * 10 + y) * scale;
      if (full) { x.fillStyle = pic.pal[p.ch[y][xx]]; x.fillRect(gx, gy, scale, scale); }
      else if (st[y * 10 + xx] === '1') {
        // 칠한 칸은 맞든 틀리든 그 영역의 '칠하는 색'으로 보인다 (틀린 칸도 주변과 비슷한 색이라 티가 나지 않음)
        x.fillStyle = pic.pal[p.ch[y][xx].toUpperCase()]; x.fillRect(gx, gy, scale, scale);
      } else { x.fillStyle = '#1A2038'; x.fillRect(gx + 1, gy + 1, scale - 2, scale - 2); }
    }
  }
  decor.forEach((d, i) => {
    const sp = SPRITES.find((s) => s.i === d.sprite); const slot = slots[i];
    if (!sp || !slot) return;
    x.fillStyle = sp.c;
    sp.sol.forEach((row, yy) => row.forEach((v, xx) => { if (v) x.fillRect((slot[0] + xx) * scale, (slot[1] + yy) * scale, scale, scale); }));
  });
}
export function placeTiles(el, built) {
  const { w, h, L } = built, W = w + MARGIN * 2, H = h + MARGIN * 2;
  Object.assign(el.style, { left: (MARGIN / W * 100) + '%', top: (MARGIN / H * 100) + '%', width: (w / W * 100) + '%', height: (h / H * 100) + '%',
    gridTemplateColumns: `repeat(${L.c},minmax(0,1fr))`, gridTemplateRows: `repeat(${L.r},minmax(0,1fr))` });
}

// ───── 노노그램 판 ─────
// o: { sol, get(r,c), set(r,c,v), editable, cls, tool()->1|2, hl()->{type,i}|null, wrong()->Set|null, onChange(), onHint(type,i), onStrokeEnd() }
export function buildGrid(host, o) {
  const n = o.sol.length;
  const rh = o.sol.map((r) => hintOf(r)), chs = [...Array(n)].map((_, j) => hintOf(o.sol.map((r) => r[j])));
  rh.forEach((h) => { if (!h.length) h.push(0); }); chs.forEach((h) => { if (!h.length) h.push(0); });
  const kR = Math.max(...rh.map((h) => h.length)), kC = Math.max(...chs.map((h) => h.length));
  const wide = window.innerWidth >= 700;
  const avail = Math.max(260, host.clientWidth - 14);
  const fs = n <= 5 ? 13 : (wide ? 12 : 8);
  const hw = kR * (fs + 4) + 8, hh = Math.ceil(kC * fs * 1.5 + 8);
  const maxCs = n <= 5 ? 56 : (wide ? 48 : 40);
  const cs = Math.max(22, Math.min(maxCs, Math.floor((avail - hw) / n)));
  const wrap = document.createElement('div'); wrap.className = 'nono ' + (o.cls || '');
  const g = document.createElement('div'); g.className = 'ng';
  g.style.gridTemplateColumns = `${hw}px repeat(${n},${cs}px)`; g.style.gridTemplateRows = `${hh}px repeat(${n},${cs}px)`;
  g.style.fontSize = fs + 'px';
  g.appendChild(document.createElement('div'));
  const colEls = [], rowEls = [], cells = [];
  chs.forEach((h, j) => { const e = document.createElement('div'); e.className = 'ch'; e.innerHTML = h.map((v) => `<span>${v}</span>`).join(''); e.dataset.hint = 'col'; e.dataset.i = j; g.appendChild(e); colEls.push(e); });
  for (let r = 0; r < n; r++) {
    const e = document.createElement('div'); e.className = 'rh'; e.innerHTML = rh[r].map((v) => `<span>${v}</span>`).join(''); e.dataset.hint = 'row'; e.dataset.i = r; g.appendChild(e); rowEls.push(e);
    cells.push([]);
    for (let c = 0; c < n; c++) {
      const ce = document.createElement('div');
      ce.className = 'c' + ((c % 5 === 4 && c < n - 1) ? ' b5' : '') + ((r % 5 === 4 && r < n - 1) ? ' d5' : '');
      ce.dataset.r = r; ce.dataset.c = c; ce.style.fontSize = Math.round(cs * 0.45) + 'px';
      g.appendChild(ce); cells[r].push(ce);
    }
  }
  wrap.appendChild(g); host.replaceChildren(wrap);
  function refresh() {
    const h = o.hl && o.hl(); const wrong = o.wrong && o.wrong();
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const v = o.get(r, c), ce = cells[r][c], w = !!wrong && wrong.has(r * n + c);
      ce.classList.toggle('f', v === 1 && !w); ce.classList.toggle('w', w); ce.classList.toggle('x', v === 2);
      ce.classList.toggle('hl', !!h && ((h.type === 'row' && h.i === r) || (h.type === 'col' && h.i === c)));
    }
    for (let i = 0; i < n; i++) {
      const row = [], col = []; for (let j = 0; j < n; j++) { row.push(o.get(i, j)); col.push(o.get(j, i)); }
      // 내가 칠한 모양이 힌트와 같으면 숫자를 흐리게 (정답을 보는 게 아니라 힌트와만 비교)
      rowEls[i].classList.toggle('ok', lineMatches(row, o.sol[i]));
      colEls[i].classList.toggle('ok', lineMatches(col, o.sol.map((rr) => rr[i])));
      rowEls[i].classList.toggle('hl', !!h && h.type === 'row' && h.i === i);
      colEls[i].classList.toggle('hl', !!h && h.type === 'col' && h.i === i);
    }
  }
  refresh();
  let dragging = false;
  if (o.editable) {
    let drag = null;
    const cellAt = (x, y) => { const e = document.elementFromPoint(x, y); return e && e.classList && e.classList.contains('c') && g.contains(e) ? e : null; };
    const apply = (e) => { const r = +e.dataset.r, c = +e.dataset.c; if (o.get(r, c) !== drag.from) return; o.set(r, c, drag.to); refresh(); o.onChange && o.onChange(); };
    g.addEventListener('contextmenu', (e) => e.preventDefault());
    g.addEventListener('pointerdown', (e) => {
      const ce = e.target.closest('.c'); if (!ce) return; e.preventDefault();
      const tool = (e.button === 2) ? 2 : o.tool();
      const cur = o.get(+ce.dataset.r, +ce.dataset.c);
      drag = { from: cur, to: cur === tool ? 0 : tool }; dragging = true;
      try { g.setPointerCapture(e.pointerId); } catch (_) {}
      apply(ce);
    });
    g.addEventListener('pointermove', (e) => { if (!drag) return; const ce = cellAt(e.clientX, e.clientY); if (ce) apply(ce); });
    const end = () => { if (drag) { drag = null; dragging = false; o.onStrokeEnd && o.onStrokeEnd(); } };
    g.addEventListener('pointerup', end); g.addEventListener('pointercancel', end);
  }
  if (o.onHint) {
    g.addEventListener('click', (e) => { const h = e.target.closest('[data-hint]'); if (h) o.onHint(h.dataset.hint, +h.dataset.i); });
    [...colEls, ...rowEls].forEach((e) => {
      e.tabIndex = 0; e.setAttribute('role', 'button');
      e.setAttribute('aria-label', `${+e.dataset.i + 1}번째 ${e.dataset.hint === 'row' ? '가로' : '세로'}줄 짚어 주기`);
      e.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); o.onHint(e.dataset.hint, +e.dataset.i); } });
    });
  }
  return { refresh, isDragging: () => dragging };
}
