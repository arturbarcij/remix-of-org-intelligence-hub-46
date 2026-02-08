import { motion } from "framer-motion";
import { AlertTriangle, EyeOff, Copy, Users, ArrowRight, Lightbulb } from "lucide-react";

interface BlindSpot {
  id: string;
  stakeholder: string;
  role: string;
  missingInfo: string;
  impact: "high" | "medium" | "low";
  suggestedAction: string;
}

interface Duplication {
  id: string;
  info: string;
  channels: string[];
  recipients: string[];
  recommendation: string;
}

interface BlindSpotsProps {
  isVisible: boolean;
}

const blindSpots: BlindSpot[] = [
  {
    id: "bs1",
    stakeholder: "Mobile Team",
    role: "Engineering",
    missingInfo: "API migration timeline change and resource reallocation impact",
    impact: "high",
    suggestedAction: "Notify via #mobile-engineering channel before decision meeting",
  },
  {
    id: "bs2",
    stakeholder: "CFO Office",
    role: "Finance",
    missingInfo: "Budget reallocation timeline conflict with SRE hiring plan",
    impact: "medium",
    suggestedAction: "Send briefing email highlighting budget dependencies",
  },
  {
    id: "bs3",
    stakeholder: "Customer Success",
    role: "Client Relations",
    missingInfo: "Acme Corp deadline acceleration and competitive pressure from Apex Corp",
    impact: "medium",
    suggestedAction: "Include in weekly account review meeting",
  },
];

const duplications: Duplication[] = [
  {
    id: "dup1",
    info: "API migration deadline change (Feb 28)",
    channels: ["Slack #leadership-sync", "Email to CTO", "Meeting notes"],
    recipients: ["David Chen (3x)", "Sarah Okafor (2x)"],
    recommendation: "Consolidate to single source of truth in Notion",
  },
  {
    id: "dup2",
    info: "SOC2 audit findings",
    channels: ["Compliance report", "Engineering Slack", "GitHub issue"],
    recipients: ["Platform Team (2x)", "Security (2x)"],
    recommendation: "Link all references to master audit tracker",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const impactColors = {
  high: "bg-intent-risk/15 text-intent-risk border-intent-risk/30",
  medium: "bg-intent-conflict/15 text-intent-conflict border-intent-conflict/30",
  low: "bg-muted text-muted-foreground border-border",
};

export default function BlindSpots({ isVisible }: BlindSpotsProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <motion.div variants={itemVariants}>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-1">Knowledge Gaps</h2>
        <p className="text-xs text-muted-foreground">
          Information silos and duplication detected
        </p>
      </motion.div>

      {/* Blind Spots Section */}
      <motion.div variants={itemVariants} className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 p-3 border-b border-border">
          <EyeOff className="w-3.5 h-3.5 text-intent-risk" />
          <span className="text-xs font-medium text-foreground">Blind Spots</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-intent-risk/15 text-intent-risk font-mono ml-auto">
            {blindSpots.length} detected
          </span>
        </div>
        <div className="divide-y divide-border">
          {blindSpots.map((spot, index) => (
            <motion.div
              key={spot.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="p-3"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <div className="text-xs font-medium text-foreground">{spot.stakeholder}</div>
                    <div className="text-[10px] text-muted-foreground">{spot.role}</div>
                  </div>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase ${impactColors[spot.impact]}`}
                >
                  {spot.impact}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground mb-2 pl-5.5">
                <AlertTriangle className="w-3 h-3 text-intent-risk inline mr-1.5" />
                Missing: {spot.missingInfo}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-primary pl-5.5">
                <Lightbulb className="w-3 h-3" />
                <span>{spot.suggestedAction}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Duplications Section */}
      <motion.div variants={itemVariants} className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 p-3 border-b border-border">
          <Copy className="w-3.5 h-3.5 text-intent-conflict" />
          <span className="text-xs font-medium text-foreground">Information Duplication</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-intent-conflict/15 text-intent-conflict font-mono ml-auto">
            {duplications.length} found
          </span>
        </div>
        <div className="divide-y divide-border">
          {duplications.map((dup, index) => (
            <motion.div
              key={dup.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="p-3"
            >
              <div className="text-xs font-medium text-foreground mb-2">{dup.info}</div>
              <div className="space-y-1.5 mb-2">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-muted-foreground w-16 flex-shrink-0">Channels:</span>
                  <div className="flex flex-wrap gap-1">
                    {dup.channels.map((ch, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-muted-foreground w-16 flex-shrink-0">Recipients:</span>
                  <div className="flex flex-wrap gap-1">
                    {dup.recipients.map((r, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-intent-conflict/10 text-intent-conflict">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-accent">
                <ArrowRight className="w-3 h-3" />
                <span>{dup.recommendation}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <div className="text-lg font-heading font-bold text-intent-risk">3</div>
          <div className="text-[10px] text-muted-foreground">Stakeholders uninformed</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <div className="text-lg font-heading font-bold text-intent-conflict">5</div>
          <div className="text-[10px] text-muted-foreground">Duplicate signals</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <div className="text-lg font-heading font-bold text-primary">4</div>
          <div className="text-[10px] text-muted-foreground">Auto-fix suggestions</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
