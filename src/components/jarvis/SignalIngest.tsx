import { motion, AnimatePresence } from "framer-motion";
import { signals, Signal } from "@/data/mockData";
import { MessageSquare, Mic, Image, Mail } from "lucide-react";

interface SignalIngestProps {
  selectedSignal: Signal | null;
  onSignalSelect: (signal: Signal) => void;
}

const typeIcons = {
  slack: MessageSquare,
  meeting: Mic,
  screenshot: Image,
  email: Mail,
};

const typeLabels = {
  slack: "Slack Message",
  meeting: "Meeting Transcript",
  screenshot: "Screenshot",
  email: "Email Thread",
};

export default function SignalIngest({ selectedSignal, onSignalSelect }: SignalIngestProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-1">Signal Ingest</h2>
        <p className="text-xs text-muted-foreground">Select a signal to process</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {signals.map((signal) => {
          const Icon = typeIcons[signal.type];
          const isSelected = selectedSignal?.id === signal.id;

          return (
            <motion.button
              key={signal.id}
              onClick={() => onSignalSelect(signal)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200
                border
                ${
                  isSelected
                    ? "border-glow bg-primary/5"
                    : "border-border bg-card hover:border-muted-foreground/20 hover:bg-secondary/50"
                }
              `}
            >
              <div
                className={`p-1.5 rounded-md ${
                  isSelected ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-foreground truncate">{typeLabels[signal.type]}</div>
                <div className="text-[10px] text-muted-foreground truncate mt-0.5">{signal.source}</div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {selectedSignal && (
          <motion.div
            key={selectedSignal.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">{selectedSignal.title}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{selectedSignal.timestamp}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                {typeLabels[selectedSignal.type]}
              </span>
            </div>
            <div className="text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-line">
              {selectedSignal.content}
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-[10px] text-muted-foreground">
                Source: <span className="text-foreground">{selectedSignal.source}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
