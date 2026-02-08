import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Activity, Clock, ArrowRight, Radio } from "lucide-react";

interface FlowNode {
  id: string;
  name: string;
  type: "source" | "hub" | "recipient";
  reachedAt?: number;
}

interface FlowPath {
  id: string;
  from: string;
  to: string;
  delay: number;
  channel: "slack" | "email" | "meeting" | "document";
}

interface InformationFlowProps {
  isVisible: boolean;
}

const flowNodes: FlowNode[] = [
  { id: "signal", name: "Signal Source", type: "source" },
  { id: "david", name: "David Chen", type: "hub", reachedAt: 0 },
  { id: "sarah", name: "Sarah Okafor", type: "recipient", reachedAt: 1 },
  { id: "marcus", name: "Marcus Rivera", type: "recipient", reachedAt: 2 },
  { id: "compliance", name: "Compliance", type: "recipient", reachedAt: 4 },
  { id: "platform", name: "Platform Team", type: "recipient", reachedAt: 1.5 },
  { id: "mobile", name: "Mobile Team", type: "recipient" },
];

const flowPaths: FlowPath[] = [
  { id: "p1", from: "signal", to: "david", delay: 0, channel: "slack" },
  { id: "p2", from: "david", to: "sarah", delay: 0.3, channel: "meeting" },
  { id: "p3", from: "david", to: "marcus", delay: 0.5, channel: "slack" },
  { id: "p4", from: "sarah", to: "platform", delay: 0.8, channel: "slack" },
  { id: "p5", from: "sarah", to: "compliance", delay: 1.2, channel: "email" },
];

const channelColors: Record<string, string> = {
  slack: "var(--tool-slack)",
  email: "var(--tool-gmail)",
  meeting: "var(--intent-decision)",
  document: "var(--tool-notion)",
};

const nodePositions: Record<string, { x: number; y: number }> = {
  signal: { x: 50, y: 100 },
  david: { x: 150, y: 100 },
  sarah: { x: 270, y: 60 },
  marcus: { x: 270, y: 140 },
  compliance: { x: 400, y: 30 },
  platform: { x: 400, y: 90 },
  mobile: { x: 400, y: 150 },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function FlowVisualization({ isAnimating }: { isAnimating: boolean }) {
  return (
    <svg viewBox="0 0 480 180" className="w-full h-auto">
      {/* Grid pattern */}
      <defs>
        <pattern id="flowGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border) / 0.2)" strokeWidth="0.5" />
        </pattern>
        {/* Animated gradient for flow lines */}
        <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
          <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <rect width="480" height="180" fill="url(#flowGrid)" />

      {/* Flow paths */}
      {flowPaths.map((path, index) => {
        const from = nodePositions[path.from];
        const to = nodePositions[path.to];
        if (!from || !to) return null;

        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        const pathD = `M ${from.x} ${from.y} Q ${midX} ${midY - 10} ${to.x} ${to.y}`;

        return (
          <motion.g key={path.id}>
            {/* Base path */}
            <path
              d={pathD}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            {/* Animated flow */}
            {isAnimating && (
              <motion.path
                d={pathD}
                fill="none"
                stroke={`hsl(${channelColors[path.channel]})`}
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  delay: path.delay,
                  duration: 0.6,
                  ease: "easeOut",
                }}
              />
            )}
            {/* Pulse particle */}
            {isAnimating && (
              <motion.circle
                r="3"
                fill={`hsl(${channelColors[path.channel]})`}
                initial={{ offsetDistance: "0%" }}
                animate={{ offsetDistance: "100%" }}
                transition={{
                  delay: path.delay,
                  duration: 0.8,
                  ease: "easeInOut",
                }}
                style={{
                  offsetPath: `path('${pathD}')`,
                }}
              />
            )}
          </motion.g>
        );
      })}

      {/* Nodes */}
      {flowNodes.map((node) => {
        const pos = nodePositions[node.id];
        if (!pos) return null;
        const isReached = node.reachedAt !== undefined;
        const isMissing = node.id === "mobile";

        return (
          <motion.g
            key={node.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: (node.reachedAt ?? 0) * 0.3 + 0.2 }}
          >
            {/* Glow ring for reached nodes */}
            {isReached && isAnimating && (
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r="18"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 1.5 }}
                transition={{
                  delay: (node.reachedAt ?? 0) * 0.3 + 0.5,
                  duration: 1,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              />
            )}

            {/* Node circle */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r="14"
              fill={
                isMissing
                  ? "hsl(var(--intent-risk) / 0.1)"
                  : node.type === "source"
                  ? "hsl(var(--primary) / 0.15)"
                  : isReached
                  ? "hsl(var(--accent) / 0.15)"
                  : "hsl(var(--muted) / 0.3)"
              }
              stroke={
                isMissing
                  ? "hsl(var(--intent-risk))"
                  : node.type === "source"
                  ? "hsl(var(--primary))"
                  : isReached
                  ? "hsl(var(--accent))"
                  : "hsl(var(--border))"
              }
              strokeWidth={isMissing ? "2" : "1.5"}
              strokeDasharray={isMissing ? "3 2" : "none"}
            />

            {/* Node label */}
            <text
              x={pos.x}
              y={pos.y + 28}
              textAnchor="middle"
              fill={isMissing ? "hsl(var(--intent-risk))" : "hsl(var(--muted-foreground))"}
              fontSize="8"
              fontFamily="'DM Sans', sans-serif"
            >
              {node.name}
            </text>

            {/* Time indicator */}
            {node.reachedAt !== undefined && (
              <text
                x={pos.x}
                y={pos.y + 3}
                textAnchor="middle"
                fill={node.type === "source" ? "hsl(var(--primary))" : "hsl(var(--foreground))"}
                fontSize="8"
                fontWeight="600"
                fontFamily="'JetBrains Mono', monospace"
              >
                {node.reachedAt === 0 ? "T₀" : `+${node.reachedAt}h`}
              </text>
            )}

            {/* Missing indicator */}
            {isMissing && (
              <text
                x={pos.x}
                y={pos.y + 3}
                textAnchor="middle"
                fill="hsl(var(--intent-risk))"
                fontSize="10"
                fontWeight="bold"
              >
                ?
              </text>
            )}
          </motion.g>
        );
      })}
    </svg>
  );
}

export default function InformationFlow({ isVisible }: InformationFlowProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const t = setTimeout(() => setIsAnimating(true), 500);
      return () => clearTimeout(t);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-heading text-lg font-semibold text-foreground">Information Flow</h2>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Radio className="w-3 h-3 text-primary animate-pulse" />
            <span>Live propagation</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">How understanding spreads through the organization</p>
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-lg border border-border bg-card overflow-hidden">
        <FlowVisualization isAnimating={isAnimating} />
      </motion.div>

      {/* Timeline */}
      <motion.div variants={itemVariants} className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Propagation Timeline
          </span>
        </div>
        <div className="space-y-2">
          {[
            { time: "T₀", event: "Signal received from David Chen", channel: "slack" },
            { time: "+1h", event: "Sarah Okafor briefed in leadership sync", channel: "meeting" },
            { time: "+1.5h", event: "Platform team notified via Slack", channel: "slack" },
            { time: "+2h", event: "Marcus Rivera receives context", channel: "slack" },
            { time: "+4h", event: "Compliance team looped in", channel: "email" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center gap-3"
            >
              <span className="text-[10px] font-mono text-primary w-8">{item.time}</span>
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: `hsl(${channelColors[item.channel]})` }}
              />
              <span className="text-xs text-muted-foreground">{item.event}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Channel legend */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        {Object.entries(channelColors).map(([channel, color]) => (
          <div key={channel} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${color})` }} />
            <span className="capitalize">{channel}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2 text-intent-risk">
          <div className="w-2 h-2 rounded-full border border-dashed border-current" />
          <span>Not reached</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
