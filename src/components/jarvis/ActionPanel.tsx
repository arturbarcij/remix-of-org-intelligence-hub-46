import { motion } from "framer-motion";
import { actions, ActionItem, ToolType } from "@/data/mockData";
import { MessageSquare, FileText, BarChart3, Github, Mail, ToggleLeft, ToggleRight } from "lucide-react";
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

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function ActionCard({ action }: { action: ActionItem }) {
  const [confirmed, setConfirmed] = useState(!action.requiresConfirmation);
  const Icon = toolIcons[action.tool];
  const color = `hsl(${toolColors[action.tool]})`;

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

      {action.requiresConfirmation && (
        <button
          onClick={() => setConfirmed(!confirmed)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
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
          Suggested actions across {new Set(actions.map((a) => a.tool)).size} tools
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
