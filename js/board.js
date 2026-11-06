// 전자칠판(선생님) 화면: 방 만들기 → 대기실 → 함께 푸는 칠판 → 완성
// 칠판 화면은 "진행 맡은 칠판"으로서 조각 배정, 자리 비운 학생 정리, 완성 판정을 맡는다.
import * as net from './net.js?v=1106-1415';
import { app, brand, modeNotice, toast, go, joinUrl, verLine } from './ui.js?v=1106-1415';
import * as music from './music.js?v=1106-1415';
import { LAYOUTS, LEVELS, PICTURES, buildPieces, drawPicture, placeTiles, decorSlots, esc, shuffle, EMPTY, MAX_HELPERS, CHECKS_PER_PIECE, buildGrid, toGrid, fromGrid, emptyOf, PIECE_SIZES, levelButtons, levelPatch } from './game.js?v=1106-1415';

const OFFLINE_RELEASE_MS = 45000; // 조각을 맡은 학생이 이만큼 접속이 끊기면 조각을 다른 학생에게 넘긴다
const setup = { pieces: 25, size: 10, picture: PICTURES[0].id };
// 방 만들기에서 그림을 묶어 보여 줄 순서
const PICTURE_GROUPS = [
  ['동물', ['roof-cat', 'owl-forest', 'panda', 'penguin', 'octopus', 'garden']],
  ['계절과 명절', ['cherry', 'autumn', 'chuseok', 'winter']],
  ['우리나라', ['palace', 'turtle-ship', 'fireworks']],
  ['모험과 상상', ['castle', 'pirate', 'unicorn', 'dino']],
  ['우주', ['rocket', 'solar']],
  ['말랑 친구들과 즐거운 곳', ['friends', 'dessert']],
];
let code = null, R = null, built = null, slots = [], isHost = false, unsub = null, view = '', timer = 0, raf = 0;
let showNames = false, lastPatch = '', lastPatchAt = 0, lastDoneId = null, lastDoneAt = 0, doneSeen = null;
const hostKey = (c) => 'cono-host-' + c;
let kickPick = null; // 내보낼지 묻는 중인 학생

const sorted = (obj) => Object.entries(obj || {}).sort((a, b) => (a[1].joinedAt || 0) - (b[1].joinedAt || 0));
const pieceRec = (id) => (R.pieces || {})['p' + id] || {};
const cellsOf = (id) => (R.cells || {})['p' + id] || emptyOf(built ? built.n : 10);
function progressOf(p) {
  const rec = pieceRec(p.id); if (rec.done) return 1;
  const st = cellsOf(p.id); let k = 0;
  const n = built.n; for (let i = 0; i < n * n; i++) if (st[i] === '1' && p.sol[i / n | 0][i % n]) k++;
  return p.fills ? k / p.fills : 0;
}

// ───── 방 만들기 ─────
function thumb(pic) {
  const cv = document.createElement('canvas'); cv.width = pic.w; cv.height = pic.h;
  const x = cv.getContext('2d'); const rows = pic.levels.normal;
  for (let y = 0; y < pic.h; y++) for (let xx = 0; xx < pic.w; xx++) { x.fillStyle = pic.pal[rows[y][xx]]; x.fillRect(xx, y, 1, 1); }
  return cv.toDataURL();
}
export function openSetup() {
  go(null);
  document.title = '방 만들기 · 협동 노노그램';
  app.innerHTML = `<div class="top">${brand('NEW ROOM')}</div>
  <div class="sheet">
    <h2>방 만들기</h2>
    <p>조각 크기와 수, 그림을 고르면 방이 만들어져요. 전자칠판에 코드가 나오면 학생들이 들어와요.</p>
    <div class="field"><span>조각 크기</span><div class="seg lvseg two" id="psize" role="radiogroup" aria-label="조각 크기">${PIECE_SIZES.map((s) => `<button type="button" data-v="${s.n}" aria-pressed="${s.n === setup.size}">${s.name} <span class="dim">${s.note}</span></button>`).join('')}</div></div>
    <div class="field"><span>조각 수</span><div class="sizes" id="sizes" role="radiogroup" aria-label="조각 수"></div>
      <span class="dim" style="font-size:16px">학생이 조각보다 많으면 남는 학생은 처음부터 친구 돕기와 꾸미기를 해요. 조각이 남으면 먼저 끝낸 학생이 이어서 풀어요.</span></div>
    <div class="field"><span>난이도</span><span class="dim" style="font-size:16px">학생이 들어올 때 각자 쉬움·보통·어려움 중에 골라요. 조각마다 난이도가 달라도 칠판에서는 같은 그림이 돼요.</span></div>
    <div class="field"><span>그림</span><div class="pics" id="pics" role="radiogroup" aria-label="그림"></div>
      <span class="dim" style="font-size:16px">30조각보다 작게 고르면 그림의 가운데를 잘라서 써요.</span></div>
    <div class="row"><button class="btn" id="create">방 만들기</button><button class="btn ghost" id="back">처음으로</button><span class="err" id="err"></span></div>
    ${modeNotice()}
  </div>${verLine()}`;
  const drawSizes = () => {
    document.getElementById('sizes').innerHTML = LAYOUTS.map((l) => `<button class="size${l.n === setup.pieces ? ' on' : ''}" role="radio" aria-checked="${l.n === setup.pieces}" data-n="${l.n}"><span class="px">${l.c}×${l.r}</span><b>${l.n}조각</b><div class="mg" style="grid-template-columns:repeat(${l.c},8px)">${'<i></i>'.repeat(l.n)}</div><span class="dim" style="font-size:15px">${l.c * setup.size}×${l.r * setup.size}칸</span></button>`).join('');
    document.querySelectorAll('#sizes button').forEach((b) => (b.onclick = () => { setup.pieces = +b.dataset.n; drawSizes(); }));
  };
  drawSizes();
  document.querySelectorAll('#psize button').forEach((b) => (b.onclick = () => {
    setup.size = +b.dataset.v;
    document.querySelectorAll('#psize button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    drawSizes();
  }));
  const pics = document.getElementById('pics');
  const btn = (p) => `<button class="pick-pic${p.id === setup.picture ? ' on' : ''}" role="radio" aria-checked="${p.id === setup.picture}" data-id="${esc(p.id)}"><img src="${thumb(p)}" alt=""><span>${esc(p.name)}</span></button>`;
  const used = new Set();
  pics.innerHTML = PICTURE_GROUPS.map(([g, ids]) => {
    const list = ids.map((id) => PICTURES.find((p) => p.id === id)).filter(Boolean);
    list.forEach((p) => used.add(p.id));
    return list.length ? `<h3 class="pic-group">${g}</h3>${list.map(btn).join('')}` : '';
  }).join('') + (PICTURES.some((p) => !used.has(p.id)) ? `<h3 class="pic-group">그 밖의 그림</h3>${PICTURES.filter((p) => !used.has(p.id)).map(btn).join('')}` : '');
  pics.querySelectorAll('button').forEach((b) => (b.onclick = () => {
    setup.picture = b.dataset.id;
    pics.querySelectorAll('button').forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); });
  }));
  document.getElementById('back').onclick = () => { location.href = location.pathname; };
  document.getElementById('create').onclick = createRoom;
}
async function createRoom() {
  const btn = document.getElementById('create'); btn.disabled = true;
  document.getElementById('err').textContent = '방을 만드는 중…';
  try {
    let c = null;
    for (let i = 0; i < 25 && !c; i++) {
      const t = String(1000 + Math.floor(Math.random() * 9000));
      const m = await net.get(`rooms/${t}/meta`);
      const old = m && (Date.now() - (m.createdAt || 0) > 12 * 3600e3 || (m.status === 'done' && Date.now() - (m.endedAt || 0) > 3600e3));
      if (!m || old) c = t;
    }
    if (!c) throw new Error('no code');
    await net.set(`rooms/${c}`, { meta: { code: c, pieces: setup.pieces, size: setup.size, picture: setup.picture, status: 'lobby', createdAt: Date.now() } });
    try { localStorage.setItem(hostKey(c), '1'); } catch (_) {}
    openBoard(c);
  } catch (e) {
    console.error(e); btn.disabled = false;
    document.getElementById('err').textContent = '방을 만들지 못했어요. ' + net.explain(e);
  }
}

// ───── 칠판 열기 ─────
export function openBoard(c) {
  code = c; go({ board: c }); view = '';
  try { isHost = localStorage.getItem(hostKey(c)) === '1'; } catch (_) { isHost = false; }
  if (unsub) unsub();
  unsub = net.on(`rooms/${c}`, (room) => {
    R = room;
    // 내보낸 학생은 칠판에서 없는 사람으로 친다 (접속이 끊길 때 남는 기록까지 무시)
    if (R && R.kicked && R.students) for (const id of Object.keys(R.kicked)) delete R.students[id];
    if (!R || !R.meta) { app.innerHTML = `<div class="sheet"><h2>방을 찾을 수 없어요</h2><p>코드 ${esc(c)}로 만든 방이 없어요.</p><div class="row"><button class="btn" onclick="location.href=location.pathname">처음으로</button></div></div>`; return; }
    const key = [R.meta.pieces, R.meta.level, R.meta.picture, R.meta.size].join('|');
    if (!built || built.key !== key) {
      built = buildPieces(R.meta); built.key = key; slots = decorSlots(built.w, built.h, c);
      built.levelOf = (id) => pieceRec(id).level || R.meta.level || 'normal';
    }
    hostTick(); schedule();
  });
  clearInterval(timer);
  timer = setInterval(() => { if (R && R.meta) { hostTick(); const el = document.getElementById('clock'); if (el && R.meta.startedAt) el.textContent = clock(); } }, 3000);
}
function schedule() { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; render(); }); }
const clock = () => {
  const m = R.meta, end = m.endedAt || (m.paused ? m.pausedAt : Date.now());
  const t = Math.max(0, Math.floor((end - m.startedAt - (m.pausedMs || 0)) / 1000)); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
const fullBtn = () => `<button class="chip" id="full">전체 화면</button>`;
const musicLabel = () => music.isEnabled() ? '♪ 음악 켜짐' : '♪ 음악 꺼짐';
function bindTop() {
  const f = document.getElementById('full');
  if (f) f.onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => {}); };
  const mb = document.getElementById('musicBtn');
  if (mb) mb.onclick = () => { music.toggle(); mb.textContent = musicLabel(); };
  const tk = document.getElementById('takeHost');
  if (tk) tk.onclick = () => { try { localStorage.setItem(hostKey(code), '1'); } catch (_) {} isHost = true; view = ''; hostTick(); schedule(); };
}
const hostNote = () => isHost ? '' : `<div class="notice"><b>선생님 화면</b> · 보면서 학생을 도울 수 있어요. 조각 배정은 방을 만든 칠판이 맡아요. 그 칠판이 꺼졌을 때만 <button class="btn small" id="takeHost">이 화면으로 진행하기</button></div>`;
const teacherUrl = () => { const u = new URL(location.href); u.search = '?board=' + code; u.hash = ''; return u.toString(); };

// 배경음악은 진행 맡은 칠판에서만 나온다 (학생 기기와 선생님 폰은 조용히)
let musicStatus = null;
function syncMusic() {
  const m = R.meta, st = m.status;
  if (isHost && st === 'done' && musicStatus === 'play' && !m.stopped) music.fanfare();
  music.setState(isHost && st === 'play' ? (m.paused ? 'hold' : 'play') : 'off');
  musicStatus = st;
}
function render() {
  if (!R || !R.meta) return;
  const st = R.meta.status;
  syncMusic();
  if (st === 'lobby') renderLobby();
  else if (st === 'play') renderPlay();
  else renderResult();
}

// ───── 대기실 ─────
function renderLobby() {
  document.title = `코드 ${code} · 협동 노노그램`;
  const L = built.L, url = joinUrl(code);
  if (view !== 'lobby') {
    view = 'lobby';
    app.innerHTML = `<div class="top">${brand('WAITING ROOM')}<div class="chips"><div class="chip size">${L.n}조각 · ${built.n}×${built.n}</div>${fullBtn()}</div></div>
    <div class="lobby">
      <div class="join">
        <span style="font-size:22px">코드</span>
        <div class="big-code">${esc(code)}</div>
        <div class="qr" id="qr"></div>
        <div class="url">${esc(url)}</div>
        <span class="dim" style="font-size:17px;line-height:1.45">QR을 찍거나 주소로 들어와요. 첫 화면에서 학생을 누르고 코드를 넣어도 돼요.</span>
      </div>
      <div class="card">
        <h2>들어온 학생 <span class="px" id="cnt" style="font-size:13px;color:var(--green)">0</span></h2>
        <div class="names" id="names"></div>
        <div class="kickbar" id="kickBar" hidden></div>
        <span class="dim" style="font-size:15px">이름을 누르면 난이도를 바꾸거나 내보낼 수 있어요.</span>
        <span class="dim" id="note" style="font-size:17px"></span>
        <div class="row"><button class="btn" id="startBtn">시작하기</button><button class="btn ghost small" id="newRoom">새 방 만들기</button></div>
        <div class="notice">선생님 폰이나 노트북으로 따로 보며 학생을 도우려면 이 주소를 여세요. 반 친구들 앞에 학생 판을 크게 띄우지 않아도 돼요.<br><span style="color:var(--fg);word-break:break-all">${esc(teacherUrl())}</span></div>
        ${hostNote()}
      </div>
    </div>${modeNotice()}`;
    const q = document.getElementById('qr');
    try { if (window.qrcode) { const qr = window.qrcode(0, 'M'); qr.addData(url); qr.make(); q.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); } } catch (_) {}
    document.getElementById('names').onclick = (e) => { const b = e.target.closest('[data-kick]'); if (b) { kickPick = b.dataset.kick; schedule(); } };
    document.getElementById('kickBar').onclick = (e) => {
      const lv = e.target.closest('[data-v]');
      if (lv && kickPick) net.update({ [`rooms/${code}/students/${kickPick}/level`]: lv.dataset.v });
      else if (e.target.id === 'kickNo') kickPick = null;
      else if (e.target.id === 'kickYes') kickStudent(kickPick);
      else return;
      schedule();
    };
    document.getElementById('startBtn').onclick = startGame;
    document.getElementById('newRoom').onclick = () => { location.href = location.pathname; };
    bindTop();
    if (!window.qrcode) setTimeout(() => { if (view === 'lobby') { view = ''; schedule(); } }, 1200);
  }
  const ss = sorted(R.students);
  document.getElementById('cnt').textContent = ss.length;
  document.getElementById('names').innerHTML = ss.length ? ss.map(([id, s]) => `<button type="button" class="${s.online === false ? 'off' : ''}${id === kickPick ? ' pick' : ''}" data-kick="${esc(id)}">${esc(s.name)} <small>${(LEVELS[s.level] || LEVELS.normal).name}</small></button>`).join('') : '<span class="dim" style="border:none;padding:0">아직 아무도 없어요</span>';
  const picked = kickPick && (R.students || {})[kickPick];
  if (!picked) kickPick = null;
  const kb = document.getElementById('kickBar');
  kb.hidden = !picked;
  const kbSig = picked ? kickPick + picked.name + picked.level : '';
  if (kb.dataset.sig !== kbSig) {
    kb.dataset.sig = kbSig;
    kb.innerHTML = picked ? `<span><b>${esc(picked.name)}</b></span>${levelButtons(picked.level || 'normal', 'kickLv')}<button type="button" class="btn pink small" id="kickYes">내보내기</button><button type="button" class="btn ghost small" id="kickNo">닫기</button>` : '';
  }
  const n = ss.length;
  document.getElementById('note').textContent = n === 0 ? '학생이 들어오면 시작할 수 있어요.'
    : n > L.n ? `조각보다 ${n - L.n}명 많아요. 남는 학생은 처음부터 친구 돕기와 꾸미기를 해요.`
    : n < L.n ? `조각이 ${L.n - n}개 남아요. 먼저 끝낸 학생이 이어서 풀어요.` : '학생과 조각 수가 딱 맞아요.';
  const sb = document.getElementById('startBtn'); sb.disabled = n === 0 || !isHost;
}
function kickStudent(id) {
  const s = (R.students || {})[id];
  kickPick = null;
  if (!s) return;
  const patch = { [`rooms/${code}/kicked/${id}`]: true, [`rooms/${code}/students/${id}`]: null };
  if (s.piece != null) patch[`rooms/${code}/pieces/p${s.piece}/owner`] = null;
  net.update(patch).catch((e) => toast(net.explain(e)));
}
function startGame() {
  if (!isHost) return;
  net.update({ [`rooms/${code}/meta/status`]: 'play', [`rooms/${code}/meta/startedAt`]: Date.now() });
  net.push(`rooms/${code}/log`, { who: '', what: '시작!', at: Date.now() });
  music.setState('play'); // 누른 순간에 소리를 풀어 둔다
}

// ───── 진행 맡은 칠판이 하는 일 ─────
function hostTick() {
  if (!isHost || !R || !R.meta || R.meta.status !== 'play' || !built) return;
  const S = R.students || {}, PC = R.pieces || {}, now = Date.now(), patch = {};
  const P = built.pieces;
  const rec = (id) => PC['p' + id] || {};
  // 주인 정리: 학생 쪽 기록과 맞지 않으면 주인 없음으로
  for (const p of P) {
    const o = rec(p.id).owner;
    if (o && !rec(p.id).done && (!S[o] || S[o].piece !== p.id)) patch[`pieces/p${p.id}/owner`] = null;
  }
  const taken = new Set(P.filter((p) => rec(p.id).done || (rec(p.id).owner && !(`pieces/p${p.id}/owner` in patch))).map((p) => p.id));
  const free = shuffle(P.filter((p) => !taken.has(p.id)).map((p) => p.id));
  const give = (sid, id) => {
    patch[`pieces/p${id}/owner`] = sid;
    // 아직 아무도 칠하지 않은 조각이면 맡은 학생의 난이도로 정한다 (칠한 칸이 남은 조각은 원래 난이도 그대로)
    const lvNow = rec(id).level, painted = ((R.cells || {})['p' + id] || '').includes('1');
    if (!lvNow || !painted) patch[`pieces/p${id}/level`] = (S[sid] && S[sid].level) || 'normal';
    patch[`students/${sid}/piece`] = id; patch[`students/${sid}/mode`] = 'solve';
    patch[`students/${sid}/want`] = null; patch[`students/${sid}/helpTarget`] = null;
  };
  for (const [sid, s] of sorted(S)) {
    // 자리를 오래 비운 학생의 조각은 다른 학생이 이어서 풀 수 있게 풀어 둔다 (칠한 칸은 그대로 남음)
    if (s.piece != null && s.online === false && now - (s.offAt || 0) > OFFLINE_RELEASE_MS && !rec(s.piece).done) {
      patch[`pieces/p${s.piece}/owner`] = null; patch[`students/${sid}/piece`] = null; patch[`students/${sid}/mode`] = 'free';
      continue;
    }
    if (s.mode === 'wait' || (s.want && s.piece == null)) {
      if (free.length) give(sid, free.shift());
      else { patch[`students/${sid}/mode`] = s.mode === 'wait' ? 'free' : s.mode; patch[`students/${sid}/want`] = null; }
    }
    // 돕던 조각이 끝났으면 자유 상태로
    if (s.mode === 'help' && (s.helpTarget == null || rec(s.helpTarget).done || !rec(s.helpTarget).owner || R.meta.noHelp || rec(s.helpTarget).noHelp)) {
      patch[`students/${sid}/mode`] = 'free'; patch[`students/${sid}/helpTarget`] = null;
    }
  }
  for (const p of P) {
    const hs = rec(p.id).helpers || {};
    for (const hid of Object.keys(hs)) {
      const h = S[hid];
      if (rec(p.id).done || !h || h.mode !== 'help' || h.helpTarget !== p.id) patch[`pieces/p${p.id}/helpers/${hid}`] = null;
    }
  }
  if (P.every((p) => rec(p.id).done)) { patch['meta/status'] = 'done'; patch['meta/endedAt'] = now; }
  const keys = Object.keys(patch);
  if (!keys.length) return;
  const sig = JSON.stringify(patch);
  if (sig === lastPatch && now - lastPatchAt < 2500) return;
  lastPatch = sig; lastPatchAt = now;
  const full = {}; for (const k of keys) full[`rooms/${code}/${k}`] = patch[k];
  net.update(full);
}

// ───── 함께 푸는 칠판 ─────
function boardData() {
  const done = {}, cells = {};
  for (const p of built.pieces) { done[p.id] = !!pieceRec(p.id).done; cells[p.id] = cellsOf(p.id); }
  const decor = Object.entries(R.decor || {}).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([, d]) => d);
  return { built, done, cells, decor, slots };
}
function renderPlay() {
  document.title = `코드 ${code} · 협동 노노그램`;
  const L = built.L, N = built.pieces.length;
  if (view !== 'play') {
    view = 'play';
    app.innerHTML = `<div class="top">${brand('PIXEL NONOGRAM')}<div class="chips">
      <div class="chip code">CODE <b>${esc(code)}</b></div><div class="chip size">${L.n}조각 · ${built.n}×${built.n}</div>
      <div class="chip">접속 <span class="px" id="online" style="font-size:12px;color:var(--green)">0</span>명</div><span class="chips" id="ctrl"></span>${isHost ? `<button class="chip" id="musicBtn">${musicLabel()}</button>` : ''}${fullBtn()}</div></div>
    <div class="notice paused" id="pausedNote" hidden><b>잠깐 멈춤</b> · 학생들은 지금 칠할 수 없어요. <b>다시 하기</b>를 누르면 이어서 풀어요.</div>
    <div class="stage">
      <div class="board-col">
        <div class="board-cap"><span>칠한 칸이 바로 나타나요 · 조각을 누르면 학생을 도울 수 있어요</span><span>시작하고 <span class="px" id="clock" style="font-size:11px;color:var(--yellow)">00:00</span></span></div>
        <div class="board-box" id="boardBox" style="max-width:calc((100vh - 140px) * ${(built.w + 10) / (built.h + 10)})"><canvas id="board"></canvas><div class="tiles" id="tiles"></div></div>
      </div>
      <aside class="side">
        <div class="card"><h2>완성한 조각</h2><div class="big" id="doneBig"></div><div class="meter"><i id="doneBar"></i></div></div>
        <div class="card"><h2>도와줘!</h2><ul class="list" id="reqList"></ul></div>
        <div class="card"><h2>지금 하는 일</h2><ul class="list" id="actList"></ul></div>
        <div class="card"><h2>기록</h2><ul class="list log" id="logList"></ul></div>
        ${hostNote()}
      </aside>
    </div>`;
    bindTop();
    const tl = document.getElementById('tiles');
    tl.addEventListener('click', (e) => { const t = e.target.closest('[data-id]'); if (t) openPanel(+t.dataset.id); });
    tl.addEventListener('keydown', (e) => { const t = e.target.closest('[data-id]'); if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openPanel(+t.dataset.id); } });
  }
  renderCtrl();
  document.getElementById('pausedNote').hidden = !R.meta.paused;
  const d = boardData();
  drawPicture(document.getElementById('board'), d);
  refreshPanel();
  // 방금 완성된 조각 반짝임
  if (doneSeen) for (const p of built.pieces) if (d.done[p.id] && !doneSeen[p.id]) { lastDoneId = p.id; lastDoneAt = performance.now(); }
  doneSeen = d.done;
  const flash = lastDoneId != null && performance.now() - lastDoneAt < 4000;
  const S = R.students || {};
  const tiles = document.getElementById('tiles'); placeTiles(tiles, built);
  tiles.innerHTML = built.pieces.map((p) => {
    const rec = pieceRec(p.id);
    if (rec.done) return `<div class="tile open${flash && lastDoneId === p.id ? ' flash' : ''}"></div>`;
    const o = rec.owner && S[rec.owner];
    const hs = Object.keys(rec.helpers || {}).length;
    const tag = rec.request && !hs ? '<span class="tag req">도와줘!</span>' : hs ? `<span class="tag help">+${hs}</span>` : '';
    return `<div class="tile${o ? ' pick' : ' empty'}"${o ? ` data-id="${p.id}" role="button" tabindex="0" aria-label="${esc(o.name)}의 ${p.label} 조각 보기"` : ''}>${tag}<span class="lab">${p.label}</span><div><span class="who">${o ? esc(o.name) : '남은 조각'}</span><div class="bar"><i style="width:${Math.round(progressOf(p) * 100)}%"></i></div></div></div>`;
  }).join('');
  const done = built.pieces.filter((p) => d.done[p.id]).length;
  document.getElementById('doneBig').innerHTML = `${done} <small>/ ${N}</small>`;
  document.getElementById('doneBar').style.width = (done / N * 100) + '%';
  document.getElementById('online').textContent = Object.values(S).filter((s) => s.online !== false).length;
  document.getElementById('clock').textContent = clock();
  const reqs = built.pieces.filter((p) => pieceRec(p.id).request && !pieceRec(p.id).done && pieceRec(p.id).owner);
  document.getElementById('reqList').innerHTML = reqs.length ? reqs.map((p) => {
    const o = S[pieceRec(p.id).owner]; const hs = Object.keys(pieceRec(p.id).helpers || {}).length;
    return `<li class="req-item"><span>${esc(o ? o.name : '')}</span><span class="px">${p.label}${hs ? ' · 도움 받는 중' : ''}</span></li>`;
  }).join('') : '<li class="dim">아직 없어요</li>';
  const c = { solve: 0, help: 0, decor: 0, free: 0 };
  for (const s of Object.values(S)) if (s.mode in c) c[s.mode]++;
  document.getElementById('actList').innerHTML = `<li><span>조각 푸는 중</span><span class="px">${c.solve}</span></li><li><span>친구 돕는 중</span><span class="px">${c.help}</span></li><li><span>꾸미기 중</span><span class="px">${c.decor}</span></li><li><span>고르는 중</span><span class="px">${c.free}</span></li><li><span>붙은 장식</span><span class="px">${d.decor.length}</span></li>`;
  const logs = Object.entries(R.log || {}).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 6);
  document.getElementById('logList').innerHTML = logs.map(([, l]) => `<li>${l.who ? `<b>${esc(l.who)}</b> ` : ''}${esc(l.what)}</li>`).join('');
}

// ───── 잠깐 멈추기 / 여기서 끝내기 ─────
let confirmEnd = false, ctrlSig = '';
// 그 조각의 도우미를 모두 내보내고 '도와줘' 요청도 지운다 (이미 칠한 칸은 그대로)
function stopHelpers(id) {
  const rec = pieceRec(id), patch = {};
  if (rec.request) patch[`rooms/${code}/pieces/p${id}/request`] = null;
  for (const hid of Object.keys(rec.helpers || {})) {
    patch[`rooms/${code}/pieces/p${id}/helpers/${hid}`] = null;
    patch[`rooms/${code}/students/${hid}/mode`] = 'free'; patch[`rooms/${code}/students/${hid}/helpTarget`] = null;
  }
  return patch;
}
function renderCtrl() {
  const el = document.getElementById('ctrl'); if (!el) return;
  const sig = [!!R.meta.paused, confirmEnd, !!R.meta.noHelp].join('|');
  if (sig === ctrlSig && el.childElementCount) return;
  ctrlSig = sig;
  el.innerHTML = confirmEnd
    ? `<span class="chip" style="border-color:var(--pink);color:var(--pink)">정말 끝낼까요?</span><button class="chip end" id="endYes">끝내기</button><button class="chip" id="endNo">취소</button>`
    : `<button class="chip" id="pauseBtn">${R.meta.paused ? '▶ 다시 하기' : 'Ⅱ 잠깐 멈추기'}</button><button class="chip" id="helpAll" aria-pressed="${!R.meta.noHelp}">${R.meta.noHelp ? '친구 돕기 꺼짐' : '친구 돕기 켜짐'}</button><button class="chip" id="endBtn">여기서 끝내기</button>`;
  const b = (id, fn) => { const x = document.getElementById(id); if (x) x.onclick = fn; };
  b('pauseBtn', () => {
    const m = R.meta, now = Date.now();
    if (m.paused) net.update({ [`rooms/${code}/meta/paused`]: null, [`rooms/${code}/meta/pausedAt`]: null, [`rooms/${code}/meta/pausedMs`]: (m.pausedMs || 0) + (now - (m.pausedAt || now)) });
    else net.update({ [`rooms/${code}/meta/paused`]: true, [`rooms/${code}/meta/pausedAt`]: now });
  });
  b('helpAll', () => {
    if (R.meta.noHelp) { net.update({ [`rooms/${code}/meta/noHelp`]: null }); toast('친구 돕기를 켰어요'); return; }
    const patch = { [`rooms/${code}/meta/noHelp`]: true };
    for (const p of built.pieces) Object.assign(patch, stopHelpers(p.id));
    net.update(patch); toast('반 전체 친구 돕기를 껐어요');
  });
  b('endBtn', () => { confirmEnd = true; renderCtrl(); });
  b('endNo', () => { confirmEnd = false; renderCtrl(); });
  b('endYes', () => {
    confirmEnd = false; closePanel();
    const m = R.meta, now = Date.now(), patch = {
      [`rooms/${code}/meta/status`]: 'done', [`rooms/${code}/meta/endedAt`]: now, [`rooms/${code}/meta/stopped`]: true,
      [`rooms/${code}/meta/paused`]: null, [`rooms/${code}/meta/pausedAt`]: null,
    };
    if (m.paused) patch[`rooms/${code}/meta/pausedMs`] = (m.pausedMs || 0) + (now - (m.pausedAt || now));
    net.update(patch);
    net.push(`rooms/${code}/log`, { who: '', what: '선생님이 여기서 끝냈어요', at: now });
  });
}

// ───── 완성 ─────
let showAll = false;
const unfinished = () => built.pieces.filter((p) => !pieceRec(p.id).done);
// 끝까지 못 푼 조각: 전체 그림을 보여 줄 때 흐리게 덮어 구분한다
function dimUnfinished(cv, scale) {
  const x = cv.getContext('2d'); x.fillStyle = 'rgba(11,15,26,.55)';
  const n = built.n; for (const p of unfinished()) x.fillRect((5 + p.c * n) * scale, (5 + p.r * n) * scale, n * scale, n * scale);
}
function drawResult(cv, scale) {
  const d = boardData(), part = unfinished().length > 0;
  drawPicture(cv, { ...d, all: !part || showAll, scale });
  if (part && showAll) dimUnfinished(cv, scale);
}
function renderResult() {
  const N = built.pieces.length, left = unfinished().length, done = N - left;
  document.title = (left ? '오늘은 여기까지' : '완성!') + ' · 협동 노노그램';
  if (view !== 'done') {
    view = 'done'; showNames = false; showAll = false;
    app.innerHTML = `<div class="result">
      <div class="top">${brand(left ? 'GOOD JOB' : 'COMPLETE')}<div class="chips"><div class="chip">걸린 시간 <span class="px" style="font-size:12px;color:var(--yellow)">${R.meta.startedAt ? clock() : '-'}</span></div>${fullBtn()}</div></div>
      <h2>${left ? `오늘은 여기까지! <span class="px" style="font-size:22px;color:var(--yellow)">${done} / ${N}</span> 조각 완성` : '우리 반 협동화 완성!'}</h2>
      <div class="board-box"><canvas id="resCanvas"></canvas><div class="tiles" id="resTiles"></div></div>
      <div class="row">${left ? '<button class="btn small blue" id="all" aria-pressed="false">전체 그림 보기</button>' : ''}<button class="btn ghost small" id="names" aria-pressed="false">칠한 사람 보기</button><button class="btn small yellow" id="save">이미지 내려받기</button><button class="btn small" id="newRoom">새 방 만들기</button></div>
      <h2 style="font-size:24px;color:var(--fg)">함께한 친구들</h2>
      <div class="credits" id="credits"></div>
    </div>`;
    bindTop();
    document.getElementById('names').onclick = (e) => { showNames = !showNames; e.currentTarget.setAttribute('aria-pressed', showNames); e.currentTarget.textContent = showNames ? '그림만 보기' : '칠한 사람 보기'; paintNames(); };
    document.getElementById('save').onclick = saveImage;
    const al = document.getElementById('all');
    if (al) al.onclick = (e) => { showAll = !showAll; e.currentTarget.setAttribute('aria-pressed', showAll); e.currentTarget.textContent = showAll ? '우리가 칠한 만큼 보기' : '전체 그림 보기'; drawResult(document.getElementById('resCanvas'), 8); };
    document.getElementById('newRoom').onclick = () => { location.href = location.pathname; };
  }
  drawResult(document.getElementById('resCanvas'), 8);
  paintNames();
  document.getElementById('credits').innerHTML = sorted(R.students).map(([, s]) => {
    const bits = []; if (s.helps) bits.push(`도움 ${s.helps}번`); if (s.decor) bits.push(`장식 ${s.decor}개`);
    const ps = Object.values(s.done || {});
    return `<div class="credit"><b>${esc(s.name)}</b><span>${ps.length ? ps.map(esc).join(', ') : '조각 없음'}</span>${bits.length ? `<em>${bits.join(' · ')}</em>` : ''}</div>`;
  }).join('');
}
function paintNames() {
  const el = document.getElementById('resTiles'); placeTiles(el, built);
  el.innerHTML = built.pieces.map((p) => showNames ? `<div class="tile names"><span>${esc(pieceRec(p.id).by || '')}</span></div>` : '<div class="tile open"></div>').join('');
}
function saveImage() {
  const sc = 14, cv = document.createElement('canvas');
  drawResult(cv, sc);
  const out = document.createElement('canvas'); out.width = cv.width; out.height = cv.height + 70;
  const x = out.getContext('2d'); x.fillStyle = '#0B0F1A'; x.fillRect(0, 0, out.width, out.height); x.drawImage(cv, 0, 0);
  if (showNames) {
    x.font = `${Math.round(sc * 1.3)}px "Do Hyeon", sans-serif`; x.textBaseline = 'bottom';
    for (const p of built.pieces) {
      const t = pieceRec(p.id).by || ''; if (!t) continue;
      const n = built.n, px = (5 + p.c * n) * sc + 8, py = (5 + p.r * n + n) * sc - 8, w = x.measureText(t).width;
      x.fillStyle = 'rgba(11,15,26,.82)'; x.fillRect(px - 4, py - sc * 1.5, w + 8, sc * 1.6); x.fillStyle = '#E8ECFF'; x.fillText(t, px, py);
    }
  }
  const dt = new Date();
  x.fillStyle = '#39FF88'; x.font = '34px "Do Hyeon", sans-serif'; x.textBaseline = 'middle'; x.fillText(unfinished().length ? `우리 반 협동화 (${built.pieces.length - unfinished().length}/${built.pieces.length})` : '우리 반 협동화', 20, cv.height + 36);
  x.fillStyle = '#8A93C2'; x.font = '20px "Do Hyeon", sans-serif'; x.textAlign = 'right';
  x.fillText(`${Object.keys(R.students || {}).length}명 · ${built.pieces.length}조각 · ${dt.getFullYear()}.${dt.getMonth() + 1}.${dt.getDate()}`, out.width - 20, cv.height + 36);
  out.toBlob((b) => {
    if (!b) { toast('이미지를 만들지 못했어요'); return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(b);
    a.download = `우리반-협동화-${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}.png`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

// ───── 선생님이 학생 직접 돕기: 조각을 누르면 열림 ─────
let panelId = null, panelGrid = null, panelWrong = false, panelCool = 0, panelSig = '';
let tGrid = null, tPending = false, tTimer = 0, tTool = 1; // 선생님이 직접 칠할 때 쓰는 판
let panelLevelAsk = null; // 칠한 칸이 지워져도 난이도를 바꿀지 묻는 중
function openPanel(id) {
  panelId = id; panelWrong = false; panelSig = ''; tGrid = null; tPending = false; panelLevelAsk = null;
  let el = document.getElementById('panel');
  if (!el) {
    el = document.createElement('div'); el.id = 'panel'; el.className = 'overlay';
    el.addEventListener('click', (e) => { if (e.target === el) closePanel(); });
    document.body.appendChild(el);
  }
  el.hidden = false;
  refreshPanel(true);
}
function closePanel() { flushTeacher(); panelId = null; panelGrid = null; tGrid = null; const el = document.getElementById('panel'); if (el) el.hidden = true; }
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panelId != null) closePanel(); });
function wrongSet(p) {
  const st = cellsOf(p.id), w = new Set();
  const n = built.n; for (let i = 0; i < n * n; i++) if (st[i] === '1' && !p.sol[i / n | 0][i % n]) w.add(i);
  return w;
}
function flushTeacher() {
  clearTimeout(tTimer);
  if (!tPending || panelId == null || !tGrid) return;
  tPending = false;
  const id = panelId;
  net.update({ [`rooms/${code}/cells/p${id}`]: fromGrid(tGrid), [`rooms/${code}/pieces/p${id}/teacherAt`]: Date.now() });
}
function refreshPanel(force) {
  if (panelId == null || !R || !built) return;
  // 학생이 칠한 최신 상태를 받아 온다 (선생님이 칠하는 중에는 기다림)
  if (!tPending && !(panelGrid && panelGrid.isDragging())) tGrid = toGrid(cellsOf(panelId));
  const el = document.getElementById('panel'); if (!el) return;
  const p = built.pieces[panelId], rec = pieceRec(p.id), S = R.students || {};
  const o = rec.owner && S[rec.owner];
  const hs = Object.values(rec.helpers || {});
  const left = CHECKS_PER_PIECE + (rec.bonus || 0) - (rec.checks || 0);
  const w = wrongSet(p);
  const sig = [rec.done, rec.owner, hs.join(), left, panelWrong, panelCool > Date.now(), !!rec.request, o && o.online, tTool, built.levelOf(panelId), panelLevelAsk, !!rec.noHelp, !!R.meta.noHelp].join('|');
  if (panelGrid && panelGrid.isDragging()) return;
  if (!force && sig === panelSig && panelGrid) {
    // 칠한 칸이 바뀌면 판과 숫자만 고친다 (다시 그리면 선생님이 누르던 칸을 놓친다)
    panelGrid.refresh();
    const pg = document.getElementById('pPct'); if (pg) pg.textContent = Math.round(progressOf(p) * 100);
    const pw = document.getElementById('pWrong'); if (pw && !panelWrong) pw.textContent = `틀린 칸 보기 (${w.size})`;
    const pr = document.getElementById('pReveal'); if (pr) pr.disabled = !w.size;
    return;
  }
  panelSig = sig;
  if (rec.done || !o) {
    el.innerHTML = `<div class="sheet"><h2>${p.label} 조각</h2><p>${rec.done ? '이 조각은 완성됐어요.' : '지금은 맡은 학생이 없어요.'}</p><div class="row"><button class="btn" id="pClose">닫기</button></div></div>`;
    panelGrid = null; document.getElementById('pClose').onclick = closePanel; return;
  }
  el.innerHTML = `<div class="sheet">
    <div class="row" style="justify-content:space-between"><h2>${esc(o.name)}의 <span class="px" style="font-size:20px">${p.label}</span> <span class="dim" style="font-size:18px">${(LEVELS[built.levelOf(p.id)] || {}).name || ''}</span></h2><button class="btn ghost small" id="pClose">닫기</button></div>
    <p><span id="pPct">${Math.round(progressOf(p) * 100)}</span>% 칠함 · 검사하기 ${left > 0 ? left + '번 남음' : '다 씀'}${hs.length ? ' · 돕는 친구 ' + hs.map(esc).join(', ') : ''}${rec.request ? ' · <span style="color:var(--pink)">도와줘!</span>' : ''}${o.online === false ? ' · 접속 끊김' : ''}</p>
    ${panelLevelAsk
      ? `<div class="banner pink"><span>칠한 칸이 지워져요. ${(LEVELS[panelLevelAsk] || {}).name}으로 바꿀까요?</span><span class="row" style="gap:8px"><button class="btn small pink" id="pLvYes">바꾸기</button><button class="btn small ghost" id="pLvNo">취소</button></span></div>`
      : `<div class="lvrow"><span class="dim">난이도</span>${levelButtons(built.levelOf(p.id), 'pLv')}</div>`}
    <div class="grid-host" id="pGrid"></div>
    <div class="msg ${panelCool > Date.now() ? '' : 'hi'}">${panelCool > Date.now() ? '학생 화면에 그 줄이 반짝였어요' : '칸을 누르면 학생 판에 직접 칠해져요 · 숫자를 누르면 그 줄이 반짝여요'}</div>
    <div class="tools"><button class="tool" id="ptFill" aria-pressed="${tTool === 1}">칠하기</button><button class="tool" id="ptX" aria-pressed="${tTool === 2}">× 표시</button></div>
    <div class="row">
      <button class="btn ghost small" id="pWrong" aria-pressed="${panelWrong}">${panelWrong ? '틀린 칸 숨기기' : `틀린 칸 보기 (${w.size})`}</button>
      <button class="btn small pink" id="pReveal" ${w.size ? '' : 'disabled'}>학생에게 틀린 칸 보여 주기</button>
      <button class="btn small yellow" id="pBonus">검사하기 1번 더 주기</button>
      ${R.meta.noHelp ? '<button class="btn ghost small" disabled>반 전체 돕기 꺼짐</button>' : `<button class="btn ghost small" id="pHelp" aria-pressed="${!rec.noHelp}">${rec.noHelp ? '돕기 다시 허용' : '돕기 그만'}</button>`}
    </div>
    <span class="dim" style="font-size:15px">틀린 칸 보기는 이 화면에만 보여요. 칠판이 반 전체에 보인다면 선생님 폰에서 여세요.</span>
  </div>`;
  panelGrid = buildGrid(document.getElementById('pGrid'), {
    sol: p.sol, editable: true, cls: 'watch teach', tool: () => tTool,
    get: (r, c) => tGrid[r][c],
    set: (r, c, v) => { tGrid[r][c] = v; tPending = true; clearTimeout(tTimer); tTimer = setTimeout(flushTeacher, 150); },
    onStrokeEnd: () => { flushTeacher(); },
    wrong: () => (panelWrong ? wrongSet(p) : null),
    hl: () => { const h = (R.hl || {})['p' + p.id]; return h && Date.now() - h.at < 5000 ? h : null; },
    onHint: (type, i) => {
      if (panelCool > Date.now()) return;
      panelCool = Date.now() + 3000;
      net.set(`rooms/${code}/hl/p${p.id}`, { type, i, by: 'teacher', name: '선생님', at: Date.now() });
      refreshPanel(true); setTimeout(() => refreshPanel(true), 3100);
    },
  });
  document.getElementById('pClose').onclick = closePanel;
  const pHelp = document.getElementById('pHelp');
  if (pHelp) pHelp.onclick = () => {
    if (rec.noHelp) { net.update({ [`rooms/${code}/pieces/p${p.id}/noHelp`]: null }); toast(`${o.name}의 조각에 돕기를 다시 허용했어요`); return; }
    net.update({ ...stopHelpers(p.id), [`rooms/${code}/pieces/p${p.id}/noHelp`]: true });
    toast(`${o.name}의 조각에 돕기를 멈췄어요`);
  };
  const setPanelLevel = (lv) => {
    panelLevelAsk = null; clearTimeout(tTimer); tPending = false; panelWrong = false;
    net.update(levelPatch(`rooms/${code}`, p.id, lv, rec.owner));
    toast(`${o.name}의 난이도를 ${(LEVELS[lv] || {}).name}으로 바꿨어요`);
    refreshPanel(true);
  };
  document.querySelectorAll('#pLv button').forEach((b) => (b.onclick = () => {
    const lv = b.dataset.v;
    if (lv === built.levelOf(p.id)) return;
    if (/[12]/.test(cellsOf(p.id))) { panelLevelAsk = lv; refreshPanel(true); } else setPanelLevel(lv);
  }));
  const pYes = document.getElementById('pLvYes');
  if (pYes) { pYes.onclick = () => setPanelLevel(panelLevelAsk); document.getElementById('pLvNo').onclick = () => { panelLevelAsk = null; refreshPanel(true); }; }
  document.getElementById('ptFill').onclick = () => { tTool = 1; refreshPanel(true); };
  document.getElementById('ptX').onclick = () => { tTool = 2; refreshPanel(true); };
  document.getElementById('pWrong').onclick = () => { panelWrong = !panelWrong; refreshPanel(true); };
  document.getElementById('pReveal').onclick = () => { net.set(`rooms/${code}/pieces/p${p.id}/reveal`, Date.now()); toast(`${o.name} 화면에 틀린 칸을 보여 줬어요`); };
  document.getElementById('pBonus').onclick = () => { net.set(`rooms/${code}/pieces/p${p.id}/bonus`, (rec.bonus || 0) + 1); toast(`${o.name}에게 검사하기를 1번 더 줬어요`); };
}
