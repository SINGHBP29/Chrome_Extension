import { getGoogleAccessToken, googleApiGetJson } from "./googleIdentity";

export type GmailMessagePreview = {
  id: string;
  threadId?: string | null;
  snippet?: string | null;
  subject?: string;
  from?: string;
  date?: string;
};

type GmailListResponse = {
  messages?: Array<{ id: string; threadId?: string }>;
};

type GmailMessage = {
  id?: string;
  threadId?: string;
  snippet?: string;
  payload?: {
    headers?: Array<{ name?: string; value?: string }>;
  };
};

function getHeader(payload: GmailMessage["payload"] | undefined, name: string): string {
  const headers = payload?.headers;
  if (!Array.isArray(headers)) return "";
  const found = headers.find((h) => (h?.name || "").toLowerCase() === name.toLowerCase());
  return (found?.value || "").toString();
}

export async function getRecentGmailMessages(maxResults = 3): Promise<GmailMessagePreview[]> {
  const token = await getGoogleAccessToken(false);

  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listUrl.searchParams.set("maxResults", String(Math.max(1, Math.min(maxResults, 10))));
  listUrl.searchParams.set("q", "newer_than:7d");

  const listing = await googleApiGetJson<GmailListResponse>(listUrl.toString(), token);
  const messages = Array.isArray(listing?.messages) ? listing.messages : [];

  const previews: GmailMessagePreview[] = [];
  for (const msg of messages.slice(0, maxResults)) {
    if (!msg?.id) continue;

    const detailUrl = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(msg.id)}`);
    detailUrl.searchParams.set("format", "metadata");
    detailUrl.searchParams.append("metadataHeaders", "Subject");
    detailUrl.searchParams.append("metadataHeaders", "From");
    detailUrl.searchParams.append("metadataHeaders", "Date");

    const detail = await googleApiGetJson<GmailMessage>(detailUrl.toString(), token);
    previews.push({
      id: msg.id,
      threadId: (detail?.threadId as any) ?? msg.threadId ?? null,
      snippet: (detail?.snippet as any) ?? null,
      subject: getHeader(detail?.payload, "Subject"),
      from: getHeader(detail?.payload, "From"),
      date: getHeader(detail?.payload, "Date"),
    });
  }

  return previews;
}

