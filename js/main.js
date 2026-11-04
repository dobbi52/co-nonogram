// 첫 화면과 화면 이동
//   index.html            첫 화면 (선생님 / 학생 고르기)
//   index.html?board=1234 전자칠판 (선생님)
//   index.html?room=1234  학생 화면
import * as net from './net.js?v=1104-1107';
import { openSetup, openBoard } from './board.js?v=1104-1107';
import { openJoin, openStudent } from './student.js?v=1104-1107';
import { app, brand, modeNotice, go, verLine } from './ui.js?v=1104-1107';

function home() {
  go(null);
  document.title = '협동 노노그램';
  app.innerHTML = `<div class="home">
    <div class="top">${brand('PIXEL NONOGRAM')}</div>
    <p class="dim" style="margin:0;font-size:19px;line-height:1.5">반 친구들이 큰 그림의 조각을 하나씩 맡아 노노그램을 풀어요. 조각이 모이면 우리 반 협동화가 완성돼요.</p>
    <div class="choices">
      <button class="choice" id="toTeacher"><b>선생님</b><span>전자칠판에서 방을 만들고, 학생들이 푸는 모습을 함께 봐요.</span></button>
      <button class="choice stu" id="toStudent"><b>학생</b><span>칠판에 나온 4자리 코드를 넣고 들어가요.</span></button>
    </div>
    ${modeNotice()}
    ${verLine()}
  </div>`;
  document.getElementById('toTeacher').onclick = openSetup;
  document.getElementById('toStudent').onclick = () => openJoin('');
}

async function start() {
  try { await net.connect(); }
  catch (e) {
    console.error(e);
    app.innerHTML = `<div class="sheet" style="border-color:var(--pink)"><h2 style="color:var(--pink)">서버에 연결하지 못했어요</h2><p></p><div class="row"><button class="btn" onclick="location.reload()">다시 시도</button></div></div>`;
    app.querySelector('p').textContent = net.explain(e);
    return;
  }
  // 서버와 끊기면 화면 위에 알린다 (잠깐 끊기는 것은 무시)
  let offTimer = 0;
  net.onConnection((ok) => {
    clearTimeout(offTimer);
    let el = document.getElementById('netWarn');
    if (ok) { if (el) el.hidden = true; return; }
    offTimer = setTimeout(() => {
      if (!el) { el = document.createElement('div'); el.id = 'netWarn'; el.className = 'netwarn'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
      el.textContent = '서버와 연결이 끊겼어요. 다시 연결하는 중… 오래 계속되면 인터넷을 확인해 주세요.';
      el.hidden = false;
    }, 4000);
  });
  const q = new URLSearchParams(location.search);
  const code = (q.get('board') || q.get('room') || '').replace(/\D/g, '').slice(0, 4);
  if (q.has('board') && code) openBoard(code);
  else if (q.has('room') && code) openStudent(code);
  else home();
}
start();
