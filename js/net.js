// 서버 연결. Firebase Realtime Database가 설정되어 있으면 그것을 쓰고,
// 없으면 같은 브라우저의 창끼리 localStorage + BroadcastChannel로 연결하는 시험 모드로 돈다.
// 두 방식 모두 같은 함수(set, update, push, on, ...)로 쓴다. 경로는 'rooms/1234/pieces/3' 처럼 쓴다.
import { firebaseConfig } from './firebase-config.js';

const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
let impl = null;
export let mode = 'local';
let myUid = null;

export async function connect() {
  if (impl) return mode;
  if (firebaseConfig) {
    try {
      impl = await firebaseImpl();
      mode = 'firebase';
      return mode;
    } catch (e) {
      console.error('Firebase 연결 실패, 시험 모드로 전환', e);
    }
  }
  impl = localImpl();
  mode = 'local';
  return mode;
}

export const uid = () => myUid;
export const set = (p, v) => impl.set(p, v);
export const update = (patch) => impl.update(patch); // { 'a/b': 1, 'a/c': null } 처럼 여러 경로를 한 번에
export const get = (p) => impl.get(p);
export const on = (p, cb) => impl.on(p, cb); // 값이 바뀔 때마다 cb(value). 끊는 함수를 돌려준다
export const push = (p, v) => impl.push(p, v);
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
  const d = db.getDatabase(a);
  const r = (p) => db.ref(d, p);
  return {
    set: (p, v) => db.set(r(p), v),
    update: (patch) => db.update(db.ref(d), patch),
    get: async (p) => (await db.get(r(p))).val(),
    on: (p, cb) => db.onValue(r(p), (s) => cb(s.val())),
    push: (p, v) => db.push(r(p), v).key,
    onDisconnect: (patch) => db.onDisconnect(db.ref(d)).update(patch),
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
