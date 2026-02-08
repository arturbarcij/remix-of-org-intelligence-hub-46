import { motion } from "framer-motion";
import { actions, ActionItem, ToolType } from "@/data/mockData";
import { 
  MessageSquare, FileText, BarChart3, Github, Mail, 
  ToggleLeft, ToggleRight, Volume2, VolumeX, Clock, 
  ChevronDown, ChevronUp, UserMinus
} from "lucide-react";
import { useState } from "react";

interface ActionPanelProps {
  isVisible: boolean;
}

const toolIcons: Record<ToolType, typeof MessageSquare> = {
  slack: MessageSquare,
  notion: FileText,
  linear: BarChart3,
  github: Github,
  gmail: Mail,
};

const toolColors: Record<ToolType, string> = {
  slack: "var(--tool-slack)",
  notion: "var(--tool-notion)",
  linear: "var(--tool-linear)",
  github: "var(--tool-github)",
  gmail: "var(--tool-gmail)",
};

type RoutingMode = "amplify" | "normal" | "restrict" | "delay";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const routingModes: { value: RoutingMode; icon: typeof Volume2; label: string; color: string }[] = [
  { value: "amplify", icon: Volume2, label: "Amplify", color: "var(--accent)" },
  { value: "normal", icon: MessageSquare, label: "Normal", color: "var(--muted-foreground)" },
  { value: "restrict", icon: VolumeX, label: "Restrict", color: "var(--intent-risk)" },
  { value: "delay", icon: Clock, label: "Delay", color: "var(--intent-conflict)" },
];

const excludeRecommendations: Record<string, string[]> = {
  a1: ["Sales Team", "External Partners"],
  a2: ["Mobile Team"],
  a3: [],
  a4: ["Customer Success"],
  a5: ["Marketing"],
};

function ActionCard({ action }: { action: ActionItem }) {
  const [confirmed, setConfirmed] = useState(!action.requiresConfirmation);
  const [routingMode, setRoutingMode] = useState<RoutingMode>("normal");
  const [showExcludes, setShowExcludes] = useState(false);
  const [delayHours, setDelayHours] = useState(2);
  const Icon = toolIcons[action.tool];
  const color = `hsl(${toolColors[action.tool]})`;
  const excludes = excludeRecommendations[action.id] || [];

  const currentRouting = routingModes.find(m => m.value === routingMode)!;

  return (
    <motion.div variants={itemVariants} className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: `${color}15` }}>
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <div>
            <div className="text-xs font-medium text-foreground capitalize">{action.tool}</div>
            <div className="text-[10px] text-muted-foreground">{action.stakeholder}</div>
          </div>
        </div>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
            action.priority === "high"
              ? "bg-intent-risk/15 text-intent-risk"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          {action.priority}
        </span>
      </div>

      <div className="text-xs text-muted-foreground mb-2">{action.reason}</div>

      <div className="rounded-md bg-muted/50 border border-border p-2.5 mb-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Preview</div>
        <div className="text-[11px] font-mono text-foreground whitespace-pre-line leading-relaxed">
          {action.preview}
        </div>
      </div>

      {/* Routing Controls */}
      <div className="border-t border-border pt-3 mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Routing</span>
          <div className="flex items-center gap-1">
            {routingModes.map((mode) => {
              const ModeIcon = mode.icon;
              const isActive = routingMode === mode.value;
              return (
                <button
                  key={mode.value}
                  onClick={() => setRoutingMode(mode.value)}
                  className={`
                    p-1.5 rounded-md transition-all text-[10px]
                    ${isActive 
                      ? "text-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }
                  `}
                  style={isActive ? { 
                    backgroundColor: `hsl(${mode.color} / 0.15)`,
                    color: `hsl(${mode.color})`
                  } : {}}
                  title={mode.label}
                >
                  <ModeIcon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Delay settings */}
        {routingMode === "delay" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-center gap-2 pt-1"
          >
            <Clock className="w-3 h-3 text-intent-conflict" />
            <span className="text-[10px] text-muted-foreground">Delay:</span>
            <select
              value={delayHours}
              onChange={(e) => setDelayHours(Number(e.target.value))}
              className="text-[10px] bg-secondary border border-border rounded px-1.5 py-0.5 text-foreground"
            >
              <option value={1}>1 hour</option>
              <option value={2}>2 hours</option>
              <option value={4}>4 hours</option>
              <option value={8}>Next day</option>
              <option value={24}>24 hours</option>
            </select>
          </motion.div>
        )}

        {/* Exclude recommendations */}
        {excludes.length > 0 && (
          <div>
            <button
              onClick={() => setShowExcludes(!showExcludes)}
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <UserMinus className="w-3 h-3" />
              <span>Exclude recommendations ({excludes.length})</span>
              {showExcludes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showExcludes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-2 flex flex-wrap gap-1"
              >
                {excludes.map((ex) => (
                  <span
                    key={ex}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-intent-risk/10 text-intent-risk border border-intent-risk/20"
                  >
                    {ex}
                  </span>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {action.requiresConfirmation && (
        <button
          onClick={() => setConfirmed(!confirmed)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 pt-3 border-t border-border w-full"
        >
          {confirmed ? (
            <ToggleRight className="w-4 h-4 text-primary" />
          ) : (
            <ToggleLeft className="w-4 h-4" />
          )}
          <span>Human confirmation {confirmed ? "approved" : "required"}</span>
        </button>
      )}
    </motion.div>
  );
}

export default function ActionPanel({ isVisible }: ActionPanelProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <motion.div variants={itemVariants}>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-1">Action Routing</h2>
        <p className="text-xs text-muted-foreground">
          Suggested actions across {new Set(actions.map((a) => a.tool)).size} tools • Amplify, restrict, or delay
        </p>
      </motion.div>

      <div className="grid gap-3">
        {actions.map((action) => (
          <ActionCard key={action.id} action={action} />
        ))}
      </div>
    </motion.div>
  );
}
