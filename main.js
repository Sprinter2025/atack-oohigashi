const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const elScore = document.getElementById("score");
const elTime = document.getElementById("time");
const elBest = document.getElementById("best");
const overlay = document.getElementById("overlay");
const titleEl = document.getElementById("title");
const resultEl = document.getElementById("result");
const btn = document.getElementById("btn");

const BEST_KEY = "facebop_best_v1";

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function rand(a, b) { return a + Math.random() * (b - a); }

function fitCanvas() {
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const w = Math.floor(window.innerWidth * dpr);
  const h = Math.floor(window.innerHeight * dpr);
  canvas.width = w;
  canvas.height = h;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.scale(dpr, dpr);
}
window.addEventListener("resize", fitCanvas);
fitCanvas();

const assets = {
  face: new Image(),
  faceHit: new Image(),
  hitSnd: null,
  bgm: null,
};

assets.face.src = "./assets/face.png";
assets.faceHit.src = "./assets/face_hit.png"; // 無ければ face.png をコピーして置いてOK

function safeAudio(src, loop=false, volume=0.6) {
  const a = new Audio(src);
  a.loop = loop;
  a.volume = volume;
  a.preload = "auto";
  return a;
}

// スマホは「ユーザー操作後に音解禁」なので、start時に生成
function initAudio() {
  if (!assets.hitSnd) assets.hitSnd = safeAudio("./assets/hit.mp3", false, 0.7);
  if (!assets.bgm) assets.bgm = safeAudio("./assets/bgm.mp3", true, 0.35);
}

function playHit() {
  if (!assets.hitSnd) return;
  assets.hitSnd.currentTime = 0;
  assets.hitSnd.play().catch(()=>{});
}

function startBGM() {
  if (!assets.bgm) return;
  assets.bgm.play().catch(()=>{});
}

let best = Number(localStorage.getItem(BEST_KEY) || 0);
elBest.textContent = best.toString();

const state = {
  running: false,
  score: 0,
  timeLeft: 30.0,
  lastT: 0,
  particles: [],
  shake: 0,
  face: {
    x: 120,
    y: 220,
    r: 64,        // 表示半径
    vx: 260,      // px/s
    vy: 210,
    hitTimer: 0,  // 変顔表示時間
    scalePop: 0,  // ポップ演出
  }
};

function resetGame() {
  state.score = 0;
  state.timeLeft = 30.0;
  state.particles = [];
  state.shake = 0;

  const w = window.innerWidth;
  const h = window.innerHeight;
  state.face.r = Math.min(w, h) * 0.10; // 画面サイズに応じて
  state.face.x = rand(state.face.r, w - state.face.r);
  state.face.y = rand(state.face.r + 60, h - state.face.r); // HUDぶん少し下
  state.face.vx = rand(220, 360) * (Math.random() < 0.5 ? -1 : 1);
  state.face.vy = rand(180, 320) * (Math.random() < 0.5 ? -1 : 1);
  state.face.hitTimer = 0;
  state.face.scalePop = 0;

  elScore.textContent = "0";
  elTime.textContent = state.timeLeft.toFixed(1);
}

function spawnParticles(x, y, n=16) {
  for (let i=0;i<n;i++){
    const a = rand(0, Math.PI*2);
    const sp = rand(120, 520);
    state.particles.push({
      x, y,
      vx: Math.cos(a)*sp,
      vy: Math.sin(a)*sp,
      life: rand(0.25, 0.55),
      t: 0
    });
  }
}

function pointInFace(px, py) {
  const dx = px - state.face.x;
  const dy = py - state.face.y;
  return (dx*dx + dy*dy) <= (state.face.r * state.face.r);
}

function endGame() {
  state.running = false;
  overlay.classList.remove("hidden");

  if (state.score > best) {
    best = state.score;
    localStorage.setItem(BEST_KEY, String(best));
    elBest.textContent = String(best);
    titleEl.textContent = "NEW BEST!";
  } else {
    titleEl.textContent = "RESULT";
  }
  resultEl.textContent = `Score: ${state.score} / Best: ${best}`;
  btn.textContent = "RETRY";
}

function startGame() {
  initAudio();
  startBGM();

  resetGame();
  state.running = true;
  overlay.classList.add("hidden");
  state.lastT = performance.now();
  requestAnimationFrame(loop);
}

btn.addEventListener("click", startGame);

function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left);
  const y = (e.clientY - rect.top);
  return {x, y};
}

canvas.addEventListener("pointerdown", (e) => {
  if (!state.running) return;

  const {x, y} = getPointerPos(e);
  if (pointInFace(x, y)) {
    state.score += 1;
    elScore.textContent = String(state.score);

    state.face.hitTimer = 0.18;
    state.face.scalePop = 0.20;
    state.shake = 0.12;

    playHit();
    spawnParticles(state.face.x, state.face.y, 18);

    // 速度を少し変えて“暴れさせる”
    state.face.vx *= rand(0.92, 1.12);
    state.face.vy *= rand(0.92, 1.12);
  } else {
    // 空振りペナルティ（好みでON/OFF）
    state.timeLeft = Math.max(0, state.timeLeft - 0.25);
  }
});

function update(dt) {
  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    elTime.textContent = "0.0";
    endGame();
    return;
  }
  elTime.textContent = state.timeLeft.toFixed(1);

  // 顔の移動
  const f = state.face;
  f.x += f.vx * dt;
  f.y += f.vy * dt;

  const w = window.innerWidth;
  const h = window.innerHeight;

  // 壁反射（HUDを避けて上側は少し余裕）
  const topMargin = 56;
  if (f.x - f.r < 0) { f.x = f.r; f.vx *= -1; }
  if (f.x + f.r > w) { f.x = w - f.r; f.vx *= -1; }
  if (f.y - f.r < topMargin) { f.y = topMargin + f.r; f.vy *= -1; }
  if (f.y + f.r > h) { f.y = h - f.r; f.vy *= -1; }

  // 演出タイマー
  f.hitTimer = Math.max(0, f.hitTimer - dt);
  f.scalePop = Math.max(0, f.scalePop - dt);
  state.shake = Math.max(0, state.shake - dt);

  // パーティクル
  state.particles = state.particles.filter(p => {
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.pow(0.06, dt); // 減衰
    p.vy *= Math.pow(0.06, dt);
    return p.t < p.life;
  });
}

function draw() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  // 画面揺れ
  let ox = 0, oy = 0;
  if (state.shake > 0) {
    const s = state.shake * 10;
    ox = rand(-s, s);
    oy = rand(-s, s);
  }

  ctx.save();
  ctx.translate(ox, oy);

  // 背景
  ctx.clearRect(-20, -20, w+40, h+40);
  ctx.fillStyle = "#0b0f1a";
  ctx.fillRect(0, 0, w, h);

  // パーティクル
  for (const p of state.particles) {
    const a = 1 - (p.t / p.life);
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4 + 6*a, 0, Math.PI*2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 顔
  const f = state.face;
  const img = (f.hitTimer > 0 ? assets.faceHit : assets.face);

  // ポップ（軽い拡大）
  const pop = (f.scalePop > 0) ? (1 + 0.18 * (f.scalePop / 0.20)) : 1;
  const size = (f.r * 2) * pop;

  // 影
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.ellipse(f.x, f.y + f.r*0.78, f.r*0.95, f.r*0.35, 0, 0, Math.PI*2);
  ctx.fillStyle = "#000000";
  ctx.fill();
  ctx.globalAlpha = 1;

  // 画像描画（円形クリップ）
  ctx.save();
  ctx.beginPath();
  ctx.arc(f.x, f.y, (f.r * pop), 0, Math.PI*2);
  ctx.clip();
  ctx.drawImage(img, f.x - size/2, f.y - size/2, size, size);
  ctx.restore();

  // 輪郭リング
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.arc(f.x, f.y, (f.r * pop), 0, Math.PI*2);
  ctx.stroke();

  ctx.restore();
}

function loop(t) {
  if (!state.running) return;
  const dt = clamp((t - state.lastT) / 1000, 0, 0.033);
  state.lastT = t;

  update(dt);
  if (state.running) {
    draw();
    requestAnimationFrame(loop);
  }
}

// 初期表示
overlay.classList.remove("hidden");
titleEl.textContent = "Face Bop";
resultEl.textContent = "STARTを押してね";
btn.textContent = "START";
