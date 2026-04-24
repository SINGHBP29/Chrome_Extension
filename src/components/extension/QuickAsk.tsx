import { ArrowRight, Search } from "lucide-react";
import { FormEvent, useState } from "react";

export const QuickAsk = () => {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    // Redirect to full chat experience
    window.open(`https://team-assistant.internal/chat?q=${encodeURIComponent(value)}`, "_blank");
  };

  return (
    <form onSubmit={handleSubmit} className="px-4">
      <div className="group relative flex items-center rounded-xl border border-border bg-card shadow-soft transition-all focus-within:border-primary/40 focus-within:shadow-glow">
        <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask about meetings..."
          className="h-10 w-full bg-transparent px-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="mr-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-soft transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
          aria-label="Submit"
        >
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </form>
  );
};
