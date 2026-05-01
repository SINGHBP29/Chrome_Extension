import { CalendarCheck2, CalendarX2, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/components/ui/use-toast";

import {
  getUpcomingCalendarEvents,
  respondToCalendarEvent,
  type CalendarEventPreview,
} from "@/google_workspace/calendarApi";

type RenderItem = {
  icon: LucideIcon;
  id: string;
  title: string;
  time: string;
  tone: string;
};

export const MeetingApprovals = () => {
  const [events, setEvents] = useState<CalendarEventPreview[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getUpcomingCalendarEvents(15);
        setEvents(data);
      } catch {
        setEvents(null);
      }
    };

    void load();

    const onAuth = () => void load();
    window.addEventListener("google-auth-changed", onAuth);
    return () => window.removeEventListener("google-auth-changed", onAuth);
  }, []);

  const pending: RenderItem[] = useMemo(() => {
    if (!events || events.length === 0) return [];

    const tones = [
      "text-primary bg-primary-soft",
      "text-[hsl(var(--warning))] bg-[hsl(var(--warning)/0.12)]",
    ];

    return events
      .filter((e) => !!e.id && (e.selfResponseStatus || "").toLowerCase() === "needsaction")
      .slice(0, 3)
      .map((e, idx) => {
        const start = e.start ? new Date(e.start) : null;
        const time =
          start && !Number.isNaN(start.getTime())
            ? formatDistanceToNow(start, { addSuffix: true })
            : "Upcoming";

        return {
          icon: CalendarCheck2,
          id: String(e.id),
          title: (e.summary || "").trim() || "Meeting invite",
          time,
          tone: tones[idx % tones.length],
        };
      });
  }, [events]);

  const act = async (eventId: string, action: "accepted" | "declined") => {
    setBusyId(eventId);
    try {
      await respondToCalendarEvent(eventId, action, "none");
      setEvents((prev) =>
        Array.isArray(prev)
          ? prev.map((e) => (e.id === eventId ? { ...e, selfResponseStatus: action } : e))
          : prev
      );
    } catch (error) {
      toast({
        title: "Could not update RSVP",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setBusyId(null);
    }
  };

  if (pending.length === 0) return null;

  return (
    <section className="px-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Meeting Approvals
        </h2>
      </div>

      <div className="space-y-1.5">
        {pending.map((m) => {
          const Icon = m.icon;
          const isBusy = busyId === m.id;
          return (
            <div
              key={m.id}
              className="flex w-full items-start gap-2.5 rounded-lg border border-transparent bg-card p-2.5 text-left shadow-soft"
            >
              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${m.tone}`}>
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-[12px] font-medium leading-tight text-foreground">
                    {m.title}
                  </p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {m.time}
                  </span>
                </div>

                <div className="mt-2 flex gap-2">
                  <button
                    disabled={isBusy}
                    onClick={() => act(m.id, "accepted")}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    <CalendarCheck2 className="h-3 w-3" />
                    Yes
                  </button>
                  <button
                    disabled={isBusy}
                    onClick={() => act(m.id, "declined")}
                    className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[11px] font-semibold text-foreground disabled:opacity-60"
                  >
                    <CalendarX2 className="h-3 w-3" />
                    No
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
