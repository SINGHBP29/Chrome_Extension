import { useEffect, useRef, useState } from "react";
import { closeExtensionTab } from "@/utils/chromeHelper";
import { Send, Sparkles, Brain, Database, ArrowLeft, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FilterSidebar, Meeting } from "@/components/meeting/FilterSidebar";
import { persistedGet, persistedSet } from "@/utils/persistedState";
import {
  notifySearchFinished,
  notifySearchStarted,
  requestUiLeaveCheck,
} from "@/utils/leaveNotifications";
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

const initialMessages: Message[] = [];

type EmployeeRow = {
  employee_id?: string;
  name?: string;
  email?: string;
  department?: string;
  designation?: string;
  location?: string;
  type?: string;
  client?: string;
  total_employees?: number;
};

const MeetingPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [employeeRows, setEmployeeRows] = useState<EmployeeRow[] | null>(null);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [isEmployeeSearching, setIsEmployeeSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hydratedRef = useRef(false);
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputPrefilledRef = useRef(false);
  const STORAGE_KEY = "teamAssistant.meetingPageState.v1";

  useEffect(() => {
    (async () => {
      const stored = await persistedGet<{
        messages?: unknown;
        input?: unknown;
        employeeQuery?: unknown;
        employeeRows?: unknown;
      }>(STORAGE_KEY);

      if (stored) {
        if (Array.isArray(stored.messages)) setMessages(stored.messages as Message[]);
        if (!inputPrefilledRef.current && typeof stored.input === "string") setInput(stored.input);
        if (typeof stored.employeeQuery === "string") setEmployeeQuery(stored.employeeQuery);
        if (Array.isArray(stored.employeeRows) || stored.employeeRows === null) {
          setEmployeeRows(stored.employeeRows as EmployeeRow[] | null);
        }
      }

      hydratedRef.current = true;
    })();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "hidden") return;
      void requestUiLeaveCheck("meeting_page_hidden");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;

    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = setTimeout(() => {
      void persistedSet(STORAGE_KEY, {
        messages: messages.slice(-30),
        input,
        employeeQuery,
        employeeRows: Array.isArray(employeeRows) ? employeeRows.slice(0, 20) : employeeRows,
        updatedAt: Date.now(),
      });
    }, 300);

    return () => {
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    };
  }, [employeeQuery, employeeRows, input, messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (!q) return;

    inputPrefilledRef.current = true;
    setInput(q);
    textareaRef.current?.focus();

    const next = new URLSearchParams(searchParams);
    next.delete("q");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const clearEmployeeSearch = () => {
    setEmployeeQuery("");
    setEmployeeRows(null);
    setEmployeeError(null);
  };

  const handleEmployeeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = employeeQuery.trim();
    if (!content || isEmployeeSearching) return;

    setIsEmployeeSearching(true);
    setEmployeeError(null);
    void notifySearchStarted("employees", content);

    let ok = false;
    try {
      const response = await fetch("http://localhost:8000/api/employees/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: content }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail ?? "Employee search failed.");
      }

      const data = await response.json();
      setEmployeeRows(Array.isArray(data.rows) ? data.rows : []);
      ok = true;
    } catch (error) {
      console.error(error);
      setEmployeeRows(null);
      setEmployeeError(error instanceof Error ? error.message : "Employee search failed.");
    } finally {
      void notifySearchFinished("employees", content, ok);
      setIsEmployeeSearching(false);
    }
  };

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isThinking) return;

    void notifySearchStarted("meetings", content);
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsThinking(true);

    let ok = false;
    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: content }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch from API");
      }
      
      const data = await response.json();
      ok = true;
      
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Here's what I found across your recent meetings.",
        timestamp: new Date().toISOString(),
        response: {
          summary: data.response,
          highlights: [],
          people: [],
          actionItems: [],
          source: { title: "Meeting Intelligence", date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
        },
      };
      setMessages((m) => [...m, aiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error connecting to the orchestrator backend.",
        timestamp: new Date().toISOString(),
        response: {
          summary: "Error communicating with the API. Please ensure the backend is running.",
          highlights: [],
          people: [],
          actionItems: [],
          source: { title: "System Error", date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
        },
      };
      setMessages((m) => [...m, errorMsg]);
    } finally {
      void notifySearchFinished("meetings", content, ok);
      setIsThinking(false);
    }
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
              onClick={() => closeExtensionTab()}
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
              {/* Employee search (Postgres) */}
              <div className="mb-3 rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-soft">
                <div className="flex items-center justify-between gap-3 px-4 pt-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground">
                      Employee search <span className="text-muted-foreground">(Postgres)</span>
                    </span>
                  </div>
                  {(employeeRows !== null || employeeError) && (
                    <button
                      type="button"
                      onClick={clearEmployeeSearch}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-smooth"
                      aria-label="Clear employee search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <form onSubmit={handleEmployeeSearch} className="px-4 pb-3 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={employeeQuery}
                        onChange={(e) => setEmployeeQuery(e.target.value)}
                        placeholder="Search employees (e.g. interns in Bangalore, email of Priya Sharma)..."
                        className="h-10 pl-9"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="secondary"
                      className="h-10 px-4"
                      disabled={!employeeQuery.trim() || isEmployeeSearching}
                    >
                      {isEmployeeSearching ? "Searching..." : "Search"}
                    </Button>
                  </div>

                  {employeeError && (
                    <p className="mt-2 text-xs text-destructive">
                      {employeeError}
                    </p>
                  )}

                  {employeeRows && (
                    <div className="mt-3 rounded-xl border border-border bg-background/60">
                      <div className="max-h-52 overflow-auto p-3 space-y-2">
                        {employeeRows.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No employees found.
                          </p>
                        ) : employeeRows[0]?.total_employees !== undefined ? (
                          <p className="text-sm font-semibold">
                            Total employees: {employeeRows[0].total_employees}
                          </p>
                        ) : (
                          employeeRows.map((row, idx) => (
                            <div
                              key={row.employee_id ?? row.email ?? idx}
                              className="rounded-lg border border-border bg-card p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-foreground">
                                    {row.name ?? "Unknown"}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {row.email}
                                  </p>
                                </div>
                                {row.employee_id && (
                                  <span className="shrink-0 text-[10px] px-2 py-1 rounded-full border border-border bg-secondary/40 text-muted-foreground">
                                    {row.employee_id}
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                                {row.department && (
                                  <span className="px-2 py-1 rounded-full border border-border bg-background">
                                    {row.department}
                                  </span>
                                )}
                                {row.designation && (
                                  <span className="px-2 py-1 rounded-full border border-border bg-background">
                                    {row.designation}
                                  </span>
                                )}
                                {row.location && (
                                  <span className="px-2 py-1 rounded-full border border-border bg-background">
                                    {row.location}
                                  </span>
                                )}
                                {row.type && (
                                  <span className="px-2 py-1 rounded-full border border-border bg-background">
                                    {row.type}
                                  </span>
                                )}
                                {row.client && (
                                  <span className="px-2 py-1 rounded-full border border-border bg-background">
                                    {row.client}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </form>
              </div>

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
