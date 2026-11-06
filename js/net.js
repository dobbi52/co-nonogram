// 서버 연결. Firebase Realtime Database가 설정되어 있으면 그것을 쓰고,
// 없으면 같은 브라우저의 창끼리 localStorage + BroadcastChannel로 연결하는 시험 모드로 돈다.
// 두 방식 모두 같은 함수(set, update, push, on, ...)로 쓴다. 경로는 'rooms/1234/pieces/3' 처럼 쓴다.
import { firebaseConfig } from './firebase-config.js?v=1106-1245';

const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
let impl = null;

// 연결 실패 이유를 사람이 읽을 수 있게
export function explain(e) {
  const c = (e && e.code) || '';
  if (c === 'auth/operation-not-allowed' || c === 'auth/admin-restricted-operation') return 'Firebase에서 익명 로그인이 꺼져 있어요. Authentication → 로그인 방법 → 익명을 켜 주세요.';
  if (c === 'auth/unauthorized-domain') return `이 주소(${location.hostname})가 승인된 도메인에 없어요. Authentication → 설정 → 승인된 도메인에 추가해 주세요.`;
  if (c === 'auth/configuration-not-found') return 'Firebase에서 Authentication을 아직 시작하지 않았어요. Authentication → 시작하기를 눌러 주세요.';
  if (c === 'timeout') return '서버(Firebase 데이터베이스)에서 답이 오지 않아요. 학교 인터넷이 Firebase를 막고 있거나 연결이 불안정할 수 있어요. 다른 인터넷(예: 휴대폰 핫스폿)으로도 해 보세요.';
  if (/permission[_ ]denied/i.test(c + ' ' + ((e && e.message) || ''))) return '데이터베이스 규칙이 막고 있어요. Firebase → Realtime Database → 규칙 탭에 SETUP.md의 규칙을 붙여 넣고 게시해 주세요.';
  if (c === 'auth/network-request-failed' || /network|fetch/i.test(String(e))) return '인터넷에 연결되어 있지 않거나 Firebase에 닿지 않아요. 연결을 확인하고 새로고침해 주세요.';
  return '서버에 연결하지 못했어요. (' + (c || (e && e.message) || e) + ')';
}
export let mode = 'local';

// ───── 연결 방식 고르기 ─────
// 기본은 웹소켓. 7초 안에 연결이 안 되거나 1분 안에 3번 넘게 끊기면 이 기기는 7일 동안 우회 방식을 쓰고 다시 연다.
const LP_KEY = 'cono-longpoll-until';
let longPoll = (() => { try { return Number(localStorage.getItem(LP_KEY) || 0) > Date.now(); } catch (_) { return false; } })();
export const transport = () => (mode !== 'firebase' ? '' : longPoll ? '우회 연결' : '기본 연결');
function switchToLongPoll() {
  try {
    localStorage.setItem(LP_KEY, String(Date.now() + 7 * 24 * 3600e3));
    if (Number(localStorage.getItem(LP_KEY)) > Date.now()) { location.reload(); return; }
  } catch (_) {}
  // 기억할 수 없는 기기(사생활 보호 창 등)는 주소에 표시해서 다시 연다
  const u = new URL(location.href); u.searchParams.set('lp', '1'); location.replace(u.toString());
}
if (new URLSearchParams(location.search).get('lp') === '1') longPoll = true;
function watchConnection(db, d) {
  let everConnected = false; const drops = [];
  const first = setTimeout(() => { if (!everConnected) switchToLongPoll(); }, 7000);
  db.onValue(db.ref(d, '.info/connected'), (s) => {
    if (s.val()) { everConnected = true; clearTimeout(first); return; }
    if (!everConnected) return;
    const now = Date.now(); drops.push(now);
    while (drops.length && now - drops[0] > 60000) drops.shift();
    if (drops.length >= 3) switchToLongPoll();
  });
}
let myUid = null;

export async function connect() {
  if (impl) return mode;
  if (firebaseConfig) {
    // 설정이 있는데 연결이 안 되면 시험 모드로 넘어가지 않고 이유를 알려 준다
    // (조용히 넘어가면 칠판과 학생이 서로 다른 곳에 연결돼 "그런 방이 없어요"가 뜬다)
    impl = await firebaseImpl();
    mode = 'firebase';
    return mode;
  }
  impl = localImpl();
  mode = 'local';
  return mode;
}

// 서버가 답하지 않으면 끝없이 기다리지 않고 실패로 알린다
const LIMIT_MS = 12000;
function limit(promise) {
  let t;
  const timeout = new Promise((_, rej) => { t = setTimeout(() => { const e = new Error('timeout'); e.code = 'timeout'; rej(e); }, LIMIT_MS); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}
export const uid = () => myUid;
export const set = (p, v) => limit(impl.set(p, v));
export const update = (patch) => limit(impl.update(patch)); // { 'a/b': 1, 'a/c': null } 처럼 여러 경로를 한 번에
export const get = (p) => limit(impl.get(p));
// 서버와 이어져 있는지 알려 준다 (시험 모드는 늘 이어진 것으로)
export const onConnection = (cb) => (impl.onConnection ? impl.onConnection(cb) : cb(true));
export const on = (p, cb) => impl.on(p, cb); // 값이 바뀔 때마다 cb(value). 끊는 함수를 돌려준다
export const push = (p, v) => impl.push(p, v);
// 여러 사람이 같은 값을 고칠 때 서로 덮어쓰지 않게 최신 값 위에 바꾼다. fn(지금 값) → 새 값
export const transaction = (p, fn) => limit(impl.transaction(p, fn));
export const onDisconnect = (patch) => impl.onDisconnect(patch);

// ───── Firebase ─────
async function firebaseImpl() {
  const app = await import(FB + 'firebase-app.js');
  const db = await import(FB + 'firebase-database.js');
  const auth = await import(FB + 'firebase-auth.js');
  const a = app.initializeApp(firebaseConfig);
  const au = auth.getAuth(a);
  const cred = await auth.signInAnonymously(au);
  myUid = cred.user.uid;
  // 학교 망처럼 웹소켓을 막거나 끊는 곳에서는 우회 방식(롱 폴링)으로 연결한다
  if (longPoll && typeof db.forceLongPolling === 'function') db.forceLongPolling();
  const d = db.getDatabase(a);
  const r = (p) => db.ref(d, p);
  if (!longPoll) watchConnection(db, d);
  return {
    set: (p, v) => db.set(r(p), v),
    transaction: (p, fn) => db.runTransaction(r(p), fn),
    update: (patch) => db.update(db.ref(d), patch),
    get: async (p) => (await db.get(r(p))).val(),
    on: (p, cb) => db.onValue(r(p), (s) => cb(s.val())),
    push: (p, v) => db.push(r(p), v).key,
    onDisconnect: (patch) => db.onDisconnect(db.ref(d)).update(patch),
    onConnection: (cb) => db.onValue(db.ref(d, '.info/connected'), (s) => cb(!!s.val())),
  };
}

// ───── 시험 모드 ─────
function localImpl() {
  const KEY = 'co-nonogram-db';
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel(KEY) : null;
  let mem = {};
  const load = () => {
    try { mem = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_) { mem = {}; }
  };
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (_) {}
    if (bc) bc.postMessage(1);
  };
  load();
  myUid = (() => {
    try {
      let u = sessionStorage.getItem(KEY + '-uid');
      if (!u) { u = 'L' + Math.random().toString(36).slice(2, 10); sessionStorage.setItem(KEY + '-uid', u); }
      return u;
    } catch (_) { return 'L' + Math.random().toString(36).slice(2, 10); }
  })();
  const parts = (p) => p.split('/').filter(Boolean);
  const read = (p) => parts(p).reduce((o, k) => (o == null ? undefined : o[k]), mem);
  const write = (p, v) => {
    const ks = parts(p);
    let o = mem;
    for (let i = 0; i < ks.length - 1; i++) {
      if (o[ks[i]] == null || typeof o[ks[i]] !== 'object') o[ks[i]] = {};
      o = o[ks[i]];
    }
    const last = ks[ks.length - 1];
    if (v == null) delete o[last];
    else o[last] = JSON.parse(JSON.stringify(v));
  };
  const listeners = new Set();
  const notify = () => {
    for (const l of listeners) {
      const v = read(l.p);
      const s = JSON.stringify(v ?? null);
      if (s !== l.last) { l.last = s; l.cb(v == null ? null : JSON.parse(s)); }
    }
  };
  const remote = () => { load(); notify(); };
  if (bc) bc.onmessage = remote;
  window.addEventListener('storage', (e) => { if (e.key === KEY) remote(); });
  return {
    set: async (p, v) => { write(p, v); save(); notify(); },
    transaction: async (p, fn) => { load(); write(p, fn(read(p) ?? null)); save(); notify(); },
    update: async (patch) => { for (const [p, v] of Object.entries(patch)) write(p, v); save(); notify(); },
    get: async (p) => { load(); const v = read(p); return v == null ? null : JSON.parse(JSON.stringify(v)); },
    on: (p, cb) => {
      const l = { p, cb, last: undefined };
      listeners.add(l);
      setTimeout(() => { const v = read(p); l.last = JSON.stringify(v ?? null); cb(v == null ? null : JSON.parse(l.last)); }, 0);
      return () => listeners.delete(l);
    },
    push: (p, v) => {
      const k = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      write(p + '/' + k, v); save(); notify();
      return k;
    },
    onDisconnect: async () => {},
  };
}
