chrome.runtime.onInstalled.addListener(() => {
  console.log("Team Assistant Extension installed");
});

async function waitUntil(promise) {
  // Keep MV3 service worker alive until the async work finishes.
  // (Otherwise Chrome may terminate it mid-flight.)
  const keepAlive = setInterval(() => {
    try {
      chrome.runtime.getPlatformInfo(() => {});
    } catch {
      // ignore
    }
  }, 25 * 1000);
  try {
    return await promise;
  } finally {
    clearInterval(keepAlive);
  }
}

function showNotification(title, message) {
  const iconUrl = chrome.runtime?.getURL ? chrome.runtime.getURL("favicon.ico") : "favicon.ico";
  const notificationId = `team-assistant-${Date.now()}`;
  return new Promise((resolve) => {
    chrome.notifications.create(
      notificationId,
      {
        type: "basic",
        iconUrl,
        title: title,
        message: message,
        priority: 2,
      },
      () => {
        if (chrome.runtime?.lastError) {
          console.warn("notifications.create failed:", chrome.runtime.lastError.message);
        }
        resolve();
      }
    );
  });
}

const storage = chrome.storage?.session ?? chrome.storage.local;
const DEFAULT_NOTIFICATION_SERVICE_BASE_URLS = ["http://localhost:8001", "http://localhost:8002"];

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

async function getNotificationServiceBaseUrls() {
  try {
    const { notificationServiceBaseUrl } = await storageGet(["notificationServiceBaseUrl"]);
    const override =
      typeof notificationServiceBaseUrl === "string" ? notificationServiceBaseUrl.trim() : "";

    const urls = override ? [override, ...DEFAULT_NOTIFICATION_SERVICE_BASE_URLS] : DEFAULT_NOTIFICATION_SERVICE_BASE_URLS;
    return Array.from(new Set(urls));
  } catch {
    return DEFAULT_NOTIFICATION_SERVICE_BASE_URLS;
  }
}

async function maybeNotifyOnUiLeave() {
  console.log("[notify] ui-leave check start");
  const { searchState, suppressUntil, lastNotifiedAt } = await storageGet([
    "searchState",
    "suppressUntil",
    "lastNotifiedAt",
  ]);

  const now = Date.now();

  // Avoid hitting the backend unless we actually have a pending search to notify about.
  if (typeof suppressUntil === "number" && now < suppressUntil) return;
  if (!searchState || searchState.status !== "pending") return;

  const startedAt = typeof searchState.startedAt === "number" ? searchState.startedAt : 0;
  if (startedAt && now - startedAt > 2 * 60 * 1000) {
    await storageSet({ searchState: null });
    return;
  }

  if (typeof lastNotifiedAt === "number" && now - lastNotifiedAt < 15 * 1000) return;

  const baseUrls = await getNotificationServiceBaseUrls();
  for (const baseUrl of baseUrls) {
    try {
      console.log("[notify] calling decision service", {
        baseUrl,
        hasSearchState: !!searchState,
        status: searchState?.status,
        suppressUntil,
        lastNotifiedAt,
        now,
      });
      const response = await fetch(`${baseUrl}/api/notifications/ui-leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchState,
          suppressUntil,
          lastNotifiedAt,
          now,
        }),
      });

      if (!response.ok) {
        console.warn("[notify] decision service non-200", baseUrl, response.status);
        continue;
      }

      const decision = await response.json();
      console.log("[notify] decision service response", decision);
      if (decision?.notify) {
        await showNotification(
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
    } catch (error) {
      console.warn("[notify] decision service unreachable", baseUrl, error);
    }
  }

  // If backend is down, fall back to local logic below.
  console.warn("[notify] all decision services failed, using local fallback");

  const query = truncate(searchState.query ?? "your search");
  await showNotification(
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
  console.log("[ui] connected", { ports: uiPorts.size });

  port.onMessage.addListener((msg) => {
    // Heartbeat messages keep the MV3 service worker alive.
    if (msg?.type === "UI_HEARTBEAT") return;
    if (msg?.type) console.log("[ui] message", msg.type);
  });

  port.onDisconnect.addListener(() => {
    uiPorts.delete(port);
    console.log("[ui] disconnected", { ports: uiPorts.size, lastError: chrome.runtime?.lastError?.message });
    if (uiPorts.size === 0) waitUntil(maybeNotifyOnUiLeave());
  });
});

// Listen for messages from the React UI
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    if (request?.type === "SHOW_NOTIFICATION") {
      console.log("[msg] SHOW_NOTIFICATION", { title: request?.title });
      await waitUntil(showNotification(request.title, request.message));
      sendResponse({ success: true });
      return;
    }

    if (request?.type === "SUPPRESS_LEAVE_NOTIFICATIONS") {
      const ttlMs = typeof request.ttlMs === "number" ? request.ttlMs : 5000;
      console.log("[msg] SUPPRESS_LEAVE_NOTIFICATIONS", { ttlMs, reason: request?.reason });
      await storageSet({ suppressUntil: Date.now() + Math.max(0, ttlMs) });
      sendResponse({ success: true });
      return;
    }

    if (request?.type === "SEARCH_STARTED") {
      const query = typeof request.query === "string" ? request.query : "";
      const mode = typeof request.mode === "string" ? request.mode : "unknown";
      console.log("[msg] SEARCH_STARTED", { mode, query });
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
      console.log("[msg] SEARCH_FINISHED", { mode, query, ok });
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

    if (request?.type === "CHECK_UI_LEAVE") {
      console.log("[msg] CHECK_UI_LEAVE", { reason: request?.reason });
      await waitUntil(maybeNotifyOnUiLeave());
      sendResponse({ success: true });
      return;
    }

    sendResponse({ success: false });
  })();
  return true;
});
