// ─── Types ────────────────────────────────────────────────────

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

export interface ExtractedEntity {
  name: string;
  role?: string;
  citation: string;
}

export interface Classification {
  primary: { intent: IntentType; confidence: number };
  secondary: { intent: IntentType; confidence: number }[];
  people: ExtractedEntity[];
  teams: ExtractedEntity[];
  topics: ExtractedEntity[];
  systems: ExtractedEntity[];
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

export interface TruthChange {
  field: string;
  from?: string;
  to: string;
  reason: string;
  owner: string;
}

export interface TruthVersion {
  version: number;
  timestamp: string;
  changes: TruthChange[];
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

// ─── Signals ──────────────────────────────────────────────────

export const signals: Signal[] = [
  {
    id: "slack-1",
    type: "slack",
    title: "#leadership-sync",
    source: "David Chen, VP Engineering",
    timestamp: "2 min ago",
    content: `Just got off the phone with Acme Corp. They're pushing the API migration deadline from March 15 to February 28. Sarah from Platform thinks we can make it if we pull two engineers from the mobile team, but Marcus hasn't signed off on this yet. We need to decide by end of week.\n\nAlso — the SOC2 audit findings came back. Three critical items directly overlap with the migration work. Compliance is flagging this as a blocker.\n\nCan someone set up a decision meeting for Thursday?`,
  },
  {
    id: "meeting-1",
    type: "meeting",
    title: "Q1 Infrastructure Planning",
    source: "Engineering All-Hands",
    timestamp: "1 hr ago",
    content: `Key outcomes from today's planning session: Database migration to Aurora approved for March. Budget allocation of $240K confirmed by finance. Open item — hiring plan for SRE team still pending CTO approval. Timeline risk flagged if hiring delayed past February.\n\nAction items assigned to platform and infrastructure leads.`,
  },
  {
    id: "email-1",
    type: "email",
    title: "RE: Q1 Budget Reallocation",
    source: "CFO to CTO",
    timestamp: "45 min ago",
    content: `Following up on our conversation — the mobile team budget needs reallocation. $150K from delayed contractor spend can be redirected to API migration acceleration. This requires your sign-off by Monday.\n\nNote: this may conflict with the hiring plan we discussed for the SRE team. We should align before committing.`,
  },
  {
    id: "screenshot-1",
    type: "screenshot",
    title: "Competitor Alert — Apex Corp",
    source: "Market Intelligence Feed",
    timestamp: "20 min ago",
    content: `BREAKING: Apex Corp announces enterprise API platform launching Q2 2025. Key features include automated migration tooling, SOC2-compliant by default, and white-glove onboarding. Three of our top-10 accounts have been contacted.\n\nSales team flagging increased urgency on our API migration timeline and competitive positioning.`,
  },
];

// ─── Classification ──────────────────────────────────────────

export const classification: Classification = {
  primary: { intent: "decision", confidence: 0.91 },
  secondary: [
    { intent: "risk", confidence: 0.84 },
    { intent: "task", confidence: 0.78 },
    { intent: "conflict", confidence: 0.72 },
  ],
  people: [
    { name: "David Chen", role: "VP Engineering", citation: "Just got off the phone with Acme Corp" },
    { name: "Sarah Okafor", role: "Platform Lead", citation: "Sarah from Platform thinks we can make it" },
    { name: "Marcus Rivera", role: "Mobile Lead", citation: "Marcus hasn't signed off on this yet" },
  ],
  teams: [
    { name: "Platform Engineering", citation: "Sarah from Platform thinks we can make it" },
    { name: "Mobile Engineering", citation: "pull two engineers from the mobile team" },
    { name: "Security & Compliance", citation: "SOC2 audit findings came back" },
  ],
  topics: [
    { name: "API Migration", citation: "API migration deadline from March 15 to February 28" },
    { name: "SOC2 Audit", citation: "SOC2 audit findings came back. Three critical items" },
    { name: "Resource Allocation", citation: "pull two engineers from the mobile team" },
  ],
  systems: [
    { name: "API Gateway", citation: "API migration deadline" },
    { name: "Compliance Platform", citation: "Compliance is flagging this as a blocker" },
  ],
};

// ─── Graph ───────────────────────────────────────────────────

export const graphBefore: GraphState = {
  nodes: [
    { id: "api-migration", label: "API Migration", type: "topic", x: 350, y: 200 },
    { id: "platform-team", label: "Platform", type: "team", x: 160, y: 150 },
    { id: "mobile-team", label: "Mobile", type: "team", x: 540, y: 150 },
    { id: "david-chen", label: "David Chen", type: "person", x: 120, y: 300 },
    { id: "sarah-okafor", label: "Sarah Okafor", type: "person", x: 220, y: 70 },
    { id: "marcus-rivera", label: "Marcus Rivera", type: "person", x: 530, y: 300 },
  ],
  edges: [
    { id: "e1", source: "sarah-okafor", target: "platform-team" },
    { id: "e2", source: "platform-team", target: "api-migration" },
    { id: "e3", source: "api-migration", target: "mobile-team" },
    { id: "e4", source: "david-chen", target: "platform-team" },
    { id: "e5", source: "marcus-rivera", target: "mobile-team" },
  ],
};

export const graphAfter: GraphState = {
  nodes: [
    ...graphBefore.nodes,
    { id: "deadline-decision", label: "Deadline Decision", type: "decision", x: 350, y: 55, isNew: true },
    { id: "soc2-audit", label: "SOC2 Audit", type: "system", x: 200, y: 370, isNew: true },
    { id: "resource-realloc", label: "Resource Realloc", type: "task", x: 480, y: 370, isNew: true },
    { id: "security-team", label: "Security", type: "team", x: 80, y: 400, isNew: true },
  ],
  edges: [
    ...graphBefore.edges,
    { id: "e6", source: "deadline-decision", target: "api-migration", label: "Feb 28", isNew: true },
    { id: "e7", source: "deadline-decision", target: "david-chen", label: "decides", isNew: true },
    { id: "e8", source: "soc2-audit", target: "api-migration", label: "blocks", isNew: true, edgeType: "conflict" },
    { id: "e9", source: "soc2-audit", target: "security-team", isNew: true },
    { id: "e10", source: "resource-realloc", target: "mobile-team", label: "2 engineers", isNew: true, edgeType: "dependency" },
    { id: "e11", source: "resource-realloc", target: "platform-team", isNew: true, edgeType: "dependency" },
  ],
};

// ─── Truth Versions ──────────────────────────────────────────

export const truthVersions: TruthVersion[] = [
  {
    version: 1,
    timestamp: "Feb 3, 2025 09:00",
    changes: [
      { field: "API Migration Target", to: "March 15, 2025", reason: "Initial planning", owner: "David Chen" },
      { field: "Platform Team Allocation", to: "Full team assigned", reason: "Q1 roadmap", owner: "Sarah Okafor" },
    ],
  },
  {
    version: 2,
    timestamp: "Feb 7, 2025 14:32",
    changes: [
      { field: "API Migration Target", from: "March 15, 2025", to: "February 28, 2025", reason: "Acme Corp request", owner: "David Chen" },
      { field: "Resource Dependency", to: "2 engineers from Mobile team required", reason: "Accelerated timeline", owner: "Sarah Okafor" },
      { field: "Risk: SOC2 Overlap", to: "3 critical audit items block migration", reason: "Audit findings", owner: "Compliance" },
      { field: "Decision Required", to: "Engineer reallocation by Friday", reason: "Marcus Rivera approval pending", owner: "David Chen" },
    ],
  },
];

// ─── Conflicts ───────────────────────────────────────────────

export const conflicts: Conflict[] = [
  {
    id: "c1",
    title: "Engineer Reallocation Disagreement",
    sourceA: {
      person: "Sarah Okafor",
      claim: "Assumes mobile engineers can be reassigned to meet the accelerated timeline",
    },
    sourceB: {
      person: "Marcus Rivera",
      claim: "Has not approved the reassignment; mobile roadmap commitments may be at risk",
    },
    severity: "high",
    suggestedResolution:
      "Schedule alignment meeting between Sarah and Marcus before Thursday decision meeting. Quantify mobile roadmap impact of 2-week engineer reallocation.",
  },
];

// ─── Actions ─────────────────────────────────────────────────

export const actions: ActionItem[] = [
  {
    id: "a1",
    tool: "slack",
    stakeholder: "Marcus Rivera",
    reason: "Needs to approve engineer reallocation before Thursday decision meeting",
    context: "Mobile lead who hasn't signed off on the resource transfer",
    preview:
      "Hi Marcus — David flagged the API migration timeline change. We need your input on temporarily reassigning 2 engineers to Platform. Can you confirm availability for Thursday's decision meeting?",
    requiresConfirmation: true,
    priority: "high",
  },
  {
    id: "a2",
    tool: "linear",
    stakeholder: "Platform Team",
    reason: "SOC2 audit impact needs formal tracking and prioritization",
    context: "Three critical audit items overlap with migration work",
    preview:
      "Task: Assess SOC2 audit impact on API migration timeline\nPriority: High\nAssignee: Sarah Okafor\nDue: Feb 10",
    requiresConfirmation: false,
    priority: "high",
  },
  {
    id: "a3",
    tool: "notion",
    stakeholder: "Leadership Team",
    reason: "Migration timeline doc needs to reflect new deadline and risks",
    context: "Central source of truth for API migration project",
    preview:
      "Update: API Migration Timeline\n- Deadline: March 15 -> February 28\n- New section: Risk Assessment (SOC2 overlap)\n- New section: Resource Dependencies",
    requiresConfirmation: false,
    priority: "medium",
  },
  {
    id: "a4",
    tool: "gmail",
    stakeholder: "David Chen",
    reason: "VP needs consolidated summary of all identified risks and dependencies",
    context: "Requested decision meeting setup; needs full picture",
    preview:
      "Subject: API Migration — Decision Brief\n\nSummary of identified dependencies, risks, and recommended actions for Thursday's decision meeting.",
    requiresConfirmation: true,
    priority: "medium",
  },
  {
    id: "a5",
    tool: "github",
    stakeholder: "Engineering",
    reason: "SOC2 compliance items need to be tracked in the codebase",
    context: "Three critical items overlap with API migration PRs",
    preview:
      "Issue: SOC2 compliance items overlapping with API migration\nLabels: compliance, api-migration, blocking\nMilestone: Q1 2025",
    requiresConfirmation: false,
    priority: "medium",
  },
];

// ─── Executive Query ─────────────────────────────────────────

export const execQueryResponse: QueryResponse = {
  summary:
    "The API migration deadline has been accelerated by 2 weeks at Acme Corp's request. This creates a resource conflict between Platform and Mobile teams, complicated by SOC2 audit findings that overlap with migration work. A decision meeting is needed by Thursday.",
  stakeholders: [
    { name: "Marcus Rivera", impact: "Needs to approve engineer reallocation", action: "Slack message sent for confirmation" },
    { name: "Sarah Okafor", impact: "Leading accelerated migration effort", action: "Linear task created for SOC2 assessment" },
    { name: "David Chen", impact: "Decision owner for timeline and resources", action: "Email brief prepared for Thursday" },
    { name: "Compliance Team", impact: "SOC2 findings may block migration", action: "Escalation tracked in GitHub" },
  ],
  pendingActions: 5,
  riskLevel: "High",
};

// ─── Pipeline Steps ──────────────────────────────────────────

export const pipelineSteps = [
  { id: 0, label: "Ingest", description: "Capture signal" },
  { id: 1, label: "Classify", description: "Extract intent" },
  { id: 2, label: "Map", description: "Update graph" },
  { id: 3, label: "Verify", description: "Source of truth" },
  { id: 4, label: "Detect", description: "Find conflicts" },
  { id: 5, label: "Route", description: "Suggest actions" },
  { id: 6, label: "Brief", description: "Executive query" },
];
