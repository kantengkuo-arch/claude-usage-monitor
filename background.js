// background.js
// Polls the Claude.ai usage endpoint in the background using the browser's
// existing logged-in cookies (credentials: "include"). No tokens stored.

const POLL_MINUTES = 5; // refresh interval
const ALARM = "claude-usage-poll";

// ---- API ------------------------------------------------------------------

async function resolveOrgId() {
  // Cache the org id; fall back to fetching the org list.
  const { orgId } = await chrome.storage.local.get("orgId");
  if (orgId) return orgId;

  const res = await fetch("https://claude.ai/api/organizations", {
    credentials: "include",
    headers: { accept: "*/*" },
  });
  if (!res.ok) throw new Error("orgs " + res.status);
  const orgs = await res.json();
  if (!Array.isArray(orgs) || orgs.length === 0) throw new Error("no orgs");

  // Prefer an org that actually has a chat/usage capability; else first.
  const chosen =
    orgs.find((o) => (o.capabilities || []).includes("chat")) || orgs[0];
  const id = chosen.uuid || chosen.id;
  await chrome.storage.local.set({ orgId: id });
  return id;
}

async function fetchUsage() {
  let orgId = await resolveOrgId();
  let res = await fetch(
    `https://claude.ai/api/organizations/${orgId}/usage`,
    { credentials: "include", headers: { accept: "*/*" } }
  );

  // If org id went stale (404), clear cache and retry once.
  if (res.status === 404) {
    await chrome.storage.local.remove("orgId");
    orgId = await resolveOrgId();
    res = await fetch(
      `https://claude.ai/api/organizations/${orgId}/usage`,
      { credentials: "include", headers: { accept: "*/*" } }
    );
  }

  if (res.status === 401 || res.status === 403) {
    return { error: "auth" }; // not logged in
  }
  if (!res.ok) return { error: "http_" + res.status };

  const raw = await res.json();
  return { ok: true, usage: normalize(raw), fetchedAt: Date.now() };
}

// ---- Normalize ------------------------------------------------------------

// Map the raw API shape into a tidy list of { key, label, percent, resetsAt }.
function normalize(raw) {
  const out = [];
  const add = (key, label, node) => {
    if (!node || typeof node.utilization !== "number") return;
    out.push({
      key,
      label,
      percent: Math.round(node.utilization),
      resetsAt: node.resets_at || null,
    });
  };

  add("five_hour", "Current session", raw.five_hour);
  add("seven_day", "Weekly (all models)", raw.seven_day);
  add("seven_day_opus", "Weekly (Opus)", raw.seven_day_opus);
  add("seven_day_sonnet", "Weekly (Sonnet)", raw.seven_day_sonnet);
  add("seven_day_cowork", "Weekly (Cowork)", raw.seven_day_cowork);

  let credits = null;
  if (raw.extra_usage && raw.extra_usage.is_enabled) {
    credits = {
      used: raw.extra_usage.used_credits,
      limit: raw.extra_usage.monthly_limit,
      percent:
        typeof raw.extra_usage.utilization === "number"
          ? Math.round(raw.extra_usage.utilization)
          : null,
      currency: raw.extra_usage.currency,
    };
  }

  return { rows: out, credits };
}

// ---- Badge ----------------------------------------------------------------

function updateBadge(state) {
  if (state.error === "auth") {
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#8a8a8a" });
    return;
  }
  if (!state.ok || !state.usage) return;

  const percents = state.usage.rows
    .map((r) => r.percent)
    .filter((p) => typeof p === "number");
  if (percents.length === 0) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }
  const pct = Math.max(...percents);
  chrome.action.setBadgeText({ text: String(pct) });
  let color = "#3a9d5d";
  if (pct >= 85) color = "#e5484d";
  else if (pct >= 60) color = "#f5a623";
  chrome.action.setBadgeBackgroundColor({ color });
}

// ---- Poll cycle -----------------------------------------------------------

async function poll() {
  try {
    const state = await fetchUsage();
    await chrome.storage.local.set({ state });
    updateBadge(state);
  } catch (e) {
    const state = { error: "network", message: String(e) };
    await chrome.storage.local.set({ state });
    // keep last badge; just note it
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM, { periodInMinutes: POLL_MINUTES });
  poll();
});
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(ALARM, { periodInMinutes: POLL_MINUTES });
  poll();
});
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === ALARM) poll();
});

// Manual refresh from the popup.
chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
  if (msg.type === "REFRESH") {
    poll().then(() =>
      chrome.storage.local.get("state", (r) => sendResponse(r.state))
    );
    return true; // async
  }
});
