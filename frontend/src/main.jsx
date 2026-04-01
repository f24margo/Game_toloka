import { Actor, HttpAgent } from "@dfinity/agent";

const canisterId = "gwa7n-6qaaa-aaaae-qfy5a-cai";
const agent = new HttpAgent({ host: "https://icp-api.io" });
const actor = Actor.createActor(({ IDL }) => IDL.Service({
  checkAnswer: IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
  getWord: IDL.Func([IDL.Text], [IDL.Text], []),
}), { agent, canisterId });

const words = {
  природа: ["ліс","вода","вітер","сонце","хмара","земля","річка","гора"],
  громада: ["місто","вулиця","сусід","парк","школа","ринок","дім","поле"],
  почуття: ["радість","смуток","любов","гнів","страх","надія","сором","гордість"],
  побут: ["стіл","вікно","хліб","ніж","ліжко","двері","котел","ключ"]
};

const rounds = ["синонім","антонім","асоціація"];
let topic = "природа", round = 0, score = 0, word = "", timer = 30, interval = null;

function randWord() {
  const list = words[topic];
  return list[Math.floor(Math.random() * list.length)];
}

function render() {
  document.getElementById("root").innerHTML = `
    <div style="max-width:480px;margin:0 auto;padding:2rem 1rem;font-family:sans-serif;">
      <h2 style="text-align:center;font-weight:600;margin-bottom:4px;">📖 Словесна еквілібристика</h2>
      <p style="text-align:center;color:#666;font-size:14px;margin-bottom:1.5rem;">Розвивай словниковий запас</p>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:1.5rem;">
        ${Object.keys(words).map(t => `
          <button onclick="setTopic('${t}')" style="padding:6px 16px;border-radius:20px;border:1px solid ${t===topic?'#1D9E75':'#ddd'};background:${t===topic?'#e1f5ee':'white'};color:${t===topic?'#1D9E75':'#555'};cursor:pointer;font-size:13px;">${t}</button>
        `).join('')}
      </div>
      <div style="background:white;border:1px solid #eee;border-radius:16px;padding:1.5rem;margin-bottom:1rem;">
        <div style="display:flex;justify-content:space-between;margin-bottom:1rem;font-size:13px;color:#888;">
          <span>Раунд <b style="color:#222">${round+1}/3</b></span>
          <span>Очки <b style="color:#222">${score}</b></span>
          <span id="timer-el">Час <b style="color:${timer<=10?'#e24b4a':'#222'}">${timer}с</b></span>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:1rem;">
          ${rounds.map((r,i) => `<div style="height:4px;flex:1;border-radius:2px;background:${i<round?'#1D9E75':i===round?'#5DCAA5':'#eee'};"></div>`).join('')}
        </div>
        <p style="text-align:center;color:#666;font-size:14px;">Введи <b style="color:#1D9E75">${rounds[round]}</b> до слова:</p>
        <p style="text-align:center;font-size:40px;font-weight:600;margin:0.5rem 0;">${word||'...'}</p>
        <div style="display:flex;gap:8px;margin-top:1rem;">
          <input id="ans" placeholder="Твоя відповідь..." onkeydown="if(event.key==='Enter')check()" style="flex:1;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:15px;outline:none;">
          <button onclick="check()" style="padding:10px 20px;background:#1D9E75;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;">OK</button>
        </div>
        <div id="fb" style="margin-top:12px;min-height:36px;text-align:center;font-size:14px;"></div>
      </div>
      <button onclick="skip()" style="width:100%;padding:8px;border:1px solid #eee;border-radius:8px;background:transparent;color:#999;cursor:pointer;font-size:13px;">Пропустити (-5 очок)</button>
    </div>
  `;
}

window.setTopic = (t) => { topic = t; render(); };

window.check = async () => {
  const ans = document.getElementById("ans").value.trim();
  if (!ans) return;
  clearInterval(interval);
  document.getElementById("fb").innerHTML = `<span style="color:#888">Перевіряю...</span>`;
  try {
    const result = await actor.checkAnswer(word, ans, rounds[round]);
    const ok = result.toUpperCase().includes("YES");
    const pts = ok ? 50 + Math.floor(timer/30*30) : 0;
    score += pts;
    document.getElementById("fb").innerHTML = ok
      ? `<span style="color:#1D9E75">+${pts} очок! Правильно!</span>`
      : `<span style="color:#e24b4a">Неправильно. Наступне слово!</span>`;
    setTimeout(nextRound, 1800);
  } catch(e) {
    document.getElementById("fb").innerHTML = `<span style="color:#888">Помилка</span>`;
    setTimeout(nextRound, 1500);
  }
};

window.skip = () => { clearInterval(interval); score = Math.max(0, score-5); nextRound(); };

function nextRound() {
  round++;
  if (round >= 3) { showResult(); return; }
  word = randWord(); timer = 30; render(); startTimer();
}

function startTimer() {
  clearInterval(interval);
  interval = setInterval(() => {
    timer--;
    const el = document.getElementById("timer-el");
    if (el) el.innerHTML = `Час <b style="color:${timer<=10?'#e24b4a':'#222'}">${timer}с</b>`;
    if (timer <= 0) { clearInterval(interval); nextRound(); }
  }, 1000);
}

function showResult() {
  const rank = score>=200?"Золотий майстер 🥇":score>=120?"Срібний гравець 🥈":"Бронзовий початківець 🥉";
  document.getElementById("root").innerHTML = `
    <div style="max-width:480px;margin:0 auto;padding:2rem 1rem;text-align:center;font-family:sans-serif;">
      <h2>Гру завершено!</h2>
      <div style="font-size:64px;font-weight:600;margin:1rem 0;">${score}</div>
      <p style="color:#666;">очок</p>
      <p style="font-size:18px;margin:1rem 0;">${rank}</p>
      <button onclick="restart()" style="padding:12px 32px;background:#1D9E75;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;margin-top:1rem;">Грати знову</button>
    </div>
  `;
}

window.restart = () => { round=0; score=0; timer=30; word=randWord(); render(); startTimer(); };

word = randWord();
render();
startTimer();