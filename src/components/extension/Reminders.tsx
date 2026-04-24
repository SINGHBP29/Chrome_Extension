import { useState } from "react";
import { CheckCircle2, Circle, AlarmClock } from "lucide-react";

type Reminder = {
  id: string;
  title: string;
  due: string;
  done: boolean;
};

const initial: Reminder[] = [
  { id: "1", title: "Approve PTO requests", due: "Today, 5:00 PM", done: false },
  { id: "2", title: "Review Q2 OKRs draft", due: "Tomorrow", done: false },
  { id: "3", title: "1:1 with Priya", due: "Thu, 11:00 AM", done: true },
];

export const Reminders = () => {
  const [items, setItems] = useState<Reminder[]>(initial);

  const toggle = (id: string) =>
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r))
    );

  return (
    <section className="px-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Reminders
        </h2>
        <button className="flex items-center gap-1 text-[10px] font-medium text-primary transition-opacity hover:opacity-70">
          <AlarmClock className="h-3 w-3" />
          Add
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map((r) => {
          const Icon = r.done ? CheckCircle2 : Circle;
          return (
            <button
              key={r.id}
              onClick={() => toggle(r.id)}
              className="flex w-full items-center gap-2.5 rounded-lg border border-transparent bg-card p-2.5 text-left shadow-soft transition-all hover:border-border hover:bg-secondary/40"
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  r.done ? "text-[hsl(var(--success))]" : "text-muted-foreground"
                }`}
                strokeWidth={2.5}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-[12px] font-medium leading-tight ${
                    r.done
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }`}
                >
                  {r.title}
                </p>
                <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
                  {r.due}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
