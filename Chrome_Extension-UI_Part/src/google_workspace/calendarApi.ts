import { getGoogleAccessToken, googleApiGetJson, googleApiPutJson } from "./googleIdentity";

export type CalendarEventPreview = {
  id?: string | null;
  summary?: string;
  start?: string;
  end?: string;
  htmlLink?: string | null;
  hangoutLink?: string | null;
  selfResponseStatus?: string;
};

type CalendarEventsListResponse = {
  items?: Array<any>;
};

function selfResponseStatus(attendees: unknown): string {
  if (!Array.isArray(attendees)) return "";
  for (const attendee of attendees) {
    if (attendee && typeof attendee === "object" && (attendee as any).self === true) {
      return String((attendee as any).responseStatus || "");
    }
  }
  return "";
}

export async function getUpcomingCalendarEvents(maxResults = 3): Promise<CalendarEventPreview[]> {
  const token = await getGoogleAccessToken(false);

  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();

  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", String(Math.max(1, Math.min(maxResults, 20))));
  url.searchParams.set("maxAttendees", "50");

  const data = await googleApiGetJson<CalendarEventsListResponse>(url.toString(), token);
  const items = Array.isArray(data?.items) ? data.items : [];

  const simplified: CalendarEventPreview[] = [];
  for (const event of items) {
    if (!event || typeof event !== "object") continue;
    const startObj = (event as any).start && typeof (event as any).start === "object" ? (event as any).start : {};
    const endObj = (event as any).end && typeof (event as any).end === "object" ? (event as any).end : {};
    const start = startObj.dateTime || startObj.date || "";
    const end = endObj.dateTime || endObj.date || "";

    simplified.push({
      id: (event as any).id ?? null,
      summary: (event as any).summary ?? "(No title)",
      start,
      end,
      htmlLink: (event as any).htmlLink ?? null,
      hangoutLink: (event as any).hangoutLink ?? null,
      selfResponseStatus: selfResponseStatus((event as any).attendees),
    });

    if (simplified.length >= maxResults) break;
  }

  return simplified;
}

async function getCalendarEvent(token: string, eventId: string): Promise<any> {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`);
  url.searchParams.set("maxAttendees", "50");
  return await googleApiGetJson<any>(url.toString(), token);
}

function pickSelfAttendeeEmail(event: any): string {
  const attendees = event?.attendees;
  if (Array.isArray(attendees)) {
    for (const attendee of attendees) {
      if (attendee?.self === true && attendee?.email) return String(attendee.email);
    }
  }

  const organizer = event?.organizer;
  if (organizer?.self === true && organizer?.email) return String(organizer.email);
  return "";
}

export async function respondToCalendarEvent(
  eventId: string,
  responseStatus: "accepted" | "declined" | "tentative",
  sendUpdates: "none" | "externalOnly" | "all" = "none"
): Promise<void> {
  // Avoid interactive auth inside the popup (it may close). Ask user to sign in via the dedicated tab.
  const token = await getGoogleAccessToken(false);

  const event = await getCalendarEvent(token, eventId);
  const email = pickSelfAttendeeEmail(event);
  if (!email) throw new Error("Could not determine your attendee email for this event.");

  if (!event?.start || !event?.end) throw new Error("Event is missing start/end.");

  const updateUrl = new URL(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`);
  updateUrl.searchParams.set("sendUpdates", sendUpdates);

  const body = {
    start: event.start,
    end: event.end,
    attendeesOmitted: true,
    attendees: [{ email, responseStatus }],
  };

  await googleApiPutJson<any>(updateUrl.toString(), token, body);
}
