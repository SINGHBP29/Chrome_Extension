/**
 * Google Workspace Addon (Auth only)
 *
 * This file is intentionally standalone so you can reuse it anywhere in the extension UI
 * without pulling in Gmail/Calendar logic.
 *
 * It uses Chrome Extension OAuth (chrome.identity.getAuthToken) and reads `oauth2.client_id`
 * and `oauth2.scopes` from the extension `manifest.json`.
 */

type AuthTokenResult = { token?: string; grantedScopes?: string[] } | string | undefined;

function getChromeIdentity() {
  const chromeAny = globalThis as any;
  return chromeAny?.chrome?.identity as typeof chrome.identity | undefined;
}

function getRuntimeManifest(): chrome.runtime.Manifest | undefined {
  const chromeAny = globalThis as any;
  return chromeAny?.chrome?.runtime?.getManifest?.();
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
  const chromeAny = globalThis as any;
  return typeof chromeAny?.chrome?.runtime?.id === "string" ? chromeAny.chrome.runtime.id : "";
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

