chrome.runtime.onInstalled.addListener(() => {
  console.log("Team Assistant Extension installed");
});

function showNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "favicon.ico",
    title: title,
    message: message,
    priority: 2
  });
}

const storage = chrome.storage?.session ?? chrome.storage.local;
const NOTIFICATION_SERVICE_BASE_URL = "http://localhost:8001";

function storageGet(keys) {
  return new Promise((resolve) => storage.get(keys, (res) => resolve(res ?? {})));
}

function storageSet(obj) {
  return new Promise((resolve) => storage.set(obj, () => resolve()));
}

function truncate(message, maxLen = 120) {
  if (typeof message !== "string") return "";
  if (message.length <= maxLen) return message;
  return `${message.slice(0, Math.max(0, maxLen - 1))}…`;
}

async function maybeNotifyOnUiLeave() {
  const { searchState, suppressUntil, lastNotifiedAt } = await storageGet([
    "searchState",
    "suppressUntil",
    "lastNotifiedAt",
  ]);

  const now = Date.now();
  try {
    const response = await fetch(`${NOTIFICATION_SERVICE_BASE_URL}/api/notifications/ui-leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchState,
        suppressUntil,
        lastNotifiedAt,
        now,
      }),
    });

    if (response.ok) {
      const decision = await response.json();
      if (decision?.notify) {
        showNotification(
          decision.title ?? "Search in progress",
          decision.message ?? "You left Team Assistant while a search was in progress."
        );
      }

      const updates = {};
      if (decision?.clearSearchState) updates.searchState = null;
      if (typeof decision?.setLastNotifiedAt === "number") {
        updates.lastNotifiedAt = decision.setLastNotifiedAt;
      }
      if (Object.keys(updates).length > 0) await storageSet(updates);
      return;
    }
  } catch {
    // If backend is down, fall back to local logic below.
  }

  if (typeof suppressUntil === "number" && now < suppressUntil) return;
  if (!searchState || searchState.status !== "pending") return;

  const startedAt = typeof searchState.startedAt === "number" ? searchState.startedAt : 0;
  if (startedAt && now - startedAt > 2 * 60 * 1000) {
    await storageSet({ searchState: null });
    return;
  }

  if (typeof lastNotifiedAt === "number" && now - lastNotifiedAt < 15 * 1000) return;

  const query = truncate(searchState.query ?? "your search");
  showNotification(
    "Search in progress",
    `You searched “${query}” but left Team Assistant. Reopen it to continue.`
  );

  await storageSet({
    lastNotifiedAt: now,
    searchState: null,
  });
}

const uiPorts = new Set();

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "team-assistant-ui") return;

  uiPorts.add(port);

  port.onDisconnect.addListener(() => {
    uiPorts.delete(port);
    if (uiPorts.size === 0) maybeNotifyOnUiLeave();
  });
});

// Listen for messages from the React UI
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    if (request?.type === "SHOW_NOTIFICATION") {
      showNotification(request.title, request.message);
      sendResponse({ success: true });
      return;
    }

    if (request?.type === "SUPPRESS_LEAVE_NOTIFICATIONS") {
      const ttlMs = typeof request.ttlMs === "number" ? request.ttlMs : 5000;
      await storageSet({ suppressUntil: Date.now() + Math.max(0, ttlMs) });
      sendResponse({ success: true });
      return;
    }

    if (request?.type === "SEARCH_STARTED") {
      const query = typeof request.query === "string" ? request.query : "";
      const mode = typeof request.mode === "string" ? request.mode : "unknown";
      await storageSet({
        searchState: {
          query,
          mode,
          status: "pending",
          startedAt: Date.now(),
        },
      });
      sendResponse({ success: true });
      return;
    }

    if (request?.type === "SEARCH_FINISHED") {
      const ok = typeof request.ok === "boolean" ? request.ok : true;
      const query = typeof request.query === "string" ? request.query : "";
      const mode = typeof request.mode === "string" ? request.mode : "unknown";
      await storageSet({
        searchState: {
          query,
          mode,
          status: ok ? "completed" : "failed",
          finishedAt: Date.now(),
        },
      });
      sendResponse({ success: true });
      return;
    }

    sendResponse({ success: false });
  })();
  return true;
});
