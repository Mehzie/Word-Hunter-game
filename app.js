// Word Hunter — Single Player
// Rules implemented: 150s round, reshuffle every 25s, +2 letters at 90s, no repeats,
// scoring with bonuses, 60s break after round, reminders at 30s & 15s and 8s before extras.

const $ = (s)=>document.querySelector(s);
const logBox = $("#log");
const lettersBox = $("#letters");
const usedList = $("#usedList");
const scoreEl = $("#score");
const clockEl = $("#clock");
const phaseEl = $("#phase");
const wordInput = $("#wordInput");
const btnSubmit = $("#btnSubmit");
const btnStart = $("#btnStart");
const btnStop = $("#btnStop");
const btnNewSession = $("#btnNewSession");

let state = {
  phase: "waiting",
  letters: [],
  startedAt: 0,
  endAt: 0,
  nextShuffleAt: 0,
  addExtraAt: 0,
  extraAdded: false,
  lastReminder: "",
  score: 0,
  used: {},
  breakEndAt: 0,
  timer: null
};

function chip(letter){
  const el = document.createElement("div");
  el.className = "chip";
  el.textContent = letter;
  return el;
}

function render(){
  // phase & letters
  phaseEl.textContent = state.phase.toUpperCase();
  lettersBox.innerHTML = "";
  state.letters.forEach(l => lettersBox.appendChild(chip(l)));
  // used list
  usedList.innerHTML = "";
  Object.keys(state.used).sort().forEach(w=>{
    const li = document.createElement("li");
    li.textContent = w.toUpperCase();
    usedList.appendChild(li);
  });
  scoreEl.textContent = state.score;
  renderClock();
}

function renderClock(){
  let ms = 0;
  if(state.phase === "running"){ ms = Math.max(0, state.endAt - Date.now()); }
  else if(state.phase === "break"){ ms = Math.max(0, state.breakEndAt - Date.now()); }
  const secs = Math.floor(ms/1000);
  const mm = String(Math.floor(secs/60)).padStart(2,"0");
  const ss = String(secs%60).padStart(2,"0");
  clockEl.textContent = `${mm}:${ss}`;
}

function log(msg){
  const d = document.createElement("div");
  d.className = "msg";
  d.textContent = msg;
  logBox.appendChild(d);
  logBox.scrollTop = logBox.scrollHeight;
}

function generateLetters(count = 6){
  const vowels = "AEIOU";
  const cons = "BCDFGHJKLMNPQRSTVWXYZ";
  const pick = (str)=>str[Math.floor(Math.random()*str.length)];
  const arr = [pick(vowels), pick(vowels)];
  while(arr.length < count){
    const bucket = Math.random()<0.35? vowels : cons;
    arr.push(pick(bucket));
  }
  return arr.sort(()=>Math.random()-0.5);
}

function shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }

function startRound(){
  const base = 5 + Math.floor(Math.random()*4); // 5..8
  state.letters = generateLetters(base);
  const now = Date.now();
  state.phase = "running";
  state.startedAt = now;
  state.endAt = now + 150000;     // 150s
  state.nextShuffleAt = now + 25000;
  state.addExtraAt = now + 90000; // 90s
  state.extraAdded = false;
  state.lastReminder = "";
  state.used = {};
  btnStop.disabled = false;
  log("🔔 New round started!");
  tick();
  if(state.timer) clearInterval(state.timer);
  state.timer = setInterval(tick, 1000);
  render();
}

function stopRound(){
  if(state.phase !== "running") return;
  state.phase = "break";
  state.breakEndAt = Date.now() + 60000; // 60s
  btnStop.disabled = true;
  log("⏸ Round stopped. 60s break.");
  render();
}

function endRoundToBreak(){
  state.phase = "break";
  state.breakEndAt = Date.now() + 60000;
  btnStop.disabled = true;
  log("🏁 Time! 60s break for banter.");
  render();
}

function afterBreakIfNeeded(){
  if(state.phase === "break" && Date.now() >= state.breakEndAt){
    state.phase = "waiting";
    log("🟢 Break over. Press Start Round.");
    if(state.timer){ clearInterval(state.timer); state.timer = null; }
    render();
  }
}

function tick(){
  const now = Date.now();
  if(state.phase === "running"){
    // reshuffle
    if(now >= state.nextShuffleAt && now < state.endAt){
      state.letters = shuffle(state.letters);
      state.nextShuffleAt += 25000;
      log("🔁 Letters reshuffled.");
      render();
    }
    // add 2 letters at 90s
    if(!state.extraAdded && now >= state.addExtraAt && now < state.endAt){
      state.letters = [...state.letters, ...generateLetters(2)];
      state.extraAdded = true;
      log("➕ 2 extra letters added!");
      render();
    }
    // reminders
    const secsLeft = Math.max(0, Math.floor((state.endAt - now)/1000));
    if(secsLeft === 30 && state.lastReminder!=="30"){
      state.lastReminder="30"; log("⏳ 30 seconds left!");
    }
    if(secsLeft === 15 && state.lastReminder!=="15"){
      state.lastReminder="15"; log("⏳ 15 seconds left!");
    }
    const secsToExtra = Math.floor((state.addExtraAt - now)/1000);
    if(secsToExtra === 8 && state.lastReminder!=="extra8"){
      state.lastReminder="extra8"; log("🔔 8 seconds before 2 extra letters.");
    }
    // round end
    if(now >= state.endAt){ endRoundToBreak(); }
  } else if(state.phase === "break"){
    afterBreakIfNeeded();
  }
  renderClock();
}

function canMakeWord(word, letters){
  const counts = {};
  letters.forEach(c => counts[c] = (counts[c]||0)+1);
  for(const ch of word.toUpperCase()){
    if(!counts[ch]) return false;
    counts[ch]--;
  }
  return true;
}

async function isValidEnglishWord(w){
  try{
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`);
    if(!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data) && data.length>0 && !data.title;
  }catch(e){
    return false;
  }
}

async function submitWord(){
  const w = (wordInput.value||"").trim().toLowerCase();
  wordInput.value = "";
  if(!w) return;
  if(state.phase!=="running"){ log("⚠️ No active round."); return; }
  if(state.used[w]){ log("⚠️ Already used this round."); return; }
  if(!canMakeWord(w, state.letters)){ log("⚠️ Uses letters not available."); return; }
  const ok = await isValidEnglishWord(w);
  if(!ok){ log(`❌ "${w.toUpperCase()}" not in dictionary.`); return; }

  let pts = 2;
  if(w.length>=5){ const extra={5:1,6:2,7:3}; pts += extra[w.length] || 4; }
  state.used[w] = true;
  state.score += pts;
  log(`✅ +${pts} for "${w.toUpperCase()}"`);
  render();
}

btnSubmit.addEventListener("click", submitWord);
wordInput.addEventListener("keydown", (e)=>{ if(e.key==="Enter") submitWord(); });
btnStart.addEventListener("click", startRound);
btnStop.addEventListener("click", stopRound);
btnNewSession.addEventListener("click", ()=>{
  state.score = 0; state.used = {}; state.phase="waiting";
  if(state.timer){ clearInterval(state.timer); state.timer=null; }
  log("🔁 Session reset.");
  render();
});

render();
