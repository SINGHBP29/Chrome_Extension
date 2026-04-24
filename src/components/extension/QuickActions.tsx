import { Brain, Clock, Briefcase, Globe, LucideIcon } from "lucide-react";

type Action = {
  label: string;
  icon: LucideIcon;
  url: string;
  tone: "primary" | "success" | "info" | "warning";
};

const actions: Action[] = [
  { label: "Meeting Intelligence", icon: Brain, url: "https://meetings.internal", tone: "primary" },
  { label: "Submit Timesheet", icon: Clock, url: "https://timesheet.internal", tone: "success" },
  { label: "Open OpenAir", icon: Briefcase, url: "https://openair.internal", tone: "info" },
  { label: "Open Fieldglass", icon: Globe, url: "https://fieldglass.internal", tone: "warning" },
];

const toneStyles: Record<Action["tone"], string> = {
  primary: "bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground",
  success: "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))] group-hover:bg-[hsl(var(--success))] group-hover:text-white",
  info: "bg-[hsl(var(--info)/0.12)] text-[hsl(var(--info))] group-hover:bg-[hsl(var(--info))] group-hover:text-white",
  warning: "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))] group-hover:bg-[hsl(var(--warning))] group-hover:text-white",
};

export const QuickActions = () => {
  return (
    <section className="px-4">
      <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => window.open(action.url, "_blank")}
              className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-2.5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-pop"
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${toneStyles[action.tone]}`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              <span className="text-[12px] font-medium leading-tight text-foreground">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
