import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Brain, Database, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FilterSidebar, Meeting } from "@/components/meeting/FilterSidebar";
import {
  AssistantMessage,
  Message,
  TypingIndicator,
  UserMessage,
} from "@/components/meeting/ChatMessage";

const suggestedPrompts = [
  "Summarize last week's engineering sync",
  "What action items were assigned to me?",
  "Decisions made about Q4 roadmap",
  "Client feedback from Acme demo",
];

const initialMessages: Message[] = [
  {
    id: "1",
    role: "user",
    content: "What were the key takeaways from yesterday's product strategy meeting?",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "2",
    role: "assistant",
    content:
      "Yesterday's product strategy meeting focused on Q4 priorities, with the team aligning on three core initiatives: AI search, mobile redesign, and enterprise SSO.",
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    response: {
      summary:
        "Yesterday's product strategy meeting focused on Q4 priorities, with the team aligning on three core initiatives: AI search, mobile redesign, and enterprise SSO. Budget was approved for two additional engineering hires.",
      highlights: [
        "AI-powered search will be the flagship Q4 feature, targeting a December beta launch.",
        "Mobile redesign scoped down to iOS-first, Android to follow in Q1.",
        "Enterprise SSO blocked on legal review of SAML compliance — Marcus to follow up.",
        "Two new senior engineering roles approved, starting recruitment next week.",
      ],
      people: ["Sarah Chen", "Marcus Webb", "Aisha Patel", "David Kim"],
      actionItems: [
        { person: "Sarah Chen", task: "Draft AI search PRD by Friday and circulate for review." },
        { person: "Marcus Webb", task: "Sync with legal on SAML compliance timeline." },
        { person: "Aisha Patel", task: "Open two senior engineer roles on the careers page." },
      ],
      source: { title: "Product Strategy — Q4 Planning", date: "Apr 23, 2026" },
    },
  },
];

const MeetingPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSend = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isThinking) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsThinking(true);

    setTimeout(() => {
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Here's what I found across your recent meetings.",
        timestamp: new Date().toISOString(),
        response: {
          summary:
            "Based on the last 4 meetings matching your filters, the team has been focused on shipping the AI search beta and resolving outstanding client escalations from Acme and Northwind.",
          highlights: [
            "AI search beta is on track for Dec 12 with 3 design iterations completed.",
            "Acme escalation resolved after dedicated war-room session on Tuesday.",
            "Northwind renewal signals positive — proposal due end of week.",
            "Engineering capacity flagged as tight through November.",
          ],
          people: ["Sarah Chen", "David Kim", "Elena Rossi"],
          actionItems: [
            { person: "Sarah Chen", task: "Send Northwind renewal proposal by Friday." },
            { person: "David Kim", task: "Publish AI search beta changelog draft." },
          ],
          source: { title: "Weekly Leadership Sync", date: "Apr 22, 2026" },
        },
      };
      setMessages((m) => [...m, aiMsg]);
      setIsThinking(false);
    }, 1600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background bg-gradient-mesh flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/70 backdrop-blur-xl sticky top-0 z-20">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-1.5 hover:bg-secondary rounded-lg transition-smooth"
              title="Back to extension"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Meeting <span className="text-gradient">Intelligence</span>
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Ask anything about past meetings, summaries, and discussions
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded-full px-3 py-1.5">
            <Database className="w-3.5 h-3.5 text-success" />
            <span className="font-medium">247 meetings indexed</span>
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <FilterSidebar
          selectedMeeting={selectedMeeting}
          onSelectMeeting={setSelectedMeeting}
          onSelectQuery={(q) => {
            setInput(q);
            textareaRef.current?.focus();
          }}
        />

        {/* Chat area */}
        <main className="flex-1 flex flex-col min-w-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
              {messages.map((m) =>
                m.role === "user" ? (
                  <UserMessage key={m.id} message={m} />
                ) : (
                  <AssistantMessage key={m.id} message={m} />
                )
              )}
              {isThinking && <TypingIndicator />}
            </div>
          </div>

          {/* Suggested prompts */}
          {messages.length <= 2 && !isThinking && (
            <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Try asking</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSend(p)}
                    className="text-xs px-3 py-2 rounded-full bg-card border border-border hover:border-primary/40 hover:bg-primary/5 transition-smooth text-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-background/0 pt-4 pb-6">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <div className="relative bg-card border border-border rounded-2xl shadow-elegant focus-within:border-primary/50 focus-within:shadow-glow transition-smooth">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about any meeting..."
                  className="w-full resize-none bg-transparent px-5 py-4 pr-14 text-sm placeholder:text-muted-foreground focus:outline-none max-h-40"
                  style={{ minHeight: "56px" }}
                />
                <Button
                  size="icon"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isThinking}
                  className="absolute right-2 bottom-2 h-10 w-10 rounded-xl bg-gradient-primary hover:opacity-90 transition-smooth shadow-md disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Meeting Intelligence searches across 247 indexed meetings · Responses may include summaries from multiple sources
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MeetingPage;
