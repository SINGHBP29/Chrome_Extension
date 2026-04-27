import { Copy, ExternalLink, Sparkles, CheckCircle2, Users, ListChecks, FileText, User, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface AIResponse {
  summary: string;
  highlights: string[];
  people?: string[];
  actionItems?: { person: string; task: string }[];
  source?: { title: string; date: string };
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  response?: AIResponse;
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const UserMessage = ({ message }: { message: Message }) => (
  <div className="flex justify-start gap-3 animate-slide-in-left">
    <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
      <User className="w-4 h-4 text-muted-foreground" />
    </div>
    <div className="max-w-[75%] space-y-1.5">
      <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <p className="text-sm text-foreground leading-relaxed">{message.content}</p>
      </div>
      <span className="text-[10px] text-muted-foreground px-2">You · {formatTime(message.timestamp)}</span>
    </div>
  </div>
);

export const AssistantMessage = ({ message }: { message: Message }) => {
  const [copied, setCopied] = useState(false);
  const r = message.response;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex justify-end gap-3 animate-slide-in-right">
      <div className="max-w-[80%] space-y-1.5 w-full">
        <div className="bg-card border border-border rounded-2xl rounded-tr-sm shadow-elegant overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="w-5 h-5 rounded-md bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-xs font-semibold">Meeting Intelligence</span>
            <span className="text-[10px] text-muted-foreground ml-auto">{formatTime(message.timestamp)}</span>
          </div>

          <div className="p-4 space-y-4">
            {/* Summary */}
            {r?.summary && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Summary</h4>
                </div>
                <p className="text-sm leading-relaxed text-foreground">{r.summary}</p>
              </div>
            )}

            {/* Highlights */}
            {r?.highlights && r.highlights.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key highlights</h4>
                </div>
                <ul className="space-y-1.5">
                  {r.highlights.map((h, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed">
                      <span className="text-primary mt-1.5 shrink-0">
                        <span className="block w-1 h-1 rounded-full bg-primary" />
                      </span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* People */}
            {r?.people && r.people.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">People mentioned</h4>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.people.map((p) => (
                    <span
                      key={p}
                      className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground border border-border"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action items */}
            {r?.actionItems && r.actionItems.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <ListChecks className="w-3.5 h-3.5 text-primary" />
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action items</h4>
                </div>
                <div className="space-y-1.5">
                  {r.actionItems.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center shrink-0">
                        {a.person.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{a.person}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{a.task}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
            {r?.source ? (
              <a
                href="#"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="truncate max-w-[200px]">{r.source.title}</span>
                <span className="text-muted-foreground">· {r.source.date}</span>
              </a>
            ) : (
              <span />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy response
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
        <Sparkles className="w-4 h-4 text-primary-foreground" />
      </div>
    </div>
  );
};

export const TypingIndicator = () => (
  <div className="flex justify-end gap-3 animate-fade-in">
    <div className="bg-card border border-border rounded-2xl rounded-tr-sm px-5 py-4 shadow-sm">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "0s" }} />
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
        <span className="text-xs text-muted-foreground ml-2">Analyzing meetings...</span>
      </div>
    </div>
    <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
      <Sparkles className="w-4 h-4 text-primary-foreground" />
    </div>
  </div>
);
