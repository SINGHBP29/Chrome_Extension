# Google Workspace Addon (Auth only)

This folder intentionally contains a single reusable auth module:

- `google_auth.ts` — gets an OAuth access token using `chrome.identity.getAuthToken()` and the `oauth2.*` config in your extension `manifest.json`.

## Important: “API key” vs OAuth client

For **Google user data**, an API key is **not enough**. You need an **OAuth Client ID** of type **Chrome Extension** (no client secret needed in the extension).

## 1) Get OAuth Client ID (Chrome Extension)

In Google Cloud Console:

1. Enable any APIs you plan to call (example: Gmail API, Google Calendar API)
2. Create credentials → OAuth Client ID → **Chrome Extension**
3. Enter your extension's **Item ID** (from `chrome://extensions`)
4. Copy the generated **client ID** (ends with `.apps.googleusercontent.com`)

## 2) Update your extension manifest

Add/update these keys in `manifest.json`:

- `permissions`: include `identity` and `identity.email`
- `host_permissions`: include `https://www.googleapis.com/*` (and any other Google API hosts you call)
- `oauth2.client_id`: your OAuth client ID
- `oauth2.scopes`: the scopes you need (examples below)

Example scopes:
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/calendar.events`

## 3) Use the auth module

Import/copy `google_workspace_addon/google_auth.ts` into your extension UI code and call:

- `getGoogleAccessToken(interactive)`
- `clearAllCachedTokens()`
- `getProfileUserInfo()`
- `isOAuthConfigured()` / `getOAuthClientId()`
