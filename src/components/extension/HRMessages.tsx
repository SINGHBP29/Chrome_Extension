import { MessageSquare, Gift, HeartPulse } from "lucide-react";

const messages = [
  {
    icon: Gift,
    title: "Annual bonus letter",
    description: "Available in your HR portal",
    time: "2 hrs ago",
    tone: "text-primary bg-primary-soft",
  },
  {
    icon: HeartPulse,
    title: "Wellness check-in",
    description: "Complete by end of week",
    time: "Yesterday",
    tone: "text-[hsl(var(--success))] bg-[hsl(var(--success)/0.12)]",
  },
];

export const HRMessages = () => {
  return (
    <section className="px-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          HR Messages
        </h2>
        <button className="flex items-center gap-1 text-[10px] font-medium text-primary transition-opacity hover:opacity-70">
          <MessageSquare className="h-3 w-3" />
          Inbox
        </button>
      </div>
      <div className="space-y-1.5">
        {messages.map((m, i) => {
          const Icon = m.icon;
          return (
            <button
              key={i}
              className="flex w-full items-start gap-2.5 rounded-lg border border-transparent bg-card p-2.5 text-left shadow-soft transition-all hover:border-border hover:bg-secondary/40"
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
                <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
                  {m.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
