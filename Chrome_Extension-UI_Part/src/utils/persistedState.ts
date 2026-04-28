const hasChromeStorage = typeof chrome !== "undefined" && !!chrome.storage?.local;

export async function persistedGet<T>(key: string): Promise<T | null> {
  if (hasChromeStorage) {
    return await new Promise((resolve) => {
      try {
        chrome.storage.local.get([key], (result) => resolve((result?.[key] as T) ?? null));
      } catch {
        resolve(null);
      }
    });
  }

  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function persistedSet(key: string, value: unknown): Promise<void> {
  if (hasChromeStorage) {
    await new Promise<void>((resolve) => {
      try {
        chrome.storage.local.set({ [key]: value }, () => resolve());
      } catch {
        resolve();
      }
    });
    return;
  }

  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export async function persistedRemove(key: string): Promise<void> {
  if (hasChromeStorage) {
    await new Promise<void>((resolve) => {
      try {
        chrome.storage.local.remove([key], () => resolve());
      } catch {
        resolve();
      }
    });
    return;
  }

  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    // ignore
  }
}

