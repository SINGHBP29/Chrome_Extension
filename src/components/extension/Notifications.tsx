import { Bell, Calendar, FileText, Users } from "lucide-react";

const notifications = [
  {
    icon: Calendar,
    title: "Standup in 15 minutes",
    description: "Daily sync with Data Science team",
    time: "10 mins ago",
    tone: "text-primary bg-primary-soft",
  },
  {
    icon: FileText,
    title: "Timesheet pending",
    description: "Submit hours for week 17 by Friday",
    time: "1 hr ago",
    tone: "text-[hsl(var(--warning))] bg-[hsl(var(--warning)/0.12)]",
  },
  {
    icon: Users,
    title: "New intern onboarded",
    description: "Aarav joined the Bangalore team",
    time: "3 hrs ago",
    tone: "text-[hsl(var(--success))] bg-[hsl(var(--success)/0.12)]",
  },
];

export const Notifications = () => {
  return (
    <section className="px-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Notifications
        </h2>
        <button className="flex items-center gap-1 text-[10px] font-medium text-primary transition-opacity hover:opacity-70">
          <Bell className="h-3 w-3" />
          View all
        </button>
      </div>
      <div className="space-y-1.5">
        {notifications.map((n, i) => {
          const Icon = n.icon;
          return (
            <button
              key={i}
              className="flex w-full items-start gap-2.5 rounded-lg border border-transparent bg-card p-2.5 text-left shadow-soft transition-all hover:border-border hover:bg-secondary/40"
            >
              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${n.tone}`}>
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-[12px] font-medium leading-tight text-foreground">
                    {n.title}
                  </p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {n.time}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
                  {n.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
