// ranking.js (FULL COPY-PASTE)
// - Ranking UI / Modal / Submit / Refresh
// - 依存: app_base.js(ui_layout.js の lockOverlayToVisualViewport / overlay), game_core.js(state)

function createRankBox(kind /* "inline" | "modal" */) {
  const box = document.createElement("div");
  box.className = `rankBox rankBox-${kind}`;
  box.style.width = "min(86vw, 420px)";
  box.style.padding = "10px 12px";
  box.style.borderRadius = "14px";
  box.style.background = "rgba(255,255,255,0.08)";
  box.style.boxShadow = "0 10px 28px rgba(0,0,0,0.25)";
  box.style.backdropFilter = "blur(6px)";
  box.style.boxSizing = "border-box";
  box.style.color = "rgba(255,255,255,0.95)";

  const title = document.createElement("div");
  title.textContent = "RANKING";
  title.style.fontWeight = "900";
  title.style.letterSpacing = "0.08em";
  title.style.textAlign = "center";
  title.style.marginBottom = "8px";
  title.style.color = "rgba(255,255,255,0.95)";
  box.appendChild(title);

  const row = document.createElement("div");
  row.className = "rankRow";
  row.style.display = "grid";
  row.style.gap = "8px";
  row.style.alignItems = "center";
  box.appendChild(row);

  const input = document.createElement("input");
  input.className = "rankName";
  input.type = "text";
  input.maxLength = 16;
  input.placeholder = "ユーザ名（16文字まで）";
  input.value = localStorage.getItem("rank_name") || "";
  input.style.width = "100%";
  input.style.padding = "10px 12px";
  input.style.borderRadius = "12px";
  input.style.border = "1px solid rgba(255,255,255,0.18)";
  input.style.background = "rgba(0,0,0,0.25)";
  input.style.color = "rgba(255,255,255,0.95)";
  input.style.outline = "none";
  input.style.minWidth = "0";
  input.style.boxSizing = "border-box";
  row.appendChild(input);

  input.addEventListener("focus", () => { lockOverlayToVisualViewport(); }, { passive: true });
  input.addEventListener("blur",  () => { lockOverlayToVisualViewport(); }, { passive: true });

  input.style.fontSize = "16px";
  input.inputMode = "text";
  input.autocapitalize = "none";
  input.autocorrect = "off";
  input.spellcheck = false;

  const send = document.createElement("button");
  send.className = "rankSend";
  send.textContent = "送信";
  send.style.padding = "10px 12px";
  send.style.borderRadius = "12px";
  send.style.border = "1px solid rgba(255,255,255,0.20)";
  send.style.background = "rgba(255,255,255,0.12)";
  send.style.color = "rgba(255,255,255,0.95)";
  send.style.fontWeight = "800";
  send.style.cursor = "pointer";
  row.appendChild(send);

  const refreshBtn = document.createElement("button");
  refreshBtn.className = "rankRefresh";
  refreshBtn.textContent = "更新";
  refreshBtn.style.padding = "10px 12px";
  refreshBtn.style.borderRadius = "12px";
  refreshBtn.style.border = "1px solid rgba(255,255,255,0.20)";
  refreshBtn.style.background = "rgba(255,255,255,0.12)";
  refreshBtn.style.color = "rgba(255,255,255,0.95)";
  refreshBtn.style.fontWeight = "800";
  refreshBtn.style.cursor = "pointer";
  row.appendChild(refreshBtn);

  const msg = document.createElement("div");
  msg.className = "rankMsg";
  msg.style.opacity = "0.9";
  msg.style.fontSize = "12px";
  msg.style.marginTop = "6px";
  msg.style.textAlign = "center";
  msg.textContent = "ランキング取得中…";
  box.appendChild(msg);

  const list = document.createElement("div");
  list.className = "rankList";
  list.style.marginTop = "8px";
  list.style.display = "grid";
  list.style.gap = "6px";
  list.style.maxHeight = (kind === "modal") ? "52vh" : "26vh";
  list.style.overflowY = "auto";
  list.style.overflowX = "hidden";
  list.style.webkitOverflowScrolling = "touch";
  list.style.touchAction = "pan-y";
  box.appendChild(list);

  return box;
}

function getRankEls(box) {
  return {
    row: box.querySelector(".rankRow"),
    input: box.querySelector(".rankName"),
    send: box.querySelector(".rankSend"),
    refresh: box.querySelector(".rankRefresh"),
    msg: box.querySelector(".rankMsg"),
    list: box.querySelector(".rankList"),
  };
}

function setRankingModeOnBox(box, mode /* "view" | "submit" */) {
  const { row, input, send, refresh, msg } = getRankEls(box);
  if (!row || !input || !send || !refresh || !msg) return;

  if (mode === "view") {
    row.style.display = "grid";
    row.style.gridTemplateColumns = "minmax(0, 1fr) auto";
    row.style.gap = "8px";

    input.style.display = "none";
    send.style.display = "none";
    refresh.style.display = "inline-block";
    refresh.textContent = "更新";
    msg.textContent = "ランキング表示（更新できます）";
    return;
  }

  row.style.display = "grid";
  row.style.gridTemplateColumns = "1fr";
  row.style.gap = "8px";

  input.style.display = "block";
  input.style.width = "100%";

  refresh.style.display = "none";

  send.style.display = "block";
  send.style.width = "100%";

  input.disabled = false;

  if (state.rankSubmitted) {
    send.disabled = true;
    send.textContent = "送信済み";
    input.disabled = true;
    msg.textContent = "送信済み！（この回は1回だけ）";
  } else {
    send.disabled = false;
    send.textContent = "送信";
    msg.textContent = "送信してランキングに参加しよう！";
  }
}

async function refreshRankingOnBox(box, limit = 20) {
  const { msg, list } = getRankEls(box);
  try {
    if (msg) msg.textContent = "ランキング更新中…";
    const data = await fetchTop(limit);
    const top = (data && data.top) ? data.top : [];

    if (list) {
      list.innerHTML = top.map((r, i) => {
        const name = escapeHtml(r.name);
        const score = Number(r.score) | 0;
        return `<div style="color:rgba(255,255,255,0.95);display:flex;justify-content:space-between;gap:10px;
             padding:8px 10px;border-radius:12px;
             background:rgba(0,0,0,0.22);border:1px solid rgba(255,255,255,0.10);">
          <div style="font-weight:800;">${i + 1}. ${name}</div>
          <div style="font-weight:900;">${score}</div>
        </div>`;
      }).join("");
    }

    if (msg) {
      if (state.rankSubmitted) msg.textContent = "送信済み！（この回は1回だけ）";
      else msg.textContent = "ランキング表示中";
    }
  } catch (e) {
    console.error(e);
    if (msg) msg.textContent = "ランキング取得に失敗（通信/URLを確認）";
  }
}

async function submitMyScoreOnBox(box, finalScore) {
  const { input, msg, send } = getRankEls(box);

  if (state.rankSubmitting) { if (msg) msg.textContent = "送信中…"; return; }
  if (state.rankSubmitted)  { if (msg) msg.textContent = "送信済み！"; return; }

  const name = (input ? input.value : "").trim();
  if (!name) { if (msg) msg.textContent = "名前を入力してね"; return; }

  localStorage.setItem("rank_name", name);

  try {
    state.rankSubmitting = true;
    if (send) send.disabled = true;
    if (msg) msg.textContent = "送信中…";

    const res = await submitScore(name, finalScore);
    if (!res || res.ok !== true) {
      if (msg) msg.textContent = "送信失敗：" + (res && res.error ? res.error : "unknown");
      if (send) send.disabled = false;
      return;
    }

    state.rankSubmitted = true;

    if (send) { send.disabled = true; send.textContent = "送信済み"; }
    if (input) input.disabled = true;
    if (msg) msg.textContent = "送信OK！ランキング更新中…";

    await refreshRankingOnBox(box, RANK_LIMIT);

    if (msg) msg.textContent = "送信済み！（この回は1回だけ）";
  } catch (e) {
    console.error(e);
    if (msg) msg.textContent = "送信に失敗（通信/URLを確認）";
    if (send && !state.rankSubmitted) send.disabled = false;
  } finally {
    state.rankSubmitting = false;
  }
}

// ---- INLINE Rank box on RESULT ----
let rankInlineBox = null;
function ensureRankInlineBox(parent) {
  if (rankInlineBox && rankInlineBox.isConnected) return rankInlineBox;
  rankInlineBox = createRankBox("inline");
  parent.appendChild(rankInlineBox);

  const { refresh, send } = getRankEls(rankInlineBox);
  if (refresh) refresh.onclick = () => refreshRankingOnBox(rankInlineBox, 20);
  if (send) send.onclick = () => submitMyScoreOnBox(rankInlineBox, state.score);

  return rankInlineBox;
}

// ---- MODAL Rank box (STARTから閲覧) ----
let rankModal = null;
let rankModalBox = null;

function ensureRankModal() {
  if (rankModal) return rankModal;

  const back = document.createElement("div");
  back.id = "rankModal";
  back.style.position = "absolute";
  back.style.inset = "0";
  back.style.display = "none";
  back.style.alignItems = "center";
  back.style.justifyContent = "center";
  back.style.background = "rgba(0,0,0,0.55)";
  back.style.zIndex = "30";
  back.style.padding = "18px";
  back.style.boxSizing = "border-box";

  const panel = document.createElement("div");
  panel.style.width = "min(92vw, 460px)";
  panel.style.borderRadius = "16px";
  panel.style.background = "rgba(20,22,26,0.92)";
  panel.style.border = "1px solid rgba(255,255,255,0.10)";
  panel.style.boxShadow = "0 14px 40px rgba(0,0,0,0.45)";
  panel.style.backdropFilter = "blur(10px)";
  panel.style.padding = "12px";
  panel.style.position = "relative";
  panel.style.boxSizing = "border-box";
  back.appendChild(panel);

  const close = document.createElement("button");
  close.textContent = "×";
  close.style.position = "absolute";
  close.style.top = "10px";
  close.style.right = "12px";
  close.style.width = "40px";
  close.style.height = "40px";
  close.style.borderRadius = "12px";
  close.style.border = "1px solid rgba(255,255,255,0.25)";
  close.style.background = "rgba(32,34,38,1)";
  close.style.color = "rgba(255,255,255,0.95)";
  close.style.fontSize = "22px";
  close.style.fontWeight = "900";
  close.style.cursor = "pointer";
  close.style.boxShadow = "0 6px 16px rgba(0,0,0,0.45)";
  close.style.zIndex = "9999";
  close.style.pointerEvents = "auto";
  close.onclick = () => closeRankModal();
  panel.appendChild(close);

  rankModalBox = createRankBox("modal");
  panel.appendChild(rankModalBox);

  const { refresh, send } = getRankEls(rankModalBox);
  if (refresh) refresh.onclick = () => refreshRankingOnBox(rankModalBox, 20);
  if (send) send.onclick = () => submitMyScoreOnBox(rankModalBox, state.score);

  back.addEventListener("pointerdown", (e) => {
    if (e.target === back) closeRankModal();
  }, { passive: true });

  overlay.style.position = "relative";
  overlay.appendChild(back);

  rankModal = back;
  return rankModal;
}

function openRankModal(mode /* "view" | "submit" */) {
  ensureRankModal();
  setRankingModeOnBox(rankModalBox, mode);
  rankModal.style.display = "flex";
  refreshRankingOnBox(rankModalBox, RANK_LIMIT);
}

function closeRankModal() {
  if (!rankModal) return;
  rankModal.style.display = "none";
}

// ★モーダルは先に作っておく（元コード同様）
ensureRankModal();
