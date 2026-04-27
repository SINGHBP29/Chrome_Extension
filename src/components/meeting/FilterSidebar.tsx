import { Users, Tag, Sparkles, Clock, MessageSquare, ChevronLeft, CalendarDays } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Meeting {
  id: string;
  name: string;
  date: string;
  type: { label: string; value: string; color: string };
  participants: { name: string; initials: string }[];
}

export const meetingTypeStyles: Record<string, string> = {
  technical: "bg-primary/10 text-primary border-primary/20",
  hr: "bg-accent/10 text-accent-foreground border-accent/20",
  client: "bg-success/10 text-success border-success/20",
  strategy: "bg-muted text-muted-foreground border-border",
};

export const recentMeetings: Meeting[] = [
  {
    id: "m1",
    name: "Product Strategy — Q4 Planning",
    date: "Apr 23, 2026",
    type: { label: "Strategy", value: "strategy", color: meetingTypeStyles.strategy },
    participants: [
      { name: "Sarah Chen", initials: "SC" },
      { name: "Marcus Webb", initials: "MW" },
      { name: "Aisha Patel", initials: "AP" },
      { name: "David Kim", initials: "DK" },
    ],
  },
  {
    id: "m2",
    name: "Weekly Leadership Sync",
    date: "Apr 22, 2026",
    type: { label: "Strategy", value: "strategy", color: meetingTypeStyles.strategy },
    participants: [
      { name: "Sarah Chen", initials: "SC" },
      { name: "David Kim", initials: "DK" },
      { name: "Elena Rossi", initials: "ER" },
    ],
  },
  {
    id: "m3",
    name: "Engineering Sync — AI Search",
    date: "Apr 21, 2026",
    type: { label: "Technical", value: "technical", color: meetingTypeStyles.technical },
    participants: [
      { name: "Aisha Patel", initials: "AP" },
      { name: "David Kim", initials: "DK" },
      { name: "Marcus Webb", initials: "MW" },
    ],
  },
  {
    id: "m4",
    name: "Acme Demo & Feedback",
    date: "Apr 19, 2026",
    type: { label: "Client", value: "client", color: meetingTypeStyles.client },
    participants: [
      { name: "Sarah Chen", initials: "SC" },
      { name: "Elena Rossi", initials: "ER" },
    ],
  },
  {
    id: "m5",
    name: "HR Review — Q2 Hiring",
    date: "Apr 18, 2026",
    type: { label: "HR", value: "hr", color: meetingTypeStyles.hr },
    participants: [
      { name: "Aisha Patel", initials: "AP" },
      { name: "Marcus Webb", initials: "MW" },
    ],
  },
  {
    id: "m6",
    name: "Northwind Renewal Discussion",
    date: "Apr 17, 2026",
    type: { label: "Client", value: "client", color: meetingTypeStyles.client },
    participants: [
      { name: "Sarah Chen", initials: "SC" },
      { name: "David Kim", initials: "DK" },
    ],
  },
];

const recentQueries = [
  "What were the key decisions from Q3 planning?",
  "Action items assigned to Sarah last month",
  "Client feedback from Acme demo",
  "Engineering roadmap discussions",
];

interface FilterSidebarProps {
  selectedMeeting: Meeting | null;
  onSelectMeeting: (m: Meeting | null) => void;
  onSelectQuery: (q: string) => void;
}

export const FilterSidebar = ({
  selectedMeeting,
  onSelectMeeting,
  onSelectQuery,
}: FilterSidebarProps) => {
  return (
    <aside className="w-72 shrink-0 border-r border-border bg-card/40 backdrop-blur-xl hidden lg:flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-7">
          {!selectedMeeting ? (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Recent meetings</h3>
              </div>
              <div className="space-y-1.5">
                {recentMeetings.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSelectMeeting(m)}
                    className="w-full text-left p-3 rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-smooth group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-smooth">
                        {m.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${m.type.color}`}
                      >
                        {m.type.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {m.date}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <>
              <button
                onClick={() => onSelectMeeting(null)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-smooth"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back to meetings
              </button>

              <section>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Selected meeting</h3>
                </div>
                <div className="p-3 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
                  <p className="text-sm font-semibold leading-tight mb-1.5">
                    {selectedMeeting.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {selectedMeeting.date}
                  </p>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Meeting type</h3>
                </div>
                <span
                  className={`inline-block text-xs px-3 py-1.5 rounded-full border font-medium ${selectedMeeting.type.color}`}
                >
                  {selectedMeeting.type.label}
                </span>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Participants</h3>
                </div>
                <div className="space-y-1.5">
                  {selectedMeeting.participants.map((p) => (
                    <div
                      key={p.name}
                      className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg bg-background border border-border"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-[10px] font-semibold shrink-0">
                        {p.initials}
                      </div>
                      <span className="text-sm flex-1">{p.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Recent queries */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Recent queries</h3>
            </div>
            <div className="space-y-1.5">
              {recentQueries.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onSelectQuery(q)}
                  className="w-full text-left text-xs text-muted-foreground hover:text-foreground bg-background hover:bg-muted border border-border hover:border-primary/30 rounded-lg px-3 py-2.5 transition-smooth line-clamp-2"
                >
                  {q}
                </button>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold">Pro tip</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {selectedMeeting
            ? "Ask a question — answers will be drawn from this meeting."
            : "Pick a meeting, or just ask — the AI will pick the best match."}
        </p>
      </div>
    </aside>
  );
};
