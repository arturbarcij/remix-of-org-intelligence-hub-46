import { motion, AnimatePresence } from "framer-motion";
import { graphBefore, graphAfter, GraphNode, GraphEdge, NodeType } from "@/data/mockData";
import { useState } from "react";
import { X, Filter, MessageSquare, Clock, Users } from "lucide-react";

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

// Mock node details for popups
const nodeDetails: Record<string, { description: string; lastActivity: string; connections: number }> = {
  "david-chen": { description: "VP Engineering, decision owner for API migration", lastActivity: "2 min ago", connections: 4 },
  "sarah-okafor": { description: "Platform Lead, driving accelerated timeline", lastActivity: "1 hr ago", connections: 3 },
  "marcus-rivera": { description: "Mobile Lead, approval pending for engineer reallocation", lastActivity: "45 min ago", connections: 2 },
  "api-migration": { description: "Core Q1 initiative, deadline accelerated to Feb 28", lastActivity: "Active", connections: 6 },
  "platform-team": { description: "8 engineers, assigned to migration work", lastActivity: "1 hr ago", connections: 3 },
  "mobile-team": { description: "6 engineers, 2 may be reallocated", lastActivity: "2 hr ago", connections: 2 },
  "deadline-decision": { description: "Critical decision required by Thursday", lastActivity: "New", connections: 2 },
  "soc2-audit": { description: "3 critical findings overlap with migration", lastActivity: "New", connections: 2 },
  "resource-realloc": { description: "2 engineers from Mobile to Platform", lastActivity: "New", connections: 2 },
  "security-team": { description: "Compliance and security oversight", lastActivity: "New", connections: 1 },
};

// Mock edge details
const edgeDetails: Record<string, { lastComm: string; frequency: string; channel: string }> = {
  "e1": { lastComm: "1 hr ago", frequency: "Daily", channel: "Slack" },
  "e2": { lastComm: "2 hr ago", frequency: "Weekly", channel: "Meeting" },
  "e3": { lastComm: "1 day ago", frequency: "Weekly", channel: "Email" },
  "e4": { lastComm: "30 min ago", frequency: "Daily", channel: "Slack" },
  "e5": { lastComm: "45 min ago", frequency: "Daily", channel: "Slack" },
  "e6": { lastComm: "2 min ago", frequency: "New", channel: "Signal" },
  "e7": { lastComm: "2 min ago", frequency: "New", channel: "Signal" },
  "e8": { lastComm: "1 hr ago", frequency: "Blocking", channel: "Audit" },
  "e9": { lastComm: "1 hr ago", frequency: "New", channel: "Email" },
  "e10": { lastComm: "Pending", frequency: "New", channel: "Decision" },
  "e11": { lastComm: "Pending", frequency: "New", channel: "Decision" },
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

interface NodePopupProps {
  node: GraphNode;
  onClose: () => void;
}

function NodePopup({ node, onClose }: NodePopupProps) {
  const details = nodeDetails[node.id] || { description: "No details available", lastActivity: "Unknown", connections: 0 };
  const color = `hsl(${nodeColors[node.type]})`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      className="absolute z-50 w-56 rounded-lg border border-border bg-card shadow-lg overflow-hidden"
      style={{ left: Math.min(node.x, 400), top: node.y + 40 }}
    >
      <div className="flex items-center justify-between p-3 border-b border-border" style={{ backgroundColor: `${color}10` }}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
          <span className="text-xs font-medium text-foreground">{node.label}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-secondary">
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
      <div className="p-3 space-y-2">
        <p className="text-[11px] text-muted-foreground leading-relaxed">{details.description}</p>
        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{details.lastActivity}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{details.connections} connections</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface EdgeTooltipProps {
  edge: GraphEdge;
  x: number;
  y: number;
}

function EdgeTooltip({ edge, x, y }: EdgeTooltipProps) {
  const details = edgeDetails[edge.id] || { lastComm: "Unknown", frequency: "Unknown", channel: "Unknown" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute z-40 px-2.5 py-1.5 rounded-md bg-popover border border-border shadow-md"
      style={{ left: x, top: y }}
    >
      <div className="flex items-center gap-2 text-[10px]">
        <MessageSquare className="w-3 h-3 text-muted-foreground" />
        <span className="text-muted-foreground">{details.channel}</span>
        <span className="text-foreground font-mono">{details.frequency}</span>
        <span className="text-muted-foreground">• {details.lastComm}</span>
      </div>
    </motion.div>
  );
}

function NodeShape({
  node,
  isNew,
  isFiltered,
  onClick,
}: {
  node: GraphNode;
  isNew: boolean;
  isFiltered: boolean;
  onClick: () => void;
}) {
  const color = `hsl(${nodeColors[node.type]})`;
  const shape = nodeShapes[node.type];
  const opacity = isFiltered ? 0.2 : 1;

  return (
    <motion.g
      initial={isNew ? { scale: 0, opacity: 0 } : { scale: 1, opacity }}
      animate={{ scale: 1, opacity }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: isNew ? 0.3 : 0 }}
      style={{ cursor: "pointer" }}
      onClick={onClick}
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

      {/* Hover ring */}
      <circle
        cx={node.x}
        cy={node.y}
        r={28}
        fill="transparent"
        className="hover:fill-primary/5 transition-colors"
      />

      {shape === "circle" ? (
        <circle
          cx={node.x}
          cy={node.y}
          r={22}
          fill={`hsl(${nodeColors[node.type]} / 0.12)`}
          stroke={color}
          strokeWidth={isNew ? 2 : 1.5}
          className="hover:stroke-[2.5px] transition-all"
        />
      ) : shape === "diamond" ? (
        <polygon
          points={`${node.x},${node.y - 22} ${node.x + 22},${node.y} ${node.x},${node.y + 22} ${node.x - 22},${node.y}`}
          fill={`hsl(${nodeColors[node.type]} / 0.12)`}
          stroke={color}
          strokeWidth={isNew ? 2 : 1.5}
          className="hover:stroke-[2.5px] transition-all"
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
          className="hover:stroke-[2.5px] transition-all"
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
  onHover,
  onLeave,
}: {
  edge: GraphEdge;
  nodes: GraphNode[];
  isNew: boolean;
  onHover: (e: React.MouseEvent) => void;
  onLeave: () => void;
}) {
  const source = nodes.find((n) => n.id === edge.source);
  const target = nodes.find((n) => n.id === edge.target);
  if (!source || !target) return null;

  const path = getEdgePath(source, target);
  const isConflict = edge.edgeType === "conflict";

  return (
    <motion.g onMouseEnter={onHover} onMouseLeave={onLeave} style={{ cursor: "pointer" }}>
      {/* Wider invisible hitbox for hover */}
      <path d={path} fill="none" stroke="transparent" strokeWidth={12} />
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
        className="hover:stroke-primary hover:stroke-[2px] transition-all"
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
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<{ edge: GraphEdge; x: number; y: number } | null>(null);
  const [filter, setFilter] = useState<NodeType | "all">("all");

  if (!isVisible) return null;

  const graph = showAfter ? graphAfter : graphBefore;
  const nodeTypes: NodeType[] = ["person", "team", "topic", "decision", "task", "system"];

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
            {showAfter ? "Updated organizational state" : "Current organizational state"} • Click nodes for details
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter dropdown */}
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-muted-foreground" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as NodeType | "all")}
              className="text-[10px] bg-secondary border border-border rounded px-1.5 py-0.5 text-foreground"
            >
              <option value="all">All types</option>
              {nodeTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
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

      <div className="rounded-lg border border-border bg-card overflow-hidden relative">
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
              onHover={(e) => {
                const source = graph.nodes.find(n => n.id === edge.source);
                const target = graph.nodes.find(n => n.id === edge.target);
                if (source && target) {
                  setHoveredEdge({ 
                    edge, 
                    x: (source.x + target.x) / 2, 
                    y: (source.y + target.y) / 2 + 10 
                  });
                }
              }}
              onLeave={() => setHoveredEdge(null)}
            />
          ))}

          {/* Nodes */}
          {graph.nodes.map((node) => (
            <NodeShape
              key={node.id}
              node={node}
              isNew={!!node.isNew && showAfter}
              isFiltered={filter !== "all" && node.type !== filter}
              onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
            />
          ))}
        </svg>

        {/* Node popup */}
        <AnimatePresence>
          {selectedNode && (
            <NodePopup node={selectedNode} onClose={() => setSelectedNode(null)} />
          )}
        </AnimatePresence>

        {/* Edge tooltip */}
        <AnimatePresence>
          {hoveredEdge && (
            <EdgeTooltip edge={hoveredEdge.edge} x={hoveredEdge.x} y={hoveredEdge.y} />
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        {nodeTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(filter === type ? "all" : type)}
            className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-colors ${
              filter === type ? "bg-secondary" : "hover:bg-secondary/50"
            }`}
          >
            <div
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: `hsl(${nodeColors[type]})` }}
            />
            <span className="capitalize">{type}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
