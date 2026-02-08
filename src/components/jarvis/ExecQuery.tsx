import { motion, AnimatePresence } from "framer-motion";
import { execQueryResponse as mockQueryResponse } from "@/data/mockData";
import { api } from "@/lib/api";
import type { QueryResponse } from "@/lib/api";
import { useStreamText } from "@/hooks/useStreamText";
import { Search, ArrowRight, AlertCircle, Users, Clock, Map, Volume2 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import ChangeGraph from "./ChangeGraph";

interface ExecQueryProps {
  isVisible: boolean;
  autoQuery?: boolean;
  onSubmitQuery?: (query: string) => Promise<QueryResponse>;
  queryResponse?: QueryResponse | null;
  isQuerying?: boolean;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function ExecQuery({ isVisible, autoQuery, onSubmitQuery, queryResponse: propQueryResponse, isQuerying }: ExecQueryProps) {
  const [query, setQuery] = useState(autoQuery ? "What changed today?" : "");
  const [showResponse, setShowResponse] = useState(!!autoQuery);
  const [localResponse, setLocalResponse] = useState<QueryResponse | null>(propQueryResponse ?? null);
  const [showVisualMap, setShowVisualMap] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const response = propQueryResponse ?? localResponse ?? mockQueryResponse;
  const { displayText, isComplete } = useStreamText(
    response.summary,
    15,
    showResponse
  );

  useEffect(() => {
    if (propQueryResponse) setLocalResponse(propQueryResponse);
  }, [propQueryResponse]);

  const handleSubmit = useCallback(async () => {
    if (!query.trim() || isQuerying) return;
    setShowResponse(true);
    if (onSubmitQuery) {
      const res = await onSubmitQuery(query);
      setLocalResponse(res);
    } else {
      setLocalResponse(mockQueryResponse);
    }
  }, [query, isQuerying, onSubmitQuery]);

  const handleSpeak = useCallback(async () => {
    if (isSpeaking || !response?.summary) return;
    setIsSpeaking(true);
    try {
      const audioBlob = await api.tts(response.summary);
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setIsSpeaking(false);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setIsSpeaking(false);
      };
      await audio.play();
    } catch {
      setIsSpeaking(false);
    }
  }, [isSpeaking, response?.summary]);

  if (!isVisible) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <motion.div variants={itemVariants}>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-1">Executive Query</h2>
        <p className="text-xs text-muted-foreground">Ask anything about your organization</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 focus-within:border-primary/40 transition-colors">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-1" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="What changed today?"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || isQuerying}
            className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      {isQuerying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span>Querying organizational state...</span>
        </motion.div>
      )}

      <AnimatePresence>
        {showResponse && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {/* Summary */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Briefing
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSpeak}
                    disabled={isSpeaking}
                    className={`
                      flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors
                      ${isSpeaking
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }
                    `}
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{isSpeaking ? "Speaking" : "Speak"}</span>
                  </button>
                  <button
                    onClick={() => setShowVisualMap(!showVisualMap)}
                    className={`
                      flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors
                      ${showVisualMap 
                        ? "bg-primary/15 text-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }
                    `}
                  >
                    <Map className="w-3 h-3" />
                    <span>Visual Map</span>
                  </button>
                </div>
              </div>
              <div className="text-sm text-foreground leading-relaxed">
                {displayText}
                {!isComplete && (
                  <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
                )}
              </div>
            </div>

            {/* Visual Change Map */}
            <AnimatePresence>
              {showVisualMap && isComplete && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <ChangeGraph isVisible={true} />
                </motion.div>
              )}
            </AnimatePresence>

            {isComplete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                {/* Stakeholders */}
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      Impacted Stakeholders
                    </span>
                  </div>
                  <div className="space-y-2">
                    {response.stakeholders.map((s, i) => (
                      <motion.div
                        key={s.name}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="flex items-start gap-3 p-2 rounded-md bg-muted/30"
                      >
                        <div className="flex-1">
                          <div className="text-xs font-medium text-foreground">{s.name}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{s.impact}</div>
                        </div>
                        <div className="text-[10px] text-primary font-mono">{s.action}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Status bar */}
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-foreground">
                      <span className="font-mono text-primary">{response.pendingActions}</span> pending actions
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-intent-risk/20 bg-intent-risk/5">
                    <AlertCircle className="w-3.5 h-3.5 text-intent-risk" />
                    <span className="text-xs text-foreground">
                      Risk: <span className="font-mono text-intent-risk">{response.riskLevel}</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
