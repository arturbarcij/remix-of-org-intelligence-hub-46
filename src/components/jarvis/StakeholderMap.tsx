import { motion } from "framer-motion";
import { Users, ArrowRight, MessageSquare, Mail, Video } from "lucide-react";

interface StakeholderMapProps {
  isVisible: boolean;
}

interface Stakeholder {
  id: string;
  name: string;
  role: string;
  team: string;
  reachability: "high" | "medium" | "low";
  lastContact: string;
  preferredChannel: "slack" | "email" | "meeting";
}

interface CommunicationFlow {
  from: string;
  to: string;
  frequency: "high" | "medium" | "low";
  lastMessage: string;
}

const stakeholders: Stakeholder[] = [
  { id: "david", name: "David Chen", role: "VP Engineering", team: "Engineering", reachability: "high", lastContact: "2 min ago", preferredChannel: "slack" },
  { id: "sarah", name: "Sarah Okafor", role: "Platform Lead", team: "Platform", reachability: "high", lastContact: "1 hr ago", preferredChannel: "slack" },
  { id: "marcus", name: "Marcus Rivera", role: "Mobile Lead", team: "Mobile", reachability: "medium", lastContact: "4 hrs ago", preferredChannel: "meeting" },
  { id: "compliance", name: "Compliance Team", role: "Security & Compliance", team: "Security", reachability: "medium", lastContact: "Yesterday", preferredChannel: "email" },
];

const communicationFlows: CommunicationFlow[] = [
  { from: "david", to: "sarah", frequency: "high", lastMessage: "API migration discussion" },
  { from: "sarah", to: "marcus", frequency: "medium", lastMessage: "Resource request" },
  { from: "david", to: "compliance", frequency: "low", lastMessage: "SOC2 audit review" },
  { from: "marcus", to: "david", frequency: "medium", lastMessage: "Timeline concerns" },
];

const channelIcons = {
  slack: MessageSquare,
  email: Mail,
  meeting: Video,
};

const frequencyColors = {
  high: "bg-intent-task",
  medium: "bg-intent-fyi",
  low: "bg-muted-foreground",
};

const reachabilityColors = {
  high: "text-intent-task",
  medium: "text-intent-fyi",
  low: "text-muted-foreground",
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function StakeholderMap({ isVisible }: StakeholderMapProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <motion.div variants={itemVariants}>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-1">Stakeholder Map</h2>
        <p className="text-xs text-muted-foreground">Communication patterns and reachability</p>
      </motion.div>

      {/* Stakeholder grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2">
        {stakeholders.map((stakeholder) => {
          const ChannelIcon = channelIcons[stakeholder.preferredChannel];
          return (
            <motion.div
              key={stakeholder.id}
              variants={itemVariants}
              className="rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs font-medium text-foreground">{stakeholder.name}</div>
                  <div className="text-[10px] text-muted-foreground">{stakeholder.role}</div>
                </div>
                <div className="p-1 rounded bg-secondary">
                  <ChannelIcon className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono ${reachabilityColors[stakeholder.reachability]}`}>
                  {stakeholder.reachability} reachability
                </span>
                <span className="text-[10px] text-muted-foreground">{stakeholder.lastContact}</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Communication flows */}
      <motion.div variants={itemVariants} className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Communication Flows
          </span>
        </div>
        
        <div className="space-y-1.5">
          {communicationFlows.map((flow, i) => {
            const fromStakeholder = stakeholders.find(s => s.id === flow.from);
            const toStakeholder = stakeholders.find(s => s.id === flow.to);
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${frequencyColors[flow.frequency]}`} />
                <span className="text-[11px] text-foreground font-medium">{fromStakeholder?.name.split(' ')[0]}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-[11px] text-foreground font-medium">{toStakeholder?.name.split(' ')[0]}</span>
                <span className="text-[10px] text-muted-foreground ml-auto truncate max-w-[120px]">{flow.lastMessage}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Legend */}
      <motion.div variants={itemVariants} className="flex gap-4 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-intent-task" />
          <span>High freq</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-intent-fyi" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
          <span>Low</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
