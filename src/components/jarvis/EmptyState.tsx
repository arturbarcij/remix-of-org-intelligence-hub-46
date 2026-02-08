import { motion } from "framer-motion";
import { Inbox, AlertCircle, Radio, Wifi, WifiOff } from "lucide-react";

type EmptyStateType = "no-signal" | "insufficient-data" | "processing" | "no-conflicts" | "offline";

interface EmptyStateProps {
  type: EmptyStateType;
  className?: string;
}

const stateConfig: Record<EmptyStateType, {
  icon: typeof Inbox;
  title: string;
  description: string;
  color: string;
}> = {
  "no-signal": {
    icon: Inbox,
    title: "No signal selected",
    description: "Select a signal from the ingest panel to begin analysis",
    color: "text-muted-foreground",
  },
  "insufficient-data": {
    icon: AlertCircle,
    title: "Insufficient signal data",
    description: "The selected signal doesn't contain enough structured information for analysis. Try a different signal with more context.",
    color: "text-intent-fyi",
  },
  "processing": {
    icon: Radio,
    title: "Processing signal",
    description: "JARVIS is analyzing the signal and extracting structured understanding...",
    color: "text-primary",
  },
  "no-conflicts": {
    icon: Wifi,
    title: "No conflicts detected",
    description: "The Critic Agent found no contradictions in the current organizational state.",
    color: "text-intent-task",
  },
  "offline": {
    icon: WifiOff,
    title: "Connection interrupted",
    description: "Unable to connect to the organizational graph. Retrying...",
    color: "text-intent-risk",
  },
};

export default function EmptyState({ type, className = "" }: EmptyStateProps) {
  const config = stateConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center text-center py-8 px-4 ${className}`}
    >
      <div className={`p-3 rounded-xl bg-secondary/50 mb-3 ${config.color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">{config.title}</h3>
      <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">{config.description}</p>
      
      {type === "processing" && (
        <motion.div
          className="mt-4 flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      )}

      {type === "offline" && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          Retry connection
        </motion.button>
      )}
    </motion.div>
  );
}
