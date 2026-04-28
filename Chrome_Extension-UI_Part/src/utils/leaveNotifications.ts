type SearchMode = "meetings" | "employees" | string;

function getChromeRuntime() {
  const chromeAny = (globalThis as any).chrome;
  return chromeAny?.runtime;
}

export function sendToBackground(payload: unknown): Promise<void> {
  return new Promise((resolve) => {
    try {
      const runtime = getChromeRuntime();
      if (!runtime?.sendMessage) return resolve();

      runtime.sendMessage(payload, () => {
        if (runtime?.lastError?.message) {
          console.warn("background message failed:", runtime.lastError.message);
        }
        resolve();
      });
    } catch (error) {
      console.warn("background message threw:", error);
      resolve();
    }
  });
}

export function notifySearchStarted(mode: SearchMode, query: string) {
  return sendToBackground({
    type: "SEARCH_STARTED",
    mode,
    query: typeof query === "string" ? query : "",
  });
}

export function notifySearchFinished(mode: SearchMode, query: string, ok: boolean) {
  return sendToBackground({
    type: "SEARCH_FINISHED",
    mode,
    query: typeof query === "string" ? query : "",
    ok: typeof ok === "boolean" ? ok : true,
  });
}

export function requestUiLeaveCheck(reason?: string) {
  return sendToBackground({
    type: "CHECK_UI_LEAVE",
    reason: typeof reason === "string" ? reason : undefined,
  });
}

