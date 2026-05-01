type AuthTokenResult = { token?: string; grantedScopes?: string[] } | string | undefined;

function getChromeIdentity() {
  const chromeAny = (globalThis as any).chrome;
  return chromeAny?.identity as typeof chrome.identity | undefined;
}

function getRuntimeManifest(): chrome.runtime.Manifest | undefined {
  const chromeAny = (globalThis as any).chrome;
  return chromeAny?.runtime?.getManifest?.();
}

function normalizeToken(result: AuthTokenResult): string | null {
  if (!result) return null;
  if (typeof result === "string") return result;
  if (typeof result === "object" && typeof (result as any).token === "string") return (result as any).token;
  return null;
}

function getOAuthScopesFromManifest(): string[] {
  const manifest = getRuntimeManifest();
  const raw = (manifest as any)?.oauth2?.scopes;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => typeof s === "string" && s.trim().length > 0)
    .map((s) => String(s).trim());
}

function getExtensionId(): string {
  const chromeAny = (globalThis as any).chrome;
  return typeof chromeAny?.runtime?.id === "string" ? chromeAny.runtime.id : "";
}

function enrichAuthErrorMessage(original: string): string {
  const message = (original || "").trim() || "OAuth failed.";
  const extensionId = getExtensionId();
  const clientId = getOAuthClientId() || "";

  const lower = message.toLowerCase();
  const hints: string[] = [];

  if (
    lower.includes("bad client id") ||
    lower.includes("invalid credentials") ||
    lower.includes("credentials rejected") ||
    lower.includes("authorization failed") ||
    lower.includes("bad request") ||
    lower.includes("invalid client") ||
    lower.includes("redirect_uri_mismatch")
  ) {
    hints.push(
      `Fix: create a Google OAuth client of type "Chrome Extension" with Item ID = ${extensionId || "<your extension id>"} and update oauth2.client_id in manifest.json.`
    );
  } else if (lower.includes("user is not signed in")) {
    hints.push("Fix: sign into Chrome (same profile running the extension) and try again.");
  } else if (lower.includes("not configured") && lower.includes("oauth")) {
    hints.push("Fix: set oauth2.client_id in manifest.json, then rebuild + reload the extension.");
  }

  const contextParts: string[] = [];
  if (extensionId) contextParts.push(`Extension ID: ${extensionId}`);
  if (clientId) contextParts.push(`oauth2.client_id: ${clientId}`);

  const suffix = [...contextParts, ...hints].filter(Boolean).join(" | ");
  return suffix ? `${message} | ${suffix}` : message;
}

export function getOAuthClientId(): string | null {
  const manifest = getRuntimeManifest();
  const clientId = (manifest as any)?.oauth2?.client_id;
  return typeof clientId === "string" ? clientId : null;
}

export function isOAuthConfigured(): boolean {
  const clientId = getOAuthClientId();
  return !!clientId && !clientId.includes("YOUR_GOOGLE_OAUTH_CLIENT_ID");
}

export function notifyGoogleAuthChanged() {
  try {
    window.dispatchEvent(new Event("google-auth-changed"));
  } catch {
    // ignore
  }
}

export async function getGoogleAccessToken(interactive: boolean): Promise<string> {
  const identity = getChromeIdentity();
  if (!identity?.getAuthToken) {
    throw new Error("chrome.identity is unavailable. Open this inside the extension popup.");
  }

  if (!isOAuthConfigured()) {
    throw new Error("Google OAuth is not configured. Set oauth2.client_id in manifest.json.");
  }

  const scopes = getOAuthScopesFromManifest();
  const details = (scopes.length > 0 ? { interactive, scopes } : { interactive }) as any;

  // MV3 supports Promise-based APIs (Chrome 105+), but callback style exists too.
  try {
    const maybePromise = (identity.getAuthToken as any)(details);
    if (maybePromise && typeof maybePromise.then === "function") {
      const result: AuthTokenResult = await maybePromise;
      const token = normalizeToken(result);
      if (!token) throw new Error("No OAuth token returned.");
      return token;
    }
  } catch {
    // Fall through to callback-based flow.
  }

  const token = await new Promise<string>((resolve, reject) => {
    (identity.getAuthToken as any)(details, (result: AuthTokenResult) => {
      const lastError = (globalThis as any).chrome?.runtime?.lastError?.message;
      if (lastError) return reject(new Error(enrichAuthErrorMessage(lastError)));
      const nextToken = normalizeToken(result);
      if (!nextToken) return reject(new Error("No OAuth token returned."));
      resolve(nextToken);
    });
  });

  return token;
}

export async function removeCachedToken(token: string): Promise<void> {
  const identity = getChromeIdentity();
  if (!identity?.removeCachedAuthToken) return;

  const maybePromise = (identity.removeCachedAuthToken as any)({ token });
  if (maybePromise && typeof maybePromise.then === "function") {
    await maybePromise;
    return;
  }

  await new Promise<void>((resolve) => {
    (identity.removeCachedAuthToken as any)({ token }, () => resolve());
  });
}

export async function clearAllCachedTokens(): Promise<void> {
  const identity = getChromeIdentity();
  if (!identity?.clearAllCachedAuthTokens) return;

  const maybePromise = (identity.clearAllCachedAuthTokens as any)();
  if (maybePromise && typeof maybePromise.then === "function") {
    await maybePromise;
    return;
  }

  await new Promise<void>((resolve) => {
    (identity.clearAllCachedAuthTokens as any)(() => resolve());
  });
}

export async function getProfileUserInfo(): Promise<{ email: string; id: string }> {
  const identity = getChromeIdentity();
  if (!identity?.getProfileUserInfo) return { email: "", id: "" };

  const details = { accountStatus: "ANY" } as any;
  const maybePromise = (identity.getProfileUserInfo as any)(details);
  if (maybePromise && typeof maybePromise.then === "function") {
    const result = await maybePromise;
    return {
      email: typeof result?.email === "string" ? result.email : "",
      id: typeof result?.id === "string" ? result.id : "",
    };
  }

  return await new Promise((resolve) => {
    (identity.getProfileUserInfo as any)(details, (result: any) => {
      resolve({
        email: typeof result?.email === "string" ? result.email : "",
        id: typeof result?.id === "string" ? result.id : "",
      });
    });
  });
}

function formatGoogleApiError(status: number, bodyText: string): string {
  const trimmed = (bodyText || "").trim();
  if (!trimmed) return `Google API failed (${status}).`;

  try {
    const parsed = JSON.parse(trimmed);
    const message =
      parsed?.error?.message ||
      parsed?.error?.errors?.[0]?.message ||
      parsed?.message ||
      "";
    const reason =
      parsed?.error?.errors?.[0]?.reason ||
      parsed?.error?.status ||
      parsed?.status ||
      "";

    const parts = [message, reason].map((p) => (typeof p === "string" ? p.trim() : "")).filter(Boolean);
    if (parts.length > 0) {
      const joined = parts.join(" — ");
      const lower = joined.toLowerCase();
      const hints: string[] = [];

      if (status === 401) {
        hints.push("Fix: sign out/in again (token may be stale).");
      }

      if (
        status === 403 &&
        (lower.includes("insufficient authentication scopes") ||
          lower.includes("access_token_scope_insufficient") ||
          lower.includes("insufficient permission") ||
          lower.includes("insufficientpermissions"))
      ) {
        hints.push("Fix: click Settings → Google account → Sign out, then Sign in again to grant Gmail/Calendar scopes.");
      }

      if (status === 403 && (lower.includes("accessnotconfigured") || lower.includes("has not been used in project"))) {
        hints.push("Fix: enable Gmail API / Google Calendar API in your Google Cloud project.");
      }

      const suffix = hints.length > 0 ? ` | ${hints.join(" ")}` : "";
      return `Google API failed (${status}): ${joined}${suffix}`;
    }
  } catch {
    // ignore parse errors
  }

  return `Google API failed (${status}): ${trimmed}`;
}

async function googleApiRequest<T = unknown>(
  method: "GET" | "POST" | "PUT" | "PATCH",
  url: string,
  token: string,
  body?: unknown,
  retry = 0
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    await removeCachedToken(token);
  }

  // Common case: token was revoked or stale. Remove it and retry once with a fresh cached token.
  if (res.status === 401 && retry === 0) {
    try {
      const nextToken = await getGoogleAccessToken(false);
      if (nextToken && nextToken !== token) {
        return await googleApiRequest(method, url, nextToken, body, retry + 1);
      }
    } catch {
      // ignore and surface original error below
    }
  }

  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(formatGoogleApiError(res.status, text || res.statusText));

  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    // Some endpoints can return non-JSON on error; for success we still surface body text.
    return text as unknown as T;
  }
}

export async function googleApiGetJson<T = unknown>(url: string, token: string): Promise<T> {
  return await googleApiRequest("GET", url, token);
}

export async function googleApiPutJson<T = unknown>(url: string, token: string, body: unknown): Promise<T> {
  return await googleApiRequest("PUT", url, token, body);
}
