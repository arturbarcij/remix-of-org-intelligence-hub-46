import { motion, AnimatePresence } from "framer-motion";
import { Brain, Database, Shield, GitBranch, Sparkles } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  role: string;
  icon: typeof Brain;
  color: string;
  thinkingSteps: string[];
}

interface AgentThinkingProps {
  currentStep: number;
  isVisible: boolean;
}

const agents: Agent[] = [
  {
    id: "ingest",
    name: "Perception",
    role: "Signal capture & parsing",
    icon: Sparkles,
    color: "var(--primary)",
    thinkingSteps: [
      "Detecting signal source type...",
      "Extracting raw content from Slack message",
      "Identifying speaker: David Chen, VP Engineering",
      "Timestamp parsed: 2 minutes ago",
    ],
  },
  {
    id: "classify",
    name: "Understanding",
    role: "Intent classification",
    icon: Brain,
    color: "var(--intent-decision)",
    thinkingSteps: [
      "Running NLU pipeline on extracted text",
      "Primary intent: DECISION (91% confidence)",
      "Secondary signals: RISK, TASK, CONFLICT",
      "Extracting entities: 3 people, 2 teams, 3 topics",
    ],
  },
  {
    id: "memory",
    name: "Memory",
    role: "Knowledge graph update",
    icon: Database,
    color: "var(--node-topic)",
    thinkingSteps: [
      "Querying existing graph for related nodes",
      "Found: API Migration, Platform Team, Mobile Team",
      "Creating new nodes: Deadline Decision, SOC2 Audit",
      "Linking edges with dependency types",
    ],
  },
  {
    id: "truth",
    name: "Historian",
    role: "Source of truth versioning",
    icon: GitBranch,
    color: "var(--accent)",
    thinkingSteps: [
      "Loading current truth version (v1)",
      "Detecting 4 field changes from signal",
      "Computing diff: timeline, resources, risks, decisions",
      "Creating v2 with full audit trail",
    ],
  },
  {
    id: "critic",
    name: "Critic",
    role: "Conflict detection",
    icon: Shield,
    color: "var(--intent-conflict)",
    thinkingSteps: [
      "Cross-referencing claims across sources",
      "Detected: Sarah assumes, Marcus hasn't approved",
      "Severity assessment: HIGH (blocks decision)",
      "Generating resolution recommendation",
    ],
  },
  {
    id: "coordinator",
    name: "Coordinator",
    role: "Action routing",
    icon: GitBranch,
    color: "var(--tool-slack)",
    thinkingSteps: [
      "Mapping stakeholders to required actions",
      "Selecting optimal channels per recipient",
      "Prioritizing: Marcus (high), Sarah (high), David (medium)",
      "Drafting contextual messages for each tool",
    ],
  },
  {
    id: "executive",
    name: "Executive",
    role: "Synthesis & briefing",
    icon: Sparkles,
    color: "var(--primary)",
    thinkingSteps: [
      "Aggregating all agent outputs",
      "Computing risk level: HIGH",
      "Generating executive summary",
      "Ready for natural language query",
    ],
  },
];

const stepToAgentIndex: Record<number, number> = {
  0: 0, // Ingest -> Perception
  1: 1, // Classify -> Understanding
  2: 2, // Map -> Memory
  3: 3, // Verify -> Historian
  4: 4, // Detect -> Critic
  5: 5, // Route -> Coordinator
  6: 6, // Brief -> Executive
};

export default function AgentThinking({ currentStep, isVisible }: AgentThinkingProps) {
  if (!isVisible || currentStep < 0) return null;

  const agentIndex = stepToAgentIndex[currentStep] ?? 0;
  const agent = agents[agentIndex];
  const Icon = agent.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-lg border border-border bg-card overflow-hidden"
    >
      {/* Agent header */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-muted/30">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="p-1.5 rounded-md"
          style={{ backgroundColor: `hsl(${agent.color} / 0.15)` }}
        >
          <Icon className="w-4 h-4" style={{ color: `hsl(${agent.color})` }} />
        </motion.div>
        <div className="flex-1">
          <div className="text-xs font-medium text-foreground flex items-center gap-2">
            {agent.name} Agent
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: `hsl(${agent.color})` }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground">{agent.role}</div>
        </div>
        <div className="text-[9px] px-2 py-0.5 rounded-full border font-mono"
          style={{ 
            borderColor: `hsl(${agent.color} / 0.3)`,
            color: `hsl(${agent.color})`,
            backgroundColor: `hsl(${agent.color} / 0.1)`
          }}
        >
          ACTIVE
        </div>
      </div>

      {/* Thinking steps */}
      <div className="p-3 space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
          Reasoning Chain
        </div>
        {agent.thinkingSteps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-start gap-2"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.15 + 0.1 }}
              className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ borderColor: `hsl(${agent.color} / 0.5)` }}
            >
              <span className="text-[8px] font-mono" style={{ color: `hsl(${agent.color})` }}>
                {i + 1}
              </span>
            </motion.div>
            <span className="text-[11px] text-muted-foreground leading-relaxed">{step}</span>
          </motion.div>
        ))}
      </div>

      {/* Agent pipeline visualization */}
      <div className="px-3 pb-3">
        <div className="flex items-center justify-between gap-1 py-2 overflow-x-auto scrollbar-hide">
          {agents.map((a, i) => {
            const isActive = i === agentIndex;
            const isComplete = i < agentIndex;
            const AgentIcon = a.icon;

            return (
              <div key={a.id} className="flex items-center flex-shrink-0">
                <motion.div
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center border transition-all
                    ${isActive ? "border-2" : "border"}
                  `}
                  style={{
                    borderColor: isComplete || isActive ? `hsl(${a.color})` : "hsl(var(--border))",
                    backgroundColor: isActive ? `hsl(${a.color} / 0.15)` : isComplete ? `hsl(${a.color} / 0.1)` : "transparent",
                  }}
                >
                  <AgentIcon
                    className="w-3 h-3"
                    style={{
                      color: isComplete || isActive ? `hsl(${a.color})` : "hsl(var(--muted-foreground) / 0.5)",
                    }}
                  />
                </motion.div>
                {i < agents.length - 1 && (
                  <div
                    className="w-3 h-px mx-0.5"
                    style={{
                      backgroundColor: isComplete ? `hsl(${a.color} / 0.5)` : "hsl(var(--border))",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
