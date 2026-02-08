/**
 * JARVIS API client for Organizational Intelligence
 * Uses proxy in dev: /api -> http://localhost:3001
 */
const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

export type IntentType = "decision" | "task" | "fyi" | "risk" | "conflict";
export type ToolType = "slack" | "notion" | "linear" | "github" | "gmail";
export type NodeType = "person" | "team" | "topic" | "decision" | "task" | "system";

export interface Signal {
  id: string;
  type: "slack" | "meeting" | "screenshot" | "email";
  title: string;
  source: string;
  timestamp: string;
  content: string;
}

export interface Classification {
  primary: { intent: IntentType; confidence: number };
  secondary: { intent: IntentType; confidence: number }[];
  people: { name: string; role?: string; citation: string }[];
  teams: { name: string; citation: string }[];
  topics: { name: string; citation: string }[];
  systems: { name: string; citation: string }[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
  isNew?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  isNew?: boolean;
  edgeType?: "normal" | "conflict" | "dependency";
}

export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ProcessResponse {
  signal: string;
  classification: Classification;
  graphBefore: GraphState;
  graphAfter: GraphState;
  conflicts: Conflict[];
  truthVersions: TruthVersion[];
  actions: ActionItem[];
}

export interface TruthVersion {
  version: number;
  timestamp: string;
  changes: { field: string; from?: string; to: string; reason: string; owner: string }[];
}

export interface Conflict {
  id: string;
  title: string;
  sourceA: { person: string; claim: string };
  sourceB: { person: string; claim: string };
  severity: "high" | "medium" | "low";
  suggestedResolution: string;
}

export interface ActionItem {
  id: string;
  tool: ToolType;
  stakeholder: string;
  reason: string;
  context: string;
  preview: string;
  requiresConfirmation: boolean;
  priority: "high" | "medium" | "low";
}

export interface QueryResponse {
  summary: string;
  stakeholders: { name: string; impact: string; action: string }[];
  pendingActions: number;
  riskLevel: string;
}

export const api = {
  getSignals: () => fetchApi<Signal[]>("/signals"),
  addSignal: (signal: Partial<Signal>) =>
    fetchApi<Signal>("/signals", { method: "POST", body: JSON.stringify(signal) }),
  process: (signalId?: string) =>
    fetchApi<ProcessResponse>(`/process${signalId ? `/${signalId}` : ""}`, { method: "POST" }),
  getClassification: (signalId?: string) => fetchApi<Classification>(`/classification${signalId ? `/${signalId}` : ""}`),
  getGraph: () => fetchApi<{ graphBefore: GraphState; graphAfter: GraphState }>("/graph"),
  getTruth: () => fetchApi<TruthVersion[]>("/truth"),
  getConflicts: () => fetchApi<Conflict[]>("/conflicts"),
  getActions: () => fetchApi<ActionItem[]>("/actions"),
  query: (q: string) => fetchApi<QueryResponse>("/query", { method: "POST", body: JSON.stringify({ query: q }) }),
  health: () => fetchApi<{ ok: boolean }>("/health"),
};

export async function isApiAvailable(): Promise<boolean> {
  try {
    const r = await fetch(API_BASE + '/health');
    return r.ok;
  } catch {
    return false;
  }
}
