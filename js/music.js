// 전자칠판 배경음악. 파일 없이 Web Audio로 직접 연주하는 8비트 자작곡이다.
// 판이 시작되면 무작위 곡이 나오고, 곡이 끝나면 방금 곡을 뺀 나머지에서 다음 곡을 고른다.
// 새 곡은 TRACKS에 더하면 된다.
//   bars: [코드, '음 음 음 ...'] — 음 하나가 8분음표 한 칸. '-'는 앞 음을 잇고 '.'은 쉰다.
//   arp: 한 마디 안에서 코드의 몇 번째 음을 칠지, bass: 베이스를 칠 칸

const A4 = { arp: [0, 2, 1, 2, 0, 2, 1, 2], bass: [0, 4] };
const CALM = { arp: [0, null, 1, null, 2, null, 1, null], bass: [0, 4] };
const WALTZ = { arp: [null, null, 1, 2, 1, 2], bass: [0] };

function section(rows) { return rows.map(([chord, notes]) => ({ chord, notes: notes.trim().split(/\s+/) })); }

const TRACKS = [
  (() => {
    const a = section([
      ['C', 'E5 - G5 - E5 D5 C5 -'], ['G', 'D5 - - B4 G4 - . .'], ['Am', 'C5 - E5 - A5 - G5 E5'], ['F', 'F5 - E5 D5 C5 - . .'],
      ['C', 'E5 - G5 - C6 - B5 G5'], ['G', 'A5 - G5 - D5 - . .'], ['F', 'C5 D5 F5 - A5 - G5 F5'], ['C', 'E5 - - - C5 - . .'],
    ]);
    const b = section([
      ['Am', 'A4 - C5 - E5 - . .'], ['Em', 'G4 - B4 - E5 - . .'], ['F', 'A4 - C5 - F5 - E5 -'], ['C', 'G5 - E5 - C5 - . .'],
      ['F', 'F5 - A5 - C6 - A5 -'], ['C', 'G5 - E5 - G5 - . .'], ['Dm', 'F5 E5 D5 - A4 - D5 -'], ['G', 'D5 - E5 - F5 - G5 -'],
    ]);
    return { title: '숲길 산책', bpm: 84, lead: 'triangle', ...A4, bars: [...a, ...b, ...a] };
  })(),
  (() => {
    const a = section([
      ['Am', 'A4 - C5 - E5 - - -'], ['F', 'F5 - E5 - C5 - - -'], ['C', 'G4 - C5 - E5 - G5 -'], ['G', 'D5 - - - B4 - . .'],
      ['Am', 'E5 - A5 - G5 - E5 -'], ['Dm', 'F5 - D5 - A4 - . .'], ['F', 'C5 - A4 - C5 - E5 -'], ['E', 'B4 - G#4 - E4 - . .'],
    ]);
    const b = section([
      ['F', 'A4 - C5 - F5 - - -'], ['G', 'B4 - D5 - G5 - - -'], ['Em', 'G5 - E5 - B4 - . .'], ['Am', 'C5 - E5 - A5 - - -'],
      ['Dm', 'A5 - F5 - D5 - . .'], ['Am', 'C5 - E5 - A4 - . .'], ['F', 'A4 C5 F5 - E5 - D5 -'], ['E', 'E5 - - - B4 - - -'],
    ]);
    const end = section([['Am', 'A4 - C5 - A5 - - -']]);
    return { title: '달밤 별자리', bpm: 72, lead: 'triangle', ...CALM, bars: [...a, ...b, ...a, ...end] };
  })(),
  (() => {
    const a = section([
      ['F', 'A4 - C5 - F5 -'], ['C', 'G5 - E5 - C5 -'], ['Dm', 'F5 - A5 - F5 -'], ['Bb', 'D5 - - - . .'],
      ['F', 'C5 - F5 - A5 -'], ['C', 'G5 - E5 - G5 -'], ['Bb', 'F5 E5 D5 - Bb4 -'], ['C', 'C5 - - - . .'],
    ]);
    const b = section([
      ['Dm', 'A4 - D5 - F5 -'], ['Am', 'E5 - C5 - A4 -'], ['Bb', 'D5 - F5 - Bb5 -'], ['F', 'A5 - F5 - C5 -'],
      ['Gm', 'Bb4 - D5 - G5 -'], ['C', 'E5 - G5 - C6 -'], ['Bb', 'Bb5 - A5 - G5 -'], ['F', 'F5 - - - . .'],
    ]);
    const end = section([['F', 'F5 - - - - -']]);
    return { title: '종이배 왈츠', bpm: 112, lead: 'triangle', ...WALTZ, bars: [...a, ...b, ...a, ...end] };
  })(),
  (() => {
    const a = section([
      ['G', 'B4 D5 G5 - D5 - B4 -'], ['C', 'C5 E5 G5 - E5 - C5 -'], ['D', 'A4 D5 F#5 - D5 - A4 -'], ['G', 'B4 D5 G5 - B5 - . .'],
      ['Em', 'G5 F#5 E5 - B4 - E5 -'], ['C', 'G5 F#5 E5 - C5 - E5 -'], ['Am', 'C5 E5 A5 - G5 - E5 -'], ['D', 'F#5 - A5 - D5 - . .'],
    ]);
    const b = section([
      ['C', 'E5 - G5 - E5 - C5 -'], ['G', 'D5 - G5 - D5 - B4 -'], ['Am', 'C5 - E5 - A5 - E5 -'], ['Em', 'B4 - E5 - G5 - . .'],
      ['C', 'G5 A5 G5 E5 C5 - E5 -'], ['G', 'D5 E5 D5 B4 G4 - B4 -'], ['Am', 'C5 D5 E5 - A5 - G5 -'], ['D', 'F#5 - - - A5 - . .'],
    ]);
    const end = section([['G', 'G5 - D5 - G4 - . .']]);
    return { title: '운동장 소풍', bpm: 108, lead: 'square', ...A4, bars: [...a, ...b, ...a, ...end] };
  })(),
  (() => {
    const a = section([
      ['D', 'F#5 - A5 - D6 - - -'], ['A', 'C#6 - A5 - E5 - - -'], ['Bm', 'D5 - F#5 - B5 - A5 -'], ['F#m', 'A5 - F#5 - C#5 - . .'],
      ['G', 'B4 - D5 - G5 - F#5 -'], ['D', 'A5 - F#5 - D5 - . .'], ['Em', 'E5 - G5 - B5 - G5 -'], ['A', 'A5 - E5 - C#5 - . .'],
    ]);
    const b = section([
      ['Bm', 'F#5 - D5 - B4 - . .'], ['G', 'G5 - D5 - B4 - . .'], ['D', 'A5 - F#5 - D5 - . .'], ['A', 'E5 - C#5 - A4 - . .'],
      ['Bm', 'B4 - D5 - F#5 - B5 -'], ['G', 'A5 - G5 - D5 - . .'], ['Em', 'G5 - E5 - B4 - E5 -'], ['A', 'C#5 - E5 - A5 - - -'],
    ]);
    const end = section([['D', 'D5 - F#5 - D6 - - -']]);
    return { title: '눈 오는 마을', bpm: 76, lead: 'triangle', ...CALM, bars: [...a, ...b, ...a, ...end] };
  })(),
];

const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function midi(name) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(name);
  if (!m) throw new Error('음 이름 오류: ' + name);
  return 12 * (Number(m[3]) + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
export function chordRoot(chord) {
  const m = /^([A-G])([#b]?)(m?)$/.exec(chord);
  if (!m) throw new Error('코드 이름 오류: ' + chord);
  return { pc: SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0), minor: m[3] === 'm' };
}
const freq = (n) => 440 * Math.pow(2, (n - 69) / 12);

// ───── 소리 내기 ─────
const PREF_KEY = 'cono-music';
let ctx = null, master = null, songBus = null;
let enabled = (() => { try { return localStorage.getItem(PREF_KEY) !== 'off'; } catch (_) { return true; } })();
let want = 'off'; // off | play | hold
let song = null, ticker = 0, lastIndex = -1, restartAt = 0;

function ensure() {
  if (ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.8;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
  master.connect(lp); lp.connect(ctx.destination);
  return true;
}
function tone(bus, type, n, at, dur, vol) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq(n);
  const off = at + Math.max(0.05, dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.012);
  g.gain.exponentialRampToValueAtTime(vol * 0.55, at + Math.min(0.14, dur * 0.6));
  g.gain.setValueAtTime(vol * 0.55, Math.max(at + 0.015, off - 0.06));
  g.gain.exponentialRampToValueAtTime(0.0001, off);
  o.connect(g); g.connect(bus);
  o.start(at); o.stop(off + 0.02);
}
function pickIndex() {
  let i;
  do { i = Math.floor(Math.random() * TRACKS.length); } while (TRACKS.length > 1 && i === lastIndex);
  lastIndex = i;
  return i;
}
function beginSong(at) {
  const t = TRACKS[pickIndex()];
  if (songBus) { const old = songBus; setTimeout(() => { try { old.disconnect(); } catch (_) {} }, 3000); }
  songBus = ctx.createGain(); songBus.connect(master);
  song = { t, bar: 0, at, step: 60 / t.bpm / 2 };
}
function holdLength(notes, i) { let n = 1; while (notes[i + n] === '-') n += 1; return n; }
function scheduleBar() {
  const { t, step } = song, bar = t.bars[song.bar], at = song.at;
  const { pc, minor } = chordRoot(bar.chord);
  const root = 48 + pc, tones = [root, root + (minor ? 3 : 4), root + 7];
  bar.notes.forEach((nm, i) => {
    if (nm === '-' || nm === '.') return;
    const leadVol = t.lead === 'square' ? 0.07 : 0.17;
    tone(songBus, t.lead, midi(nm), at + i * step, holdLength(bar.notes, i) * step * 0.95, leadVol);
  });
  t.bass.forEach((i) => tone(songBus, 'triangle', root - 12, at + i * step, step * 1.7, 0.16));
  t.arp.forEach((k, i) => {
    if (k != null && i < bar.notes.length) tone(songBus, 'square', tones[k] + 12, at + i * step, step * 0.7, 0.018);
  });
  song.at = at + bar.notes.length * step;
  song.bar += 1;
}
function tick() {
  if (!ctx || want !== 'play' || !enabled || ctx.state !== 'running') return;
  const horizon = ctx.currentTime + 1.5;
  if (!song) beginSong(ctx.currentTime + 0.15);
  while (song && song.at < horizon) {
    if (song.bar >= song.t.bars.length) {
      if (!restartAt) restartAt = song.at + 2; // 곡 사이 2초 쉼
      if (ctx.currentTime + 1.5 < restartAt) return;
      const at = restartAt; restartAt = 0;
      beginSong(at);
    }
    scheduleBar();
  }
}
function apply() {
  if (!ctx) return;
  if (want === 'play' && enabled) {
    if (ctx.state !== 'running') ctx.resume().then(tick).catch(() => {});
    if (!ticker) ticker = setInterval(tick, 250);
    tick();
  } else if (ctx.state === 'running' && !fanfareUntil) {
    ctx.suspend().catch(() => {});
  }
}
// 브라우저는 사용자가 화면을 누르기 전에는 소리를 막는다. 칠판을 새로고침한 뒤에도 첫 터치에 이어서 나온다.
function unlockOnGesture() {
  const go = () => { unlock(); apply(); };
  window.addEventListener('pointerdown', go, { capture: true });
  window.addEventListener('keydown', go, { capture: true });
}
let armed = false, fanfareUntil = 0;

/** 시작 버튼처럼 사용자가 누른 순간에 불러 소리를 풀어 둔다 */
export function unlock() {
  if (!ensure()) return;
  if (ctx.state !== 'running' && (want === 'play' && enabled || fanfareUntil)) ctx.resume().catch(() => {});
}
/** 'play' 연주, 'hold' 잠깐 멈춤(이어서 다시 연주), 'off' 끝내기 */
export function setState(next) {
  if (next === want) return;
  want = next;
  if (next !== 'off' && !armed) { armed = true; unlockOnGesture(); }
  if (next === 'off') {
    clearInterval(ticker); ticker = 0;
    song = null; restartAt = 0;
    if (songBus) { const b = songBus; songBus = null; try { b.gain.setTargetAtTime(0, ctx.currentTime, 0.15); } catch (_) {} setTimeout(() => { try { b.disconnect(); } catch (_) {} }, 1200); }
  }
  if (!ensure()) return;
  apply();
}
export const isEnabled = () => enabled;
export function toggle() {
  enabled = !enabled;
  try { localStorage.setItem(PREF_KEY, enabled ? 'on' : 'off'); } catch (_) {}
  if (ensure()) { if (enabled) unlock(); apply(); }
  return enabled;
}
/** 그림이 완성됐을 때 한 번 나오는 축하 음악 */
export function fanfare() {
  if (!enabled || !ensure()) return;
  const notes = [['G4', 0, 1], ['C5', 1, 1], ['E5', 2, 1], ['G5', 3, 2], ['E5', 5, 1], ['G5', 6, 1], ['C6', 7, 5]];
  const step = 0.13, play = () => {
    const at = ctx.currentTime + 0.05, bus = ctx.createGain();
    bus.connect(master);
    notes.forEach(([n, s, len]) => {
      tone(bus, 'square', midi(n), at + s * step, len * step * 0.95, 0.07);
      tone(bus, 'triangle', midi(n) - 12, at + s * step, len * step * 0.95, 0.12);
    });
    fanfareUntil = Date.now() + 2200;
    setTimeout(() => { fanfareUntil = 0; apply(); }, 2300);
  };
  fanfareUntil = Date.now() + 2200;
  if (ctx.state === 'running') play(); else ctx.resume().then(play).catch(() => { fanfareUntil = 0; });
}

