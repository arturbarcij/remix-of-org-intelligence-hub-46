import { motion } from "framer-motion";
import { truthVersions as mockTruthVersions } from "@/data/mockData";
import type { TruthVersion } from "@/lib/api";
import { GitBranch, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

interface TruthPanelProps {
  isVisible: boolean;
  truthVersions?: TruthVersion[];
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

export default function TruthPanel({ isVisible, truthVersions: propTruthVersions }: TruthPanelProps) {
  const truthVersions = propTruthVersions ?? mockTruthVersions;
  const [activeVersion, setActiveVersion] = useState(Math.max(0, truthVersions.length - 1));

  useEffect(() => {
    setActiveVersion(Math.max(0, truthVersions.length - 1));
  }, [truthVersions.length]);

  if (!isVisible) return null;

  if (truthVersions.length === 0) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        <motion.div variants={itemVariants}>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-1">Source of Truth</h2>
          <p className="text-xs text-muted-foreground">Versioned organizational state</p>
        </motion.div>
        <motion.div variants={itemVariants} className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground">
          No truth updates yet. Process a signal to create the first version.
        </motion.div>
      </motion.div>
    );
  }

  const currentVersion = truthVersions[activeVersion];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <motion.div variants={itemVariants}>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-1">Source of Truth</h2>
        <p className="text-xs text-muted-foreground">Versioned organizational state</p>
      </motion.div>

      {/* Version selector */}
      <motion.div variants={itemVariants} className="flex gap-2">
        {truthVersions.map((v, i) => (
          <button
            key={v.version}
            onClick={() => setActiveVersion(i)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200
              border
              ${
                i === activeVersion
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30"
              }
            `}
          >
            <GitBranch className="w-3 h-3" />
            v{v.version}
          </button>
        ))}
      </motion.div>

      {/* Changes */}
      <motion.div variants={itemVariants} className="space-y-2">
        <div className="text-[10px] text-muted-foreground font-mono">{currentVersion.timestamp}</div>

        {currentVersion.changes.map((change, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="text-xs font-medium text-foreground mb-1.5">{change.field}</div>

            <div className="flex items-center gap-2 text-[11px]">
              {change.from ? (
                <>
                  <span className="font-mono text-muted-foreground line-through">{change.from}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                  <span className="font-mono text-primary">{change.to}</span>
                </>
              ) : (
                <span className="font-mono text-primary">{change.to}</span>
              )}
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
              <span className="text-[10px] text-muted-foreground">{change.reason}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{change.owner}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
