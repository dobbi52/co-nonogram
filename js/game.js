// 게임 규칙과 공용 도구: 조각 배치, 힌트, 풀이 검사, 꾸미기 장식, 노노그램 판
import { PICTURES } from './pictures.js?v=1106-1238';

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
// 학생이 들어올 때 각자 고른다. 조각의 난이도는 그 조각을 처음 맡은 학생의 난이도를 따른다
export const LEVELS = {
  easy: { name: '쉬움', note: '노노그램이 처음이에요' },
  normal: { name: '보통', note: '해 본 적 있어요' },
  hard: { name: '어려움', note: '자신 있어요' },
};
export const LEVEL_KEYS = ['easy', 'normal', 'hard'];
// 조각 한 변의 칸 수. 7×7은 그림을 42×35로 줄인 small 그림을 쓴다
export const PIECE_SIZES = [
  { n: 10, name: '10×10', note: '그림이 촘촘하고 오래 풀어요' },
  { n: 7, name: '7×7', note: '금방 풀고, 폰에서 칸이 커요' },
];
export const layoutOf = (n) => LAYOUTS.find((l) => l.n === n) || LAYOUTS[2];
export const pictureOf = (id) => PICTURES.find((p) => p.id === id) || PICTURES[0];
export { PICTURES };

// 방 설정(meta)으로 조각 목록을 만든다. 모든 기기가 같은 결과를 얻는다.
// 조각마다 쉬움·보통·어려움 세 벌이 있고, p.sol / p.ch / p.fills 는 그 조각의 지금 난이도(built.levelOf)를 따른다.
// 세 벌은 같은 영역 글자를 쓰므로 칠판에서는 같은 그림으로 보인다.
export function buildPieces(meta) {
  const L = layoutOf(meta.pieces);
  const pic = pictureOf(meta.picture);
  const [ox, oy] = (pic.crop && pic.crop[meta.pieces]) || [L.ox, L.oy];
  const n = meta.size === 7 && pic.small ? 7 : 10;
  const src = n === 7 ? pic.small : pic;
  const built = { L, pic, n, pieces: [], w: L.c * n, h: L.r * n, levelOf: () => meta.level || 'normal' };
  for (let r = 0; r < L.r; r++) for (let c = 0; c < L.c; c++) {
    const lv = {};
    for (const key of Object.keys(src.levels)) {
      const rows = src.levels[key], sol = [], ch = [];
      for (let y = 0; y < n; y++) {
        sol.push([]); ch.push([]);
        for (let x = 0; x < n; x++) {
          const k = rows[(r + oy) * n + y][(c + ox) * n + x];
          sol[y].push(k === k.toUpperCase() ? 1 : 0);
          ch[y].push(k);
        }
      }
      lv[key] = { sol, ch, fills: sol.flat().reduce((a, v) => a + v, 0) };
    }
    const id = built.pieces.length;
    const cur = () => lv[built.levelOf(id)] || lv.normal;
    built.pieces.push({
      id, r, c, label: ROWL[r] + (c + 1), levels: lv,
      get sol() { return cur().sol; }, get ch() { return cur().ch; }, get fills() { return cur().fills; },
    });
  }
  return built;
}

// 칸 상태 문자열: 100글자, '0' 빈칸, '1' 칠함, '2' ×표시
// 조각 크기 n이면 n×n 글자. 크기는 글자 수로 알아낸다
export const EMPTY = '0'.repeat(100);
export const emptyOf = (n) => '0'.repeat(n * n);
export const toGrid = (s) => { const t = s || EMPTY, n = Math.round(Math.sqrt(t.length)); const g = []; for (let r = 0; r < n; r++) { g.push([]); for (let c = 0; c < n; c++) g[r].push(+t[r * n + c] || 0); } return g; };
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

// 받침에 맞는 조사: josa('서연', '이', '가') → '서연이', josa('하준', '이', '가') → '하준이', josa('도윤이와 지우', ...)는 마지막 글자로
export function josa(word, withFinal, without) {
  const ch = String(word || '').trim().slice(-1), code = ch.charCodeAt(0) - 0xAC00;
  const has = code >= 0 && code <= 11171 ? code % 28 !== 0 : false;
  return word + (has ? withFinal : without);
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
    const n = built.n || 10, st = cells[p.id] || emptyOf(n);
    for (let y = 0; y < n; y++) for (let xx = 0; xx < n; xx++) {
      const gx = (MARGIN + p.c * n + xx) * scale, gy = (MARGIN + p.r * n + y) * scale;
      if (full) { x.fillStyle = pic.pal[p.ch[y][xx]]; x.fillRect(gx, gy, scale, scale); }
      else if (st[y * n + xx] === '1') {
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
  const fs = n <= 5 ? 13 : n <= 7 ? (wide ? 13 : 11) : (wide ? 12 : 8);
  const hw = kR * (fs + 4) + 8, hh = Math.ceil(kC * fs * 1.5 + 8);
  const maxCs = n <= 5 ? 56 : n <= 7 ? 54 : (wide ? 48 : 40);
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
