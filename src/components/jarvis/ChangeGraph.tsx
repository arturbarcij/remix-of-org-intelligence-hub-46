import { motion } from "framer-motion";
import { GitBranch, Plus, ArrowRight } from "lucide-react";

interface ChangeNode {
  id: string;
  label: string;
  type: "added" | "modified" | "unchanged";
  x: number;
  y: number;
}

interface ChangeEdge {
  from: string;
  to: string;
  isNew: boolean;
}

interface ChangeGraphProps {
  isVisible: boolean;
}

const changeNodes: ChangeNode[] = [
  { id: "migration", label: "API Migration", type: "modified", x: 100, y: 60 },
  { id: "deadline", label: "Deadline", type: "added", x: 200, y: 30 },
  { id: "soc2", label: "SOC2 Audit", type: "added", x: 200, y: 90 },
  { id: "platform", label: "Platform", type: "unchanged", x: 30, y: 40 },
  { id: "mobile", label: "Mobile", type: "unchanged", x: 30, y: 80 },
  { id: "realloc", label: "Resource", type: "added", x: 150, y: 110 },
];

const changeEdges: ChangeEdge[] = [
  { from: "platform", to: "migration", isNew: false },
  { from: "mobile", to: "migration", isNew: false },
  { from: "deadline", to: "migration", isNew: true },
  { from: "soc2", to: "migration", isNew: true },
  { from: "realloc", to: "mobile", isNew: true },
  { from: "realloc", to: "platform", isNew: true },
];

const typeColors = {
  added: "var(--accent)",
  modified: "var(--primary)",
  unchanged: "var(--muted-foreground)",
};

export default function ChangeGraph({ isVisible }: ChangeGraphProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-lg border border-border bg-card overflow-hidden"
    >
      <div className="flex items-center gap-2 p-2 border-b border-border">
        <GitBranch className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-medium text-foreground">Changes Visualized</span>
      </div>
      
      <svg viewBox="0 0 250 130" className="w-full h-auto">
        {/* Edges */}
        {changeEdges.map((edge, i) => {
          const from = changeNodes.find(n => n.id === edge.from);
          const to = changeNodes.find(n => n.id === edge.to);
          if (!from || !to) return null;

          return (
            <motion.line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={edge.isNew ? "hsl(var(--accent))" : "hsl(var(--border))"}
              strokeWidth={edge.isNew ? 1.5 : 1}
              strokeDasharray={edge.isNew ? "none" : "3 2"}
              initial={edge.isNew ? { pathLength: 0 } : {}}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
            />
          );
        })}

        {/* Nodes */}
        {changeNodes.map((node, i) => (
          <motion.g
            key={node.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.08 }}
          >
            {node.type === "added" && (
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="16"
                fill="none"
                stroke={`hsl(${typeColors[node.type]})`}
                strokeWidth="1"
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 1.4 }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
            <circle
              cx={node.x}
              cy={node.y}
              r="12"
              fill={`hsl(${typeColors[node.type]} / 0.15)`}
              stroke={`hsl(${typeColors[node.type]})`}
              strokeWidth={node.type === "unchanged" ? 1 : 1.5}
            />
            <text
              x={node.x}
              y={node.y + 3}
              textAnchor="middle"
              fill={`hsl(${typeColors[node.type]})`}
              fontSize="6"
              fontWeight="500"
              fontFamily="'DM Sans', sans-serif"
            >
              {node.label.slice(0, 6)}
            </text>
          </motion.g>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 p-2 border-t border-border">
        <div className="flex items-center gap-1 text-[9px]">
          <Plus className="w-2.5 h-2.5 text-accent" />
          <span className="text-accent">Added</span>
        </div>
        <div className="flex items-center gap-1 text-[9px]">
          <ArrowRight className="w-2.5 h-2.5 text-primary" />
          <span className="text-primary">Modified</span>
        </div>
        <div className="flex items-center gap-1 text-[9px]">
          <div className="w-2 h-2 rounded-full border border-muted-foreground" />
          <span className="text-muted-foreground">Unchanged</span>
        </div>
      </div>
    </motion.div>
  );
}
