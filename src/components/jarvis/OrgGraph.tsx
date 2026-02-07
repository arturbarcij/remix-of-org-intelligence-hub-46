import { motion, AnimatePresence } from "framer-motion";
import { graphBefore, graphAfter, GraphNode, GraphEdge, NodeType } from "@/data/mockData";

interface OrgGraphProps {
  showAfter: boolean;
  isVisible: boolean;
}

const nodeColors: Record<NodeType, string> = {
  person: "var(--node-person)",
  team: "var(--node-team)",
  topic: "var(--node-topic)",
  decision: "var(--node-decision)",
  task: "var(--node-task)",
  system: "var(--node-system)",
};

const nodeShapes: Record<NodeType, "circle" | "rect" | "diamond"> = {
  person: "circle",
  team: "rect",
  topic: "rect",
  decision: "diamond",
  task: "rect",
  system: "rect",
};

function getEdgePath(
  sourceNode: GraphNode,
  targetNode: GraphNode
): string {
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const cx = sourceNode.x + dx * 0.5;
  const cy = sourceNode.y + dy * 0.2;
  return `M ${sourceNode.x} ${sourceNode.y} Q ${cx} ${cy} ${targetNode.x} ${targetNode.y}`;
}

function NodeShape({
  node,
  isNew,
}: {
  node: GraphNode;
  isNew: boolean;
}) {
  const color = `hsl(${nodeColors[node.type]})`;
  const shape = nodeShapes[node.type];

  return (
    <motion.g
      initial={isNew ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: isNew ? 0.3 : 0 }}
    >
      {/* Glow for new nodes */}
      {isNew && (
        <motion.circle
          cx={node.x}
          cy={node.y}
          r={32}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
        />
      )}

      {shape === "circle" ? (
        <circle
          cx={node.x}
          cy={node.y}
          r={22}
          fill={`hsl(${nodeColors[node.type]} / 0.12)`}
          stroke={color}
          strokeWidth={isNew ? 2 : 1.5}
        />
      ) : shape === "diamond" ? (
        <polygon
          points={`${node.x},${node.y - 22} ${node.x + 22},${node.y} ${node.x},${node.y + 22} ${node.x - 22},${node.y}`}
          fill={`hsl(${nodeColors[node.type]} / 0.12)`}
          stroke={color}
          strokeWidth={isNew ? 2 : 1.5}
        />
      ) : (
        <rect
          x={node.x - 28}
          y={node.y - 14}
          width={56}
          height={28}
          rx={6}
          fill={`hsl(${nodeColors[node.type]} / 0.12)`}
          stroke={color}
          strokeWidth={isNew ? 2 : 1.5}
        />
      )}

      <text
        x={node.x}
        y={node.y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={9}
        fontFamily="'DM Sans', sans-serif"
        fontWeight={500}
      >
        {node.label.length > 12 ? node.label.slice(0, 11) + ".." : node.label}
      </text>

      {/* Type label below */}
      <text
        x={node.x}
        y={node.y + (shape === "circle" ? 34 : 26)}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={`hsl(${nodeColors[node.type]} / 0.5)`}
        fontSize={7}
        fontFamily="'JetBrains Mono', monospace"
        style={{ textTransform: "uppercase" }}
      >
        {node.type}
      </text>
    </motion.g>
  );
}

function EdgeLine({
  edge,
  nodes,
  isNew,
}: {
  edge: GraphEdge;
  nodes: GraphNode[];
  isNew: boolean;
}) {
  const source = nodes.find((n) => n.id === edge.source);
  const target = nodes.find((n) => n.id === edge.target);
  if (!source || !target) return null;

  const path = getEdgePath(source, target);
  const isConflict = edge.edgeType === "conflict";

  return (
    <motion.g>
      <motion.path
        d={path}
        fill="none"
        stroke={
          isConflict
            ? "hsl(var(--intent-conflict) / 0.5)"
            : isNew
            ? "hsl(var(--primary) / 0.5)"
            : "hsl(var(--border))"
        }
        strokeWidth={isConflict ? 2 : 1.2}
        strokeDasharray={isConflict ? "4 4" : isNew ? "none" : "none"}
        initial={isNew ? { pathLength: 0, opacity: 0 } : {}}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut", delay: isNew ? 0.5 : 0 }}
      />
      {edge.label && (
        <motion.text
          x={(source.x + target.x) / 2}
          y={(source.y + target.y) / 2 - 6}
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          fontSize={7}
          fontFamily="'JetBrains Mono', monospace"
          initial={isNew ? { opacity: 0 } : {}}
          animate={{ opacity: 0.7 }}
          transition={{ delay: isNew ? 1 : 0 }}
        >
          {edge.label}
        </motion.text>
      )}
    </motion.g>
  );
}

export default function OrgGraph({ showAfter, isVisible }: OrgGraphProps) {
  if (!isVisible) return null;

  const graph = showAfter ? graphAfter : graphBefore;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-1">System Graph</h2>
          <p className="text-xs text-muted-foreground">
            {showAfter ? "Updated organizational state" : "Current organizational state"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
              showAfter
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {showAfter ? "AFTER" : "BEFORE"}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <svg viewBox="0 0 660 460" className="w-full" style={{ minHeight: 340 }}>
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="hsl(var(--border) / 0.3)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="660" height="460" fill="url(#grid)" />

          {/* Edges */}
          {graph.edges.map((edge) => (
            <EdgeLine
              key={edge.id}
              edge={edge}
              nodes={graph.nodes}
              isNew={!!edge.isNew && showAfter}
            />
          ))}

          {/* Nodes */}
          {graph.nodes.map((node) => (
            <NodeShape
              key={node.id}
              node={node}
              isNew={!!node.isNew && showAfter}
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        {(["person", "team", "topic", "decision", "task", "system"] as NodeType[]).map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: `hsl(${nodeColors[type]})` }}
            />
            <span className="capitalize">{type}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
