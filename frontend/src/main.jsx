import { Actor, HttpAgent } from "@dfinity/agent";

const canisterId = "gwa7n-6qaaa-aaaae-qfy5a-cai";
const agent = new HttpAgent({ host: "https://icp-api.io" });
const actor = Actor.createActor(({ IDL }) => IDL.Service({
  checkAnswer: IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
  getWord: IDL.Func([IDL.Text], [IDL.Text], []),
}), { agent, canisterId });

const words = {
  priroda: ["ліс","вода","вітер","сонце","хмара","земля","річка","гора","трава","небо","море","гай","луг","поле","роса","туман","сніг","лід","вогонь","камінь"],
  gromada: ["місто","вулиця","сусід","парк","школа","ринок","дім","поле","завод","церква","площа","міст","дорога","сад","криниця","клуб","рада","закон"],
  pochuttia: ["радість","смуток","любов","гнів","страх","надія","сором","гордість","заздрість","жалість","тривога","спокій","щастя","біль","туга"],
  pobut: ["стіл","вікно","хліб","ніж","ліжко","двері","котел","ключ","миска","ложка","піч","хата","паркан","свічка","рушник"]
};

const topicNames = { priroda: "природа", gromada: "громада", pochuttia: "почуття", pobut: "побут" };
const topicIcons = { priroda: "🌿", gromada: "🏘️", pochuttia: "💚", pobut: "🏠" };

const LEVELS = [
  { name: "Новачок", min: 0, icon: "🌱" },
  { name: "Учень", min: 100, icon: "📚" },
  { name: "Знавець", min: 250, icon: "🔤" },
  { name: "Майстер слова", min: 500, icon: "✍️" },
  { name: "Поет", min: 750, icon: "🎭" },
  { name: "Мудрець", min: 1000, icon: "🦉" },
  { name: "Талант", min: 1500, icon: "⭐" }
];

function getLevel(s) { return [...LEVELS].reverse().find(l => s >= l.min) || LEVELS[0]; }
function getNextLevel(s) { return LEVELS.find(l => l.min > s); }

const rounds = ["синонім","антонім","асоціація"];
let topic = "priroda", round = 0, score = 0, word = "", timer = 30, interval = null;
let totalScore = parseInt(localStorage.getItem("totalScore") || "0");

function randWord() {
  const list = words[topic];
  return list[Math.floor(Math.random() * list.length)];
}

function renderStart() {
  clearInterval(interval);
  const level = getLevel(totalScore);
  const next = getNextLevel(totalScore);
  const progress = next ? Math.floor(((totalScore - level.min) / (next.min - level.min)) * 100) : 100;
  document.getElementById("root").innerHTML = `
    <div style="max-width:480px;margin:0 auto;padding:2rem 1rem;font-family:sans-serif;">
      <div style="text-align:center;margin-bottom:1.5rem;">
        <div style="font-size:32px;">${level.icon}</div>
        <h2 style="font-weight:600;font-size:22px;margin:4px 0;">Словесна еквілібристика</h2>
        <p style="color:#666;font-size:13px;">Розвивай словниковий запас</p>
      </div>
      <div style="background:#f8f8f8;border-radius:12px;padding:1rem;margin-bottom:1.5rem;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-weight:500;">${level.icon} ${level.name}</span>
          <span style="font-size:13px;color:#888;">${totalScore} очок</span>
        </div>
        <div style="background:#e0e0e0;border-radius:4px;height:6px;">
          <div style="background:#1D9E75;border-radius:4px;height:6px;width:${progress}%;"></div>
        </div>
        ${next ? `<div style="font-size:11px;color:#888;margin-top:4px;text-align:right;">До "${next.name}": ${next.min - totalScore} очок</div>` : '<div style="font-size:11px;color:#1D9E75;margin-top:4px;text-align:right;">Максимальний рівень!</div>'}
      </div>
      <p style="font-size:14px;color:#555;margin-bottom:12px;text-align:center;">Вибери тему:</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:1.5rem;">
        ${Object.keys(words).map(t => `
          <button onclick="setTopic('${t}')" style="padding:12px;border-radius:10px;border:2px solid ${t===topic?'#1D9E75':'#eee'};background:${t===topic?'#e1f5ee':'white'};color:${t===topic?'#1D9E75':'#555'};cursor:pointer;font-size:14px;font-weight:${t===topic?600:400};">
            ${topicIcons[t]} ${topicNames[t]}
          </button>
        `).join('')}
      </div>
      <div style="background:#f0faf5;border-radius:10px;padding:12px;margin-bottom:1.5rem;font-size:13px;color:#555;">
        <b style="color:#1D9E75;">3 раунди:</b> синонім → антонім → асоціація<br>
        <b style="color:#1D9E75;">💡 Help:</b> підказка від AI (-20 очок)
      </div>
      <button onclick="startGame()" style="width:100%;padding:14px;background:#1D9E75;color:white;border:none;border-radius:10px;cursor:pointer;font-size:16px;font-weight:500;">Почати гру →</button>
      <div style="margin-top:1.5rem;">
        <p style="font-size:12px;color:#aaa;text-align:center;margin-bottom:8px;">Рівні:</p>
        <div style="display:flex;justify-content:space-between;">
          ${LEVELS.map(l => `<div style="text-align:center;flex:1;opacity:${totalScore>=l.min?1:0.3};" title="${l.name}: ${l.min}+"><div style="font-size:18px;">${l.icon}</div><div style="font-size:9px;color:#888;">${l.min}</div></div>`).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderGame() {
  document.getElementById("root").innerHTML = `
    <div style="max-width:480px;margin:0 auto;padding:2rem 1rem;font-family:sans-serif;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <button onclick="renderStart()" style="border:none;background:none;color:#888;cursor:pointer;font-size:13px;">← Вийти</button>
        <span style="font-size:13px;color:#888;">Загалом: <b style="color:#1D9E75;">${totalScore}</b></span>
      </div>
      <div style="background:white;border:1px solid #eee;border-radius:16px;padding:1.5rem;margin-bottom:1rem;">
        <div style="display:flex;justify-content:space-between;margin-bottom:1rem;font-size:13px;color:#888;">
          <span>Раунд <b style="color:#222;">${round+1}/3</b></span>
          <span>Очки <b style="color:#222;">${score}</b></span>
          <span id="timer-el">Час <b style="color:${timer<=10?'#e24b4a':'#222'}">${timer}с</b></span>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:1rem;">
          ${rounds.map((r,i) => `<div style="height:4px;flex:1;border-radius:2px;background:${i<round?'#1D9E75':i===round?'#5DCAA5':'#eee'};"></div>`).join('')}
        </div>
        <p style="text-align:center;color:#666;font-size:14px;">Введи <b style="color:#1D9E75;">${rounds[round]}</b> до слова:</p>
        <p style="text-align:center;font-size:40px;font-weight:600;margin:0.5rem 0;">${word}</p>
        <div style="display:flex;gap:8px;margin-top:1rem;">
          <input id="ans" placeholder="Твоя відповідь..." onkeydown="if(event.key==='Enter')check()" style="flex:1;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:15px;outline:none;">
          <button onclick="check()" style="padding:10px 20px;background:#1D9E75;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;">OK</button>
        </div>
        <div id="fb" style="margin-top:12px;min-height:36px;text-align:center;font-size:14px;"></div>
      </div>
      <div style="display:flex;gap:8px;">
        <button onclick="getHint()" id="hint-btn" style="flex:1;padding:8px;border:1px solid #1D9E75;border-radius:8px;background:transparent;color:#1D9E75;cursor:pointer;font-size:13px;">💡 Підказка (-20)</button>
        <button onclick="skip()" style="flex:1;padding:8px;border:1px solid #eee;border-radius:8px;background:transparent;color:#999;cursor:pointer;font-size:13px;">Пропустити (-5)</button>
      </div>
    </div>
  `;
  document.getElementById("ans").focus();
}

window.setTopic = t => { topic = t; renderStart(); };
window.startGame = () => { round=0; score=0; timer=30; word=randWord(); renderGame(); startTimer(); };
window.renderStart = renderStart;

window.getHint = async () => {
  clearInterval(interval);
  score = Math.max(0, score - 20);
  const btn = document.getElementById("hint-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Завантажую..."; }
  document.getElementById("fb").innerHTML = `<span style="color:#888">AI думає...</span>`;
  try {
    const result = await actor.checkAnswer(word, "підказка", rounds[round]);
    document.getElementById("fb").innerHTML = `<span style="color:#185FA5">💡 ${result}</span>`;
  } catch(e) {
    const hints = { "синонім":"Слово зі схожим значенням","антонім":"Слово з протилежним значенням","асоціація":"Що спадає на думку?" };
    document.getElementById("fb").innerHTML = `<span style="color:#185FA5">💡 ${hints[rounds[round]]}</span>`;
  }
  startTimer();
};

window.check = async () => {
  const ans = document.getElementById("ans").value.trim();
  if (!ans) return;
  clearInterval(interval);
  document.getElementById("ans").disabled = true;
  document.getElementById("fb").innerHTML = `<span style="color:#888">Перевіряю...</span>`;
  try {
    const result = await actor.checkAnswer(word, ans, rounds[round]);
    const ok = result.toUpperCase().includes("YES");
    const pts = ok ? 50 + Math.floor(timer/30*30) : 0;
    score += pts;
    document.getElementById("fb").innerHTML = ok
      ? `<span style="color:#1D9E75">+${pts} очок! Правильно!</span>`
      : `<span style="color:#e24b4a">Неправильно.</span>`;
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
  word = randWord(); timer = 30; renderGame(); startTimer();
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
  clearInterval(interval);
  totalScore += score;
  localStorage.setItem("totalScore", totalScore);
  const level = getLevel(totalScore);
  document.getElementById("root").innerHTML = `
    <div style="max-width:480px;margin:0 auto;padding:2rem 1rem;text-align:center;font-family:sans-serif;">
      <div style="font-size:48px;margin-bottom:8px;">${level.icon}</div>
      <h2>Гру завершено!</h2>
      <div style="font-size:56px;font-weight:600;color:#1D9E75;margin:0.5rem 0;">+${score}</div>
      <p style="color:#888;font-size:14px;">очок за цю гру</p>
      <div style="background:#f0faf5;border-radius:12px;padding:1rem;margin:1rem 0;">
        <div style="font-size:16px;font-weight:500;">${level.name}</div>
        <div style="font-size:28px;font-weight:600;color:#1D9E75;">${totalScore}</div>
        <div style="font-size:12px;color:#888;">загальний рахунок</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:1rem;">
        <button onclick="renderStart()" style="flex:1;padding:12px;border:1px solid #ddd;border-radius:8px;background:white;cursor:pointer;">Змінити тему</button>
        <button onclick="startGame()" style="flex:1;padding:12px;background:#1D9E75;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:500;">Грати знову</button>
      </div>
    </div>
  `;
}

renderStart();
