// audio.js (FULL COPY-PASTE)
// - WebAudio (fast, tap-safe)
// - 依存: app_base.js(IS_MOBILE, btn, resultEl)

let audioCtx = null;
let gainBgm = null;
let gainSe = null;
let buffers = { hit01: null, hit02: null, count: null, finish: null, bgm: null };
let bgmSource = null;

let audioReadyPromise = null;
let isStarting = false;

function setButtonLoading(on) {
  if (on) {
    btn.disabled = true;
    btn.textContent = "LOADING...";
    resultEl.textContent = "音声を読み込み中…";
  } else {
    btn.disabled = false;
  }
}

function audioIsReady() {
  return !!(audioCtx && buffers.hit01 && buffers.hit02 && buffers.count && buffers.finish && buffers.bgm);
}

async function ensureAudio() {
  if (audioIsReady()) return;
  if (audioReadyPromise) return audioReadyPromise;

  audioReadyPromise = (async () => {
    try {
      if (audioCtx) { try { audioCtx.close(); } catch (_) {} }
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      gainBgm = audioCtx.createGain();
      gainSe = audioCtx.createGain();
      gainBgm.gain.value = 0.18;
      gainSe.gain.value = 0.85;
      gainBgm.connect(audioCtx.destination);
      gainSe.connect(audioCtx.destination);

      async function loadBuf(url) {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`fetch failed ${res.status}: ${url}`);
        const arr = await res.arrayBuffer();
        try {
          return await audioCtx.decodeAudioData(arr);
        } catch (_) {
          throw new Error(`decodeAudioData failed: ${url}`);
        }
      }

      const [b1, b2, b3, b4, b5] = await Promise.all([
        loadBuf("./assets/hit01.mp3"),
        loadBuf("./assets/hit02.mp3"),
        loadBuf("./assets/count.mp3"),
        loadBuf("./assets/bgm.mp3"),
        loadBuf("./assets/finish.mp3"),
      ]);

      buffers.hit01 = b1;
      buffers.hit02 = b2;
      buffers.count = b3;
      buffers.bgm = b4;
      buffers.finish = b5;

    } catch (e) {
      audioReadyPromise = null;
      if (audioCtx) { try { audioCtx.close(); } catch (_) {} }
      audioCtx = null;
      gainBgm = null;
      gainSe = null;
      buffers = { hit01: null, hit02: null, count: null, finish: null, bgm: null };
      bgmSource = null;
      throw e;
    }
  })();

  return audioReadyPromise;
}

function startBGM() {
  if (!audioCtx || !buffers.bgm) return;
  if (bgmSource) return;
  bgmSource = audioCtx.createBufferSource();
  bgmSource.buffer = buffers.bgm;
  bgmSource.loop = true;
  bgmSource.connect(gainBgm);
  bgmSource.start(0);
}

let lastSeTime = 0;
function playSE(buf, volMul = 1.0) {
  if (!audioCtx || !buf) return;

  const now = performance.now();
  if (IS_MOBILE && now - lastSeTime < 70) return;
  lastSeTime = now;

  const src = audioCtx.createBufferSource();
  src.buffer = buf;

  const g = audioCtx.createGain();
  g.gain.value = volMul;
  src.connect(g);
  g.connect(gainSe);

  src.start(0);
}

function playHitNormal() { playSE(buffers.hit01, 0.95); }
function playHitBonus()  { playSE(buffers.hit02, 1.00); }
function playCount()     { playSE(buffers.count, 0.95); }
function playFinish()    { playSE(buffers.finish, 1.00); }
