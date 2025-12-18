// app_base.js (FULL COPY-PASTE)
// - 共通: DOM参照/定数/ユーティリティ/エラーハンドラ
// - 既存の挙動は変えない（グローバル前提）

window.addEventListener("error", (e) => {
  alert("JS ERROR: " + (e?.message || e));
});
window.addEventListener("unhandledrejection", (e) => {
  alert("PROMISE ERROR: " + (e?.reason?.message || e?.reason || e));
});

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

const elScore = document.getElementById("score");
const elTime = document.getElementById("time");
const elBest = document.getElementById("best");
const overlay = document.getElementById("overlay");
const titleEl = document.getElementById("title");
const resultEl = document.getElementById("result");
const btn = document.getElementById("btn");

const BEST_KEY = "facebop_best_v4";

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function rand(a, b) { return a + Math.random() * (b - a); }

const RANK_LIMIT = 100;

// ---- Mobile detect ----
const IS_MOBILE = matchMedia("(pointer: coarse)").matches;

// ---- API ----
const API_BASE = "https://rank-api.atack-rank.workers.dev";

async function submitScore(name, score) {
  const r = await fetch(`${API_BASE}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, score }),
  });
  return r.json();
}

async function fetchTop(limit = 1) {
  const r = await fetch(`${API_BASE}/top?limit=${limit}`);
  return r.json();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));
}
