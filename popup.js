// popup.js

function color(pct) {
  if (pct >= 85) return "#e5484d";
  if (pct >= 60) return "#f5a623";
  return "#c96442";
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

// "2026-06-05T10:00:00Z" -> "Resets in 1 hr 38 min"
function resetText(iso) {
  if (!iso) return "";
  const ms = new Date(iso).getTime() - Date.now();
  if (isNaN(ms)) return "";
  if (ms <= 0) return "Resetting…";
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const parts = [];
  if (h > 0) parts.push(h + " hr");
  parts.push(m + " min");
  return "Resets in " + parts.join(" ");
}

function rowHtml(r) {
  const pct = typeof r.percent === "number" ? r.percent : 0;
  return `
    <div class="row">
      <div class="row-head">
        <span class="label">${esc(r.label)}</span>
        <span class="pct">${pct}%</span>
      </div>
      <div class="track"><div class="fill" style="width:${pct}%;background:${color(pct)}"></div></div>
      ${r.resetsAt ? `<div class="reset">${esc(resetText(r.resetsAt))}</div>` : ""}
    </div>`;
}

function render(state) {
  const content = document.getElementById("content");
  const updated = document.getElementById("updated");

  if (!state) {
    content.innerHTML = `<div class="msg">No data yet. Hit Refresh.</div>`;
    updated.textContent = "";
    return;
  }
  if (state.error === "auth") {
    content.innerHTML = `<div class="msg">Not logged in. Open
      <a href="https://claude.ai" target="_blank">claude.ai</a>, sign in, then Refresh.</div>`;
    updated.textContent = "";
    return;
  }
  if (state.error) {
    content.innerHTML = `<div class="msg">Couldn't fetch usage (${esc(state.error)}).
      Make sure you're logged in to claude.ai, then Refresh.</div>`;
    return;
  }
  if (!state.usage || !state.usage.rows.length) {
    content.innerHTML = `<div class="msg">No usage data returned.</div>`;
    return;
  }

  let html = state.usage.rows.map(rowHtml).join("");
  const c = state.usage.credits;
  if (c && c.percent != null) {
    html += rowHtml({ label: "Usage credits", percent: c.percent, resetsAt: null });
  }
  content.innerHTML = html;

  if (state.fetchedAt) {
    const secs = Math.round((Date.now() - state.fetchedAt) / 1000);
    updated.textContent =
      secs < 60 ? `Updated ${secs}s ago` : `Updated ${Math.round(secs / 60)}m ago`;
  }
}

function load() {
  chrome.storage.local.get("state", (r) => render(r.state));
}

document.getElementById("refresh").addEventListener("click", () => {
  const btn = document.getElementById("refresh");
  btn.disabled = true;
  btn.textContent = "…";
  chrome.runtime.sendMessage({ type: "REFRESH" }, (state) => {
    render(state);
    btn.disabled = false;
    btn.textContent = "Refresh";
  });
});

load();
