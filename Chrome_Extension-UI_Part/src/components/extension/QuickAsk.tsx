import { ArrowRight, Brain, Database, Search, X } from "lucide-react";
import { closeExtensionTab } from "@/utils/chromeHelper";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { persistedGet, persistedRemove, persistedSet } from "@/utils/persistedState";

export const QuickAsk = () => {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<"meetings" | "employees">("meetings");
  const [employeeRows, setEmployeeRows] = useState<
    | Array<{
        employee_id?: string;
        name?: string;
        email?: string;
        department?: string;
        designation?: string;
        location?: string;
        type?: string;
        client?: string;
        total_employees?: number;
      }>
    | null
  >(null);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [isEmployeeSearching, setIsEmployeeSearching] = useState(false);

  const hydratedRef = useRef(false);
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const STORAGE_KEY = "teamAssistant.quickAskState.v1";

  useEffect(() => {
    (async () => {
      const stored = await persistedGet<{
        value?: string;
        mode?: "meetings" | "employees";
        employeeRows?: unknown;
      }>(STORAGE_KEY);

      if (stored) {
        if (typeof stored.value === "string") setValue(stored.value);
        if (stored.mode === "employees" || stored.mode === "meetings") setMode(stored.mode);
        if (Array.isArray(stored.employeeRows) || stored.employeeRows === null) {
          setEmployeeRows(stored.employeeRows as typeof employeeRows);
        }
      }

      hydratedRef.current = true;
    })();
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;

    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = setTimeout(() => {
      void persistedSet(STORAGE_KEY, {
        value,
        mode,
        employeeRows: Array.isArray(employeeRows) ? employeeRows.slice(0, 10) : employeeRows,
        updatedAt: Date.now(),
      });
    }, 200);

    return () => {
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    };
  }, [employeeRows, mode, value]);

  const placeholder = useMemo(() => {
    if (mode === "employees") return "Search employees (Postgres)...";
    return "Ask about meetings...";
  }, [mode]);

  const clearEmployeeSearch = () => {
    setEmployeeRows(null);
    setEmployeeError(null);
  };

  const clearPersistedState = () => {
    void persistedRemove(STORAGE_KEY);
  };

  const sendToBackground = (payload: unknown) => {
    try {
      if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return;
      chrome.runtime.sendMessage(payload);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    const query = value.trim();

    if (mode === "meetings") {
      sendToBackground({
        type: "SUPPRESS_LEAVE_NOTIFICATIONS",
        ttlMs: 5000,
        reason: "open_meeting_tab",
      });

      const path = `/meeting?q=${encodeURIComponent(query)}`;
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url: chrome.runtime.getURL(`index.html#${path}`) });
      } else {
        navigate(path);
      }
      return;
    }

    setIsEmployeeSearching(true);
    setEmployeeError(null);
    sendToBackground({ type: "SEARCH_STARTED", mode: "employees", query });
    let ok = false;
    try {
      const response = await fetch("http://localhost:8000/api/employees/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
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
      sendToBackground({
        type: "SEARCH_FINISHED",
        mode: "employees",
        query,
        ok,
      });
      setIsEmployeeSearching(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="inline-flex items-center rounded-full border border-border bg-card p-1 shadow-soft">
          <button
            type="button"
            onClick={() => {
              setMode("meetings");
              clearEmployeeSearch();
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              mode === "meetings"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Brain className="h-3.5 w-3.5" />
            Meetings
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("employees");
              clearEmployeeSearch();
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              mode === "employees"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            Employees
          </button>
        </div>

        {mode === "employees" && (employeeRows !== null || employeeError) && (
          <button
            type="button"
            onClick={() => {
              clearEmployeeSearch();
              setValue("");
              clearPersistedState();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="group relative flex items-center rounded-xl border border-border bg-card shadow-soft transition-all focus-within:border-primary/40 focus-within:shadow-glow">
        <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full bg-transparent px-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="submit"
          disabled={!value.trim() || (mode === "employees" && isEmployeeSearching)}
          className="mr-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-soft transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
          aria-label="Submit"
        >
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>

      {mode === "employees" && (
        <>
          {employeeError && (
            <p className="mt-2 text-[11px] text-destructive">{employeeError}</p>
          )}

          {employeeRows && (
            <div className="mt-3 rounded-xl border border-border bg-card shadow-soft">
              <div className="max-h-44 overflow-auto p-2.5 space-y-2">
                {employeeRows.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">No employees found.</p>
                ) : employeeRows[0]?.total_employees !== undefined ? (
                  <p className="text-sm font-semibold">
                    Total employees: {employeeRows[0].total_employees}
                  </p>
                ) : (
                  employeeRows.slice(0, 5).map((row, idx) => (
                    <div
                      key={row.employee_id ?? row.email ?? idx}
                      className="rounded-lg border border-border bg-background p-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-semibold text-foreground">
                            {row.name ?? "Unknown"}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {row.email ?? "—"}
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
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </form>
  );
};
