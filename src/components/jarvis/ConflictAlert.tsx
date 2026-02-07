import { motion } from "framer-motion";
import { conflicts } from "@/data/mockData";
import { AlertTriangle, ArrowLeftRight } from "lucide-react";

interface ConflictAlertProps {
  isVisible: boolean;
}

export default function ConflictAlert({ isVisible }: ConflictAlertProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-1">Conflict Detection</h2>
        <p className="text-xs text-muted-foreground">Contradictions identified by the Critic Agent</p>
      </div>

      {conflicts.map((conflict) => (
        <motion.div
          key={conflict.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="rounded-lg border border-intent-conflict/20 bg-intent-conflict/5 p-4"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="p-1.5 rounded-md bg-intent-conflict/15">
              <AlertTriangle className="w-4 h-4 text-intent-conflict" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{conflict.title}</div>
              <div className="text-[10px] text-intent-conflict font-mono uppercase mt-0.5">
                Severity: {conflict.severity}
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-3">
            <div className="rounded-md bg-card border border-border p-3">
              <div className="text-[10px] text-muted-foreground font-mono mb-1">{conflict.sourceA.person}</div>
              <div className="text-xs text-foreground">{conflict.sourceA.claim}</div>
            </div>

            <div className="flex justify-center">
              <ArrowLeftRight className="w-3.5 h-3.5 text-intent-conflict/50" />
            </div>

            <div className="rounded-md bg-card border border-border p-3">
              <div className="text-[10px] text-muted-foreground font-mono mb-1">{conflict.sourceB.person}</div>
              <div className="text-xs text-foreground">{conflict.sourceB.claim}</div>
            </div>
          </div>

          <div className="rounded-md bg-secondary/50 border border-border p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
              Suggested Resolution
            </div>
            <div className="text-xs text-foreground">{conflict.suggestedResolution}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
