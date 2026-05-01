export type EmployeeRow = {
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

type OrchestratorChatResponse = { response?: string };
type OrchestratorEmployeeSearchResponse = { rows?: EmployeeRow[] };

function isExtensionRuntime(): boolean {
  const chromeAny = (globalThis as any).chrome;
  return !!chromeAny?.runtime?.id || globalThis.location?.protocol === "chrome-extension:";
}

function joinUrl(base: string, path: string): string {
  const cleanBase = (base || "").replace(/\/+$/, "");
  if (!cleanBase) return path;
  return `${cleanBase}${path}`;
}

function orchestratorBaseUrl(): string {
  const configured = (import.meta as any)?.env?.VITE_ORCHESTRATOR_BASE_URL;
  const configuredStr = typeof configured === "string" ? configured.trim() : "";

  // Extension (chrome-extension://...): needs absolute URL to the backend.
  if (isExtensionRuntime()) return configuredStr || "http://localhost:8000";

  // Web/Docker/Vite dev: use same-origin so nginx/vite proxy can route /api.
  return configuredStr || "";
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const url = joinUrl(orchestratorBaseUrl(), path);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.ok) return (await res.json()) as T;

  const data = await res.json().catch(() => null);
  const message = data?.detail || data?.message || "Request failed.";
  throw new Error(String(message));
}

export async function searchEmployees(query: string): Promise<EmployeeRow[]> {
  const data = await postJson<OrchestratorEmployeeSearchResponse>("/api/employees/search", { query });
  return Array.isArray(data?.rows) ? data.rows : [];
}

export async function chatMeetings(query: string): Promise<string> {
  const data = await postJson<OrchestratorChatResponse>("/api/chat", { query });
  return typeof data?.response === "string" ? data.response : "";
}
