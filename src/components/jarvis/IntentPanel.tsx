import { motion } from "framer-motion";
import { classification as mockClassification } from "@/data/mockData";
import type { Classification, IntentType } from "@/lib/api";
import { Target, AlertTriangle, CheckSquare, Info, Zap } from "lucide-react";

const intentConfig: Record<IntentType, { icon: typeof Target; label: string; colorClass: string }> = {
  decision: { icon: Target, label: "Decision", colorClass: "bg-intent-decision/15 text-intent-decision border-intent-decision/30" },
  task: { icon: CheckSquare, label: "Task", colorClass: "bg-intent-task/15 text-intent-task border-intent-task/30" },
  fyi: { icon: Info, label: "FYI", colorClass: "bg-intent-fyi/15 text-intent-fyi border-intent-fyi/30" },
  risk: { icon: AlertTriangle, label: "Risk", colorClass: "bg-intent-risk/15 text-intent-risk border-intent-risk/30" },
  conflict: { icon: Zap, label: "Conflict", colorClass: "bg-intent-conflict/15 text-intent-conflict border-intent-conflict/30" },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

interface IntentPanelProps {
  isVisible: boolean;
  classification?: Classification | null;
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground">{Math.round(value * 100)}%</span>
    </div>
  );
}

function EntityTag({ entity }: { entity: { name: string; role?: string; citation: string } }) {
  return (
    <div className="group relative">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-xs text-foreground border border-border hover:border-primary/30 transition-colors cursor-default">
        {entity.name}
        {entity.role && <span className="text-muted-foreground text-[10px]">({entity.role})</span>}
      </span>
      <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-popover border border-border rounded-md text-[10px] text-muted-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 max-w-xs truncate">
        "{entity.citation}"
      </div>
    </div>
  );
}

export default function IntentPanel({ isVisible, classification: propClassification }: IntentPanelProps) {
  if (!isVisible) return null;

  const classification = propClassification ?? mockClassification;
  const { primary, secondary, people, teams, topics, systems } = classification;
  const primaryConfig = intentConfig[primary.intent] ?? intentConfig.fyi;
  const PrimaryIcon = primaryConfig.icon;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <motion.div variants={itemVariants}>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-1">Intent Classification</h2>
        <p className="text-xs text-muted-foreground">Structured understanding of the signal</p>
      </motion.div>

      {/* Primary Intent */}
      <motion.div variants={itemVariants} className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Primary Intent</span>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg border ${primaryConfig.colorClass}`}>
            <PrimaryIcon className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">{primaryConfig.label}</div>
            <ConfidenceBar value={primary.confidence} />
          </div>
        </div>
      </motion.div>

      {/* Secondary Intents */}
      <motion.div variants={itemVariants} className="flex gap-2">
        {secondary.map((s) => {
          const config = intentConfig[s.intent] ?? intentConfig.fyi;
          const Icon = config.icon;
          return (
            <div key={s.intent} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${config.colorClass}`}>
              <Icon className="w-3 h-3" />
              <span>{config.label}</span>
              <span className="font-mono text-[10px] opacity-70">{Math.round(s.confidence * 100)}%</span>
            </div>
          );
        })}
      </motion.div>

      {/* Extracted Entities */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">People</div>
          <div className="flex flex-wrap gap-1.5">
            {people.map((p) => <EntityTag key={p.name} entity={p} />)}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Teams</div>
          <div className="flex flex-wrap gap-1.5">
            {teams.map((t) => <EntityTag key={t.name} entity={t} />)}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Topics</div>
          <div className="flex flex-wrap gap-1.5">
            {topics.map((t) => <EntityTag key={t.name} entity={t} />)}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Systems Affected</div>
          <div className="flex flex-wrap gap-1.5">
            {systems.map((s) => <EntityTag key={s.name} entity={s} />)}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
