import { useState } from "react";
import { Check } from "lucide-react";

const filters = ["Bangalore", "Interns", "Data Science"];

export const FilterChips = () => {
  const [active, setActive] = useState<string[]>(["Bangalore"]);

  const toggle = (f: string) => {
    setActive((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  return (
    <section className="px-4">
      <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Filters
      </h2>
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => {
          const isActive = active.includes(f);
          return (
            <button
              key={f}
              onClick={() => toggle(f)}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
                isActive
                  ? "border-primary/30 bg-primary-soft text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/20 hover:text-foreground"
              }`}
            >
              {isActive && <Check className="h-3 w-3" strokeWidth={3} />}
              {f}
            </button>
          );
        })}
      </div>
    </section>
  );
};
