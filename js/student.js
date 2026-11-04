// 학생 화면: 코드로 들어가기 → 기다리기 → 내 조각 풀기 / 친구 돕기 / 꾸미기 퍼즐 → 완성
import * as net from './net.js?v=1104-1102';
import { app, brand, modeNotice, toast, go, verLine } from './ui.js?v=1104-1102';
import { buildPieces, josa, LEVELS, LEVEL_KEYS, decorSlots, SPRITES, esc, emptyOf, toGrid, fromGrid, isSolved, lineMatches, filledCount, buildGrid, MAX_HELPERS, CHECKS_PER_PIECE } from './game.js?v=1104-1102';

let code = null, sid = null, myName = '', myLevel = 'normal', R = null, built = null, unsub = null, raf = 0;
let lastSig = '', gridCtl = null, tool = 1;
let grid = null, gridPiece = null, writeTimer = 0;
let wrong = null, wrongUntil = 0, msgOverride = null;
let justDone = null, lastHlAt = 0, lastRevealAt = 0, confirmClear = false, hintCool = 0, prevMode = null, prevTarget = null;
let decor = null; // { sp, g, done }
const ss = { get: (k) => { try { return sessionStorage.getItem(k); } catch (_) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (_) {} } };
const base = () => `rooms/${code}`;
const me = () => (R && R.students && R.students[sid]) || null;
const pieceRec = (id) => ((R && R.pieces) || {})['p' + id] || {};
const cellsOf = (id) => ((R && R.cells) || {})['p' + id] || emptyOf(built ? built.n : 10);
const log = (what) => net.push(`${base()}/log`, { who: myName, what, at: Date.now() });

// ───── 난이도 고르기 ─────
const levelSeg = (cur) => `<div class="seg lvseg" id="lvPick" role="radiogroup" aria-label="난이도">${LEVEL_KEYS.map((k) => `<button type="button" data-v="${k}" aria-pressed="${k === cur}">${LEVELS[k].name} <span class="dim">${LEVELS[k].note}</span></button>`).join('')}</div>`;
function bindLevelSeg(onPick) {
  document.querySelectorAll('#lvPick button').forEach((b) => (b.onclick = () => {
    document.querySelectorAll('#lvPick button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    onPick(b.dataset.v);
  }));
}

// ───── 들어가기 ─────
export function openJoin(prefill) {
  go(prefill ? { room: prefill } : null);
  document.title = '들어가기 · 협동 노노그램';
  app.innerHTML = `<div class="top">${brand('JOIN')}</div>
  <form class="sheet blue" id="f" autocomplete="off">
    <h2>들어가기</h2>
    <p>칠판에 나온 4자리 코드와 내 이름을 넣어요.</p>
    <label class="field"><span>코드</span><input class="codein" id="code" inputmode="numeric" maxlength="4" value="${esc(prefill || '')}" placeholder="0000"></label>
    <label class="field"><span>이름</span><input type="text" id="name" maxlength="6" value="${esc(ss.get('cono-lastname') || '')}" placeholder="예: 김하늘"></label>
    <div class="field"><span>난이도</span>${levelSeg(ss.get('cono-level') || 'normal')}</div>
    <div class="row"><button class="btn blue" type="submit" id="go">들어가기</button><button class="btn ghost" type="button" id="back">처음으로</button></div>
    <div class="err" id="err"></div>
    ${modeNotice()}
  </form>${verLine()}`;
  const f = document.getElementById('f');
  document.getElementById('back').onclick = () => { location.href = location.pathname; };
  (prefill ? document.getElementById('name') : document.getElementById('code')).focus();
  bindLevelSeg(() => {});
  f.onsubmit = async (e) => {
    e.preventDefault();
    const c = document.getElementById('code').value.replace(/\D/g, '');
    const n = document.getElementById('name').value.trim().slice(0, 6);
    const lv = (document.querySelector('#lvPick [aria-pressed="true"]') || {}).dataset?.v || 'normal';
    const err = document.getElementById('err');
    if (c.length !== 4) { err.textContent = '코드 4자리를 넣어 주세요.'; return; }
    if (!n) { err.textContent = '이름을 넣어 주세요.'; return; }
    document.getElementById('go').disabled = true;
    try {
      const m = await net.get(`rooms/${c}/meta`);
      if (!m) { err.textContent = '그런 방이 없어요. 코드를 다시 확인해 주세요.'; document.getElementById('go').disabled = false; return; }
      if (m.status === 'done') { err.textContent = '이미 완성된 방이에요.'; document.getElementById('go').disabled = false; return; }
      ss.set('cono-name-' + c, n); ss.set('cono-lastname', n); ss.set('cono-level', lv);
      openStudent(c);
    } catch (_) {
      err.textContent = net.explain(_); document.getElementById('go').disabled = false;
    }
  };
}

// ───── 방에 들어감 ─────
export async function openStudent(c) {
  code = c;
  myName = ss.get('cono-name-' + c) || '';
  myLevel = ss.get('cono-level') || 'normal';
  if (!myName) { openJoin(c); return; }
  go({ room: c });
  sid = ss.get('cono-sid-' + c);
  const existing = sid ? await net.get(`${base()}/students/${sid}`) : null;
  if (!existing) {
    sid = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    ss.set('cono-sid-' + c, sid);
    await net.set(`${base()}/students/${sid}`, { name: myName, level: myLevel, joinedAt: Date.now(), mode: 'wait', online: true });
  } else {
    await net.update({ [`${base()}/students/${sid}/online`]: true });
  }
  net.onDisconnect({ [`${base()}/students/${sid}/online`]: false, [`${base()}/students/${sid}/offAt`]: { '.sv': 'timestamp' } }).catch?.(() => {});
  if (unsub) unsub();
  unsub = net.on(base(), (room) => {
    R = room;
    const key = R && R.meta ? [R.meta.pieces, R.meta.level, R.meta.picture, R.meta.size].join('|') : '';
    if (R && R.meta && (!built || built.key !== key)) {
      built = buildPieces(R.meta); built.key = key;
      built.levelOf = (id) => pieceRec(id).level || R.meta.level || 'normal';
      built.slots = decorSlots(built.w, built.h, code);
    }
    schedule();
  });
  setInterval(() => { if (R) schedule(); }, 1000);
}
function schedule() { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; render(); }); }

function signature() {
  const m = me(); const st = R.meta.status;
  const parts = [st, !!R.meta.paused, m && m.mode, m && m.piece, m && m.helpTarget, m && m.want, decor && decor.done];
  if (m && m.mode === 'solve') { const r = pieceRec(m.piece); parts.push(Object.keys(r.helpers || {}).join(), !!r.request, r.checks || 0, r.bonus || 0, confirmClear); }
  if (m && m.mode === 'free') {
    parts.push(built.pieces.filter((p) => !pieceRec(p.id).done && !pieceRec(p.id).owner).length,
      built.pieces.map((p) => { const r = pieceRec(p.id); return r.done ? 'd' : (r.owner ? (r.request ? 'r' : 'o') + Object.keys(r.helpers || {}).length : '-'); }).join(''),
      Math.floor(Date.now() / 8000));
  }
  if (m && m.mode === 'help') parts.push(hintCool > Date.now());
  return parts.join('|');
}
function render() {
  if (!R || !R.meta) { app.innerHTML = `<div class="sheet blue"><h2>방이 사라졌어요</h2><p>선생님께 새 코드를 물어보세요.</p><div class="row"><button class="btn blue" onclick="location.href=location.pathname">처음으로</button></div></div>`; return; }
  const m = me();
  if (!m) { // 지워졌으면 다시 등록
    net.set(`${base()}/students/${sid}`, { name: myName, level: myLevel, joinedAt: Date.now(), mode: 'wait', online: true });
    return;
  }
  // 돕던 친구가 사양했을 때 알림
  if (prevMode === 'help' && m.mode === 'free' && prevTarget != null && !pieceRec(prevTarget).done) toast('친구가 혼자 풀어 보고 싶대요');
  prevMode = m.mode; prevTarget = m.helpTarget;
  adoptRemote(m);
  const sig = signature();
  if (sig !== lastSig && !(gridCtl && gridCtl.isDragging())) { lastSig = sig; draw(); }
  else if (gridCtl) { gridCtl.refresh(); updateMsg(); }
  checkHighlight();
}

// 선생님이 내 판에 직접 칠했으면 받아 온다 (내가 칠하는 중이거나 아직 보내지 않은 칸이 있으면 기다림)
let lastTeacherAt = 0;
function adoptRemote(m) {
  if (!m || m.mode !== 'solve' || m.piece == null || gridPiece !== m.piece || !grid || pending) return;
  if (gridCtl && gridCtl.isDragging()) return;
  const remote = cellsOf(m.piece);
  if (remote === fromGrid(grid)) return;
  grid = toGrid(remote); wrong = null; msgOverride = null;
  const ta = pieceRec(m.piece).teacherAt || 0;
  if (ta > lastTeacherAt) { lastTeacherAt = ta; toast('선생님이 내 판에 칸을 칠해 줬어요'); }
  if (gridCtl) { gridCtl.refresh(); updateMsg(); }
  const p = built.pieces[m.piece];
  if (isSolved(p.sol, grid) && R.meta.status === 'play') finishPiece(p);
}
const head = (lab, cls, hid) => {
  const N = built.pieces.length, done = built.pieces.filter((p) => pieceRec(p.id).done).length;
  return `<div class="dhead"><div style="display:flex;flex-direction:column;gap:8px"><div class="mylab ${cls || ''}">${lab}</div>
    <div class="dim" style="font-size:17px">${esc(myName)} · 우리 반 <span class="px" style="font-size:12px;color:var(--green)">${done}</span> / ${N} 조각 완성</div></div>
    <div class="minimap" style="grid-template-columns:repeat(${built.L.c},12px)" aria-hidden="true">${built.pieces.map((p) => `<i class="${p.id === hid ? 'm' : pieceRec(p.id).done ? 'd' : ''}"></i>`).join('')}</div></div>`;
};
const toolsHtml = () => `<div class="tools"><button class="tool" id="tFill" aria-pressed="${tool === 1}">칠하기</button><button class="tool" id="tX" aria-pressed="${tool === 2}">× 표시</button></div>`;
function bindTools() {
  const a = document.getElementById('tFill'), b = document.getElementById('tX');
  if (a) a.onclick = () => { tool = 1; a.setAttribute('aria-pressed', 'true'); b.setAttribute('aria-pressed', 'false'); };
  if (b) b.onclick = () => { tool = 2; b.setAttribute('aria-pressed', 'true'); a.setAttribute('aria-pressed', 'false'); };
}
const progressOf = (p) => { const r = pieceRec(p.id); if (r.done) return 1; const s = cellsOf(p.id); let k = 0; const n = built.n; for (let i = 0; i < n * n; i++) if (s[i] === '1' && p.sol[i / n | 0][i % n]) k++; return p.fills ? k / p.fills : 0; };

function draw() {
  const m = me(), st = R.meta.status;
  gridCtl = null;
  document.title = `${myName} · 협동 노노그램`;
  const wrapStart = '<div class="phone">';
  if (st === 'lobby' || (st === 'play' && m.mode === 'wait')) {
    app.innerHTML = wrapStart + head('기다리는 중', 'blue', -1) + `<div class="pane"><h3>${esc(myName)}, 반가워요!</h3>
      <p>${st === 'lobby' ? '선생님이 시작하면 내 조각이 나와요.' : '조각을 받는 중이에요…'}</p>
      <p class="dim">코드 <span class="px" style="font-size:12px;color:var(--yellow)">${esc(code)}</span></p></div>${modeNotice()}</div>`;
    return;
  }
  if (st === 'play' && R.meta.paused) {
    flush(gridPiece);
    app.innerHTML = wrapStart + head('잠깐 멈춤', 'yellow', -1) + `<div class="pausebox"><h3>선생님이 잠깐 멈췄어요</h3><p class="dim" style="margin:0;font-size:18px">선생님 말씀을 들어요. 다시 시작하면 이어서 풀 수 있어요.</p></div></div>`;
    return;
  }
  if (st === 'done') {
    const mine = Object.values(m.done || {});
    const stopped = built.pieces.some((p) => !pieceRec(p.id).done);
    app.innerHTML = wrapStart + head(stopped ? '끝!' : '완성!', 'yellow', -1) + `<div class="pane"><h3>${stopped ? '오늘은 여기까지!' : '우리 반 작품 완성!'}</h3><p>칠판을 보세요.</p>
      ${mine.length ? `<p>내가 칠한 조각: ${mine.map(esc).join(', ')}</p>` : ''}</div></div>`;
    return;
  }
  if (m.mode !== 'solve') gridPiece = null;
  if (m.mode !== 'free') justDone = null;
  if (m.mode === 'solve' && m.piece != null) return drawSolve(m);
  if (m.mode === 'help' && m.helpTarget != null) return drawHelp(m);
  if (m.mode === 'decor') return drawDecor(m);
  return drawFree(m);
}

// ───── 내 조각 풀기 ─────
function drawSolve(m) {
  const p = built.pieces[m.piece], rec = pieceRec(p.id);
  if (gridPiece !== p.id) { grid = toGrid(cellsOf(p.id)); gridPiece = p.id; wrong = null; confirmClear = false; lastRevealAt = rec.reveal || 0; }
  const hs = Object.entries(rec.helpers || {});
  const names = esc(josa(hs.map(([, n]) => n).join(', '), '이', '가'));
  let banner = '';
  if (hs.length) banner = rec.request ? `<div class="banner"><span>${names} 도와주는 중</span></div>`
    : `<div class="banner"><span>${names} 도와주러 왔어요</span><button class="btn small ghost" id="decline">괜찮아</button></div>`;
  else if (rec.request) banner = `<div class="banner pink"><span>도와줘를 보냈어요. 먼저 끝낸 친구가 와요</span></div>`;
  const left = CHECKS_PER_PIECE + (rec.bonus || 0) - (rec.checks || 0);
  app.innerHTML = '<div class="phone">' + head(`내 조각 <span class="px">${p.label}</span> · ${(LEVELS[built.levelOf(p.id)] || {}).name || ''}`, '', p.id) + `<div class="grid-host" id="gh"></div>${banner}
    <div class="msg" id="msg"></div>${toolsHtml()}
    ${confirmClear
      ? `<div class="banner pink"><span>정말 다 지울까요?</span><span class="row" style="gap:8px"><button class="btn small pink" id="clearYes">지우기</button><button class="btn small ghost" id="clearNo">취소</button></span></div>`
      : `<div class="subtools three">${rec.request || hs.length ? '<span></span>' : '<button class="btn ghost small" id="ask">도와줘</button>'}
      <button class="btn ghost small" id="check" ${left > 0 ? '' : 'disabled'}>검사하기 ${left > 0 ? `(${left})` : '(다 씀)'}</button>
      <button class="btn ghost small" id="clear">전체 지우기</button></div>`}</div>`;
  gridCtl = buildGrid(document.getElementById('gh'), {
    sol: p.sol, editable: true, tool: () => tool,
    get: (r, c) => grid[r][c],
    set: (r, c, v) => { grid[r][c] = v; wrong = null; msgOverride = null; queueWrite(p.id); },
    hl: currentHl, wrong: () => (wrong && Date.now() < wrongUntil ? wrong : null),
    onChange: () => { if (isSolved(p.sol, grid)) finishPiece(p); else updateMsg(); },
  });
  bindTools();
  const ask = document.getElementById('ask');
  if (ask) ask.onclick = () => { net.update({ [`${base()}/pieces/p${p.id}/request`]: true, [`${base()}/students/${sid}/declined`]: null }); log(`도와줘! (${p.label})`); };
  const dec = document.getElementById('decline');
  if (dec) dec.onclick = () => {
    const patch = { [`${base()}/pieces/p${p.id}/helpers`]: null, [`${base()}/students/${sid}/declined`]: true };
    for (const [hid] of hs) { patch[`${base()}/students/${hid}/mode`] = 'free'; patch[`${base()}/students/${hid}/helpTarget`] = null; }
    net.update(patch);
  };
  const ck = document.getElementById('check');
  if (ck) ck.onclick = () => {
    const r2 = pieceRec(p.id);
    if ((r2.checks || 0) >= CHECKS_PER_PIECE + (r2.bonus || 0)) return;
    showWrong(p, '');
    net.update({ [`${base()}/pieces/p${p.id}/checks`]: (r2.checks || 0) + 1 });
  };
  const cl = document.getElementById('clear');
  if (cl) cl.onclick = () => { confirmClear = true; lastSig = ''; schedule(); };
  const cy = document.getElementById('clearYes');
  if (cy) cy.onclick = () => {
    grid = grid.map((r) => r.map(() => 0)); wrong = null; msgOverride = null; confirmClear = false;
    flush(p.id); lastSig = ''; schedule();
  };
  const cn = document.getElementById('clearNo');
  if (cn) cn.onclick = () => { confirmClear = false; lastSig = ''; schedule(); };
  updateMsg();
}
// 틀린 칸을 잠깐 분홍으로 보여 준다 (검사하기, 또는 선생님이 보여 줄 때)
function showWrong(p, who) {
  const n = p.sol.length, w = new Set(); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (grid[r][c] === 1 && !p.sol[r][c]) w.add(r * n + c);
  wrong = w; wrongUntil = Date.now() + 6000;
  msgOverride = w.size ? { t: `${who}틀린 칸 ${w.size}개를 분홍으로 보여 줬어요`, c: 'bad' } : { t: `${who}틀린 칸은 없어요. 아직 덜 칠한 칸이 있어요`, c: 'ok' };
  if (gridCtl) gridCtl.refresh(); updateMsg();
  setTimeout(() => { msgOverride = null; if (gridCtl) { gridCtl.refresh(); updateMsg(); } }, 6100);
}
function updateMsg() {
  const el = document.getElementById('msg'); const m = me();
  if (!el || !m || m.mode !== 'solve' || m.piece == null || !grid) return;
  if (msgOverride) { el.className = 'msg ' + msgOverride.c; el.textContent = msgOverride.t; return; }
  const p = built.pieces[m.piece];
  const n = p.sol.length; let ok = 0; for (let i = 0; i < n; i++) { if (lineMatches(grid[i], p.sol[i])) ok++; if (lineMatches(grid.map((r) => r[i]), p.sol.map((r) => r[i]))) ok++; }
  if (filledCount(grid) >= p.fills && !isSolved(p.sol, grid)) { el.className = 'msg bad'; el.textContent = '어딘가 틀렸어요. 힌트를 다시 살펴봐요'; }
  else { el.className = 'msg'; el.textContent = `힌트가 맞은 줄 ${ok} / ${n * 2}`; }
}
let pending = false;
function queueWrite(id) {
  pending = true;
  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => flush(id), 180);
}
function flush(id) {
  clearTimeout(writeTimer);
  pending = false;
  if (gridPiece !== id || !grid) return Promise.resolve();
  return net.set(`${base()}/cells/p${id}`, fromGrid(grid));
}
async function finishPiece(p) {
  if (!R || !R.meta || R.meta.status !== 'play' || gridPiece !== p.id) return;
  await flush(p.id);
  const m = me();
  justDone = p.label; gridPiece = null; grid = null; msgOverride = null;
  const patch = {
    [`${base()}/pieces/p${p.id}/done`]: true, [`${base()}/pieces/p${p.id}/by`]: myName, [`${base()}/pieces/p${p.id}/doneAt`]: Date.now(),
    [`${base()}/pieces/p${p.id}/request`]: null, [`${base()}/pieces/p${p.id}/helpers`]: null,
    [`${base()}/students/${sid}/piece`]: null, [`${base()}/students/${sid}/mode`]: 'free', [`${base()}/students/${sid}/done/p${p.id}`]: p.label,
  };
  for (const hid of Object.keys(pieceRec(p.id).helpers || {})) { patch[`${base()}/students/${hid}/mode`] = 'free'; patch[`${base()}/students/${hid}/helpTarget`] = null; }
  await net.update(patch);
  log(`${p.label} 완성`);
}
function currentHl() {
  const m = me(); if (!m) return null;
  const id = m.mode === 'solve' ? m.piece : m.mode === 'help' ? m.helpTarget : null;
  if (id == null) return null;
  const h = ((R.hl || {})['p' + id]);
  return h && Date.now() - h.at < 5000 ? h : null;
}
function checkHighlight() {
  const m = me(); if (!m || m.mode !== 'solve' || m.piece == null) return;
  const rv = pieceRec(m.piece).reveal || 0;
  if (rv > lastRevealAt && grid && gridPiece === m.piece) { lastRevealAt = rv; showWrong(built.pieces[m.piece], '선생님이 '); }
  const h = (R.hl || {})['p' + m.piece];
  if (h && h.at > lastHlAt && h.by !== sid && Date.now() - h.at < 5000) {
    lastHlAt = h.at;
    toast(`${h.name}: ${h.i + 1}번째 ${h.type === 'row' ? '가로' : '세로'}줄 봐 봐!`);
    if (gridCtl) gridCtl.refresh();
    setTimeout(() => { if (gridCtl) gridCtl.refresh(); }, 5100);
  }
}

// ───── 고르기: 남은 조각 / 친구 돕기 / 꾸미기 ─────
function drawFree(m) {
  const P = built.pieces;
  const free = P.filter((p) => !pieceRec(p.id).done && !pieceRec(p.id).owner);
  const S = R.students || {};
  const open = P.filter((p) => { const r = pieceRec(p.id); return !r.done && r.owner && r.owner !== sid && Object.keys(r.helpers || {}).length < MAX_HELPERS; });
  const reqs = open.filter((p) => pieceRec(p.id).request);
  const others = open.filter((p) => !pieceRec(p.id).request && !(S[pieceRec(p.id).owner] || {}).declined).sort((a, b) => progressOf(a) - progressOf(b)).slice(0, 5);
  const row = (p, req) => { const o = S[pieceRec(p.id).owner] || {}; return `<div class="friend${req ? ' req' : ''}"><span>${esc(o.name)} <span class="px">${p.label} · ${Math.round(progressOf(p) * 100)}%</span>${req ? ' <span style="color:var(--pink)">도와줘!</span>' : ''}</span><button class="btn small${req ? ' pink' : ' ghost'}" data-help="${p.id}">도와주러 가기</button></div>`; };
  let body = `<div class="pane"><h3>${justDone ? esc(justDone) + ' 완성!' : '무엇을 할까요?'}</h3>`;
  if (free.length) body += `<p>아직 아무도 안 맡은 조각이 ${free.length}개 있어요.</p><button class="btn" id="want" ${m.want ? 'disabled' : ''}>${m.want ? '조각 받는 중…' : '남은 조각 풀기'}</button>`;
  else body += `<p>조각은 다 나눠졌어요. 친구를 돕거나 장식을 만들어요.</p>`;
  body += reqs.map((p) => row(p, true)).join('') + others.map((p) => row(p, false)).join('');
  if (!free.length && !reqs.length && !others.length) body += '<p>지금은 도울 수 있는 친구가 없어요.</p>';
  body += `<button class="btn yellow" id="goDecor">꾸미기 퍼즐 하기</button>
    <div class="field"><span style="font-size:17px">다음 조각 난이도</span>${levelSeg(m.level || 'normal')}</div></div>`;
  app.innerHTML = '<div class="phone">' + head('잘했어!', '', -1) + body + '</div>';
  const w = document.getElementById('want');
  if (w) w.onclick = () => { w.disabled = true; net.update({ [`${base()}/students/${sid}/want`]: true }); };
  document.querySelectorAll('[data-help]').forEach((b) => (b.onclick = () => joinHelp(+b.dataset.help)));
  bindLevelSeg((v) => { myLevel = v; ss.set('cono-level', v); net.update({ [`${base()}/students/${sid}/level`]: v }); });
  document.getElementById('goDecor').onclick = () => { decor = newDecor(); net.update({ [`${base()}/students/${sid}/mode`]: 'decor' }); };
}
function joinHelp(id) {
  const r = pieceRec(id);
  if (r.done || !r.owner || Object.keys(r.helpers || {}).length >= MAX_HELPERS) { toast('이미 친구가 다 찼어요'); return; }
  const m = me();
  net.update({
    [`${base()}/pieces/p${id}/helpers/${sid}`]: myName,
    [`${base()}/students/${sid}/mode`]: 'help', [`${base()}/students/${sid}/helpTarget`]: id, [`${base()}/students/${sid}/helps`]: (m.helps || 0) + 1,
  });
  const o = (R.students || {})[r.owner];
  log(`→ ${o ? o.name : ''} 돕는 중`);
}

// ───── 친구 돕기 ─────
function drawHelp(m) {
  const p = built.pieces[m.helpTarget], r = pieceRec(p.id), o = (R.students || {})[r.owner] || {};
  const cool = hintCool > Date.now();
  app.innerHTML = '<div class="phone">' + head(`${esc(o.name)}의 <span class="px">${p.label}</span>`, 'blue', p.id) + `<div class="grid-host" id="gh"></div>
    <div class="msg ${cool ? '' : 'hi'}">${cool ? '짚어 줬어요. 조금 뒤에 또 짚을 수 있어요' : '헷갈려 보이는 줄의 숫자를 눌러 짚어 주세요'}</div>
    <p class="dim" style="margin:0;font-size:17px">칸은 직접 칠할 수 없어요. 친구 화면에 그 줄이 반짝여요.</p>
    <button class="btn ghost" id="stop">그만 돕기</button></div>`;
  let g = toGrid(cellsOf(p.id));
  gridCtl = buildGrid(document.getElementById('gh'), {
    sol: p.sol, editable: false, cls: 'watch', get: (rr, c) => g[rr][c], hl: currentHl,
    onHint: (type, i) => {
      if (hintCool > Date.now()) return;
      hintCool = Date.now() + 5000;
      net.set(`${base()}/hl/p${p.id}`, { type, i, by: sid, name: myName, at: Date.now() });
      toast(`${o.name}에게 ${i + 1}번째 ${type === 'row' ? '가로' : '세로'}줄을 짚어 줬어요`);
      schedule(); setTimeout(schedule, 5100);
    },
  });
  const refresh = gridCtl.refresh;
  gridCtl.refresh = () => { g = toGrid(cellsOf(p.id)); refresh(); };
  document.getElementById('stop').onclick = () => net.update({
    [`${base()}/students/${sid}/mode`]: 'free', [`${base()}/students/${sid}/helpTarget`]: null, [`${base()}/pieces/p${p.id}/helpers/${sid}`]: null,
  });
}

// ───── 꾸미기 퍼즐 ─────
function newDecor() { const sp = SPRITES[Math.floor(Math.random() * SPRITES.length)]; return { sp, g: sp.sol.map((r) => r.map(() => 0)), done: false }; }
function drawDecor() {
  if (!decor) decor = newDecor();
  const back = () => { decor = null; net.update({ [`${base()}/students/${sid}/mode`]: 'free' }); };
  const full = Object.keys(R.decor || {}).length >= built.slots.length;
  if (decor.done || full) {
    app.innerHTML = '<div class="phone">' + head('꾸미기', 'yellow', -1) + `<div class="pane"><h3>${full && !decor.done ? '장식 자리가 다 찼어요' : esc(decor.sp.name) + ' 장식을 붙였어요!'}</h3>
      <p>칠판 그림 둘레를 보세요.</p>${full ? '' : '<button class="btn yellow" id="more">하나 더 만들기</button>'}<button class="btn ghost" id="back">친구 돕기로 돌아가기</button></div></div>`;
    const mo = document.getElementById('more'); if (mo) mo.onclick = () => { decor = newDecor(); lastSig = ''; schedule(); };
    document.getElementById('back').onclick = back;
    return;
  }
  app.innerHTML = '<div class="phone">' + head('꾸미기 퍼즐', 'yellow', -1) + `<div class="grid-host" id="gh"></div>
    <div class="msg">다 풀면 이 그림이 칠판 장식이 돼요</div>${toolsHtml()}<button class="btn ghost" id="back">그만하기</button></div>`;
  const d = decor;
  gridCtl = buildGrid(document.getElementById('gh'), {
    sol: d.sp.sol, editable: true, cls: 'decor', tool: () => tool, get: (r, c) => d.g[r][c], set: (r, c, v) => { d.g[r][c] = v; },
    onChange: async () => {
      if (!isSolved(d.sp.sol, d.g) || d.done) return;
      d.done = true;
      net.push(`${base()}/decor`, { sprite: d.sp.i, by: myName, sid, at: Date.now() });
      net.update({ [`${base()}/students/${sid}/decor`]: ((me() || {}).decor || 0) + 1 });
      log(`${d.sp.name} 장식을 붙였어요`);
      lastSig = ''; schedule();
    },
  });
  bindTools();
  document.getElementById('back').onclick = back;
}
