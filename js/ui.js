// 화면 공용 도구
import * as net from './net.js?v=1106-1245';
import { VERSION } from './version.js?v=1106-1245';

// 첫 화면·방 만들기·들어가기 아래에 판 번호를 보여 준다 (최신 판인지 확인용)
export const verLine = () => `<p class="ver">판 ${VERSION}${net.mode === 'local' ? ' · 시험 모드' : ' · ' + net.transport()}</p>`;

export const app = document.getElementById('app');

export function brand(sub = 'CO-NONOGRAM') {
  return `<div class="brand"><div class="logo" aria-hidden="true">
    <i style="background:var(--green)"></i><i style="background:var(--cell)"></i><i style="background:var(--green)"></i>
    <i style="background:var(--cell)"></i><i style="background:var(--yellow)"></i><i style="background:var(--cell)"></i>
    <i style="background:var(--green)"></i><i style="background:var(--pink)"></i><i style="background:var(--green)"></i>
  </div><div><h1>협동 노노그램</h1><small>${sub}</small></div></div>`;
}

export function modeNotice() {
  if (net.mode !== 'local') return '';
  return `<div class="notice"><b>시험 모드</b> · 아직 서버(Firebase)를 연결하지 않아서, 이 컴퓨터의 같은 브라우저 창끼리만 연결돼요. 창을 여러 개 열어 칠판과 학생을 함께 시험해 볼 수 있어요. 교실에서 쓰려면 저장소의 SETUP.md를 따라 설정해 주세요.</div>`;
}

let toastTimer = 0;
export function toast(text) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = text; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 3500);
}

export function go(params) {
  const u = new URL(location.href);
  u.search = params ? '?' + new URLSearchParams(params) : '';
  history.replaceState(null, '', u);
}
export const joinUrl = (code) => { const u = new URL(location.href); u.search = '?room=' + code; u.hash = ''; return u.toString(); };

