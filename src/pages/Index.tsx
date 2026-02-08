import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Zap, ChevronRight, Users, UserPlus, Activity, EyeOff, Keyboard } from "lucide-react";
import PipelineBar from "@/components/jarvis/PipelineBar";
import SignalIngest from "@/components/jarvis/SignalIngest";
import IntentPanel from "@/components/jarvis/IntentPanel";
import OrgGraph from "@/components/jarvis/OrgGraph";
import TruthPanel from "@/components/jarvis/TruthPanel";
import ConflictAlert from "@/components/jarvis/ConflictAlert";
import ActionPanel from "@/components/jarvis/ActionPanel";
import ExecQuery from "@/components/jarvis/ExecQuery";
import StakeholderMap from "@/components/jarvis/StakeholderMap";
import NewStakeholderContext from "@/components/jarvis/NewStakeholderContext";
import InformationFlow from "@/components/jarvis/InformationFlow";
import BlindSpots from "@/components/jarvis/BlindSpots";
import AgentThinking from "@/components/jarvis/AgentThinking";
import { pipelineSteps } from "@/data/mockData";
import type { Signal } from "@/lib/api";
import { usePipeline } from "@/hooks/usePipeline";

const DEMO_DELAYS = [1500, 2500, 2000, 2500, 2000, 1500, 2000];

export default function Index() {
  const {
    signals,
    pipelineData,
    processSignal,
    isProcessing,
    queryResponse,
    submitQuery,
    isQuerying,
    addSignalFromVoice,
    addSignalFromText,
    apiLive,
  } = usePipeline();

  const [step, setStep] = useState(-1);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [showGraphAfter, setShowGraphAfter] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [showPipeline, setShowPipeline] = useState(false);
  const [showStakeholderMap, setShowStakeholderMap] = useState(false);
  const [showNewStakeholder, setShowNewStakeholder] = useState(false);
  const [showInfoFlow, setShowInfoFlow] = useState(false);
  const [showBlindSpots, setShowBlindSpots] = useState(false);
  const [showAgentThinking, setShowAgentThinking] = useState(false);
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case " ": // Space to advance
          e.preventDefault();
          if (step >= 0 && step < pipelineSteps.length - 1 && selectedSignal) {
            if (step === 1) setShowGraphAfter(false);
            setStep((s) => s + 1);
          } else if (step === -1 && signals[0]) {
            setSelectedSignal(signals[0]);
            processSignal(signals[0]);
            setStep(0);
          }
          break;
        case "r": // R to reset
          setStep(-1);
          setSelectedSignal(null);
          setShowGraphAfter(false);
          setDemoMode(false);
          setShowPipeline(false);
          setShowStakeholderMap(false);
          setShowNewStakeholder(false);
          setShowInfoFlow(false);
          setShowBlindSpots(false);
          setShowAgentThinking(false);
          break;
        case "d": // D to toggle demo mode
          if (!demoMode) {
            setStep(-1);
            setSelectedSignal(null);
            setShowGraphAfter(false);
            setTimeout(() => setDemoMode(true), 100);
          } else {
            setDemoMode(false);
          }
          break;
        case "a": // A to toggle agent thinking
          setShowAgentThinking((v) => !v);
          break;
        case "f": // F to toggle info flow
          setShowInfoFlow((v) => !v);
          break;
        case "b": // B to toggle blind spots
          setShowBlindSpots((v) => !v);
          break;
        case "?": // ? to show keyboard hints
          setShowKeyboardHints((v) => !v);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, demoMode, selectedSignal, signals, processSignal]);

  // Demo auto-advance
  useEffect(() => {
    if (!demoMode) return;

    // First: auto-select signal
    if (step === -1 && signals[0]) {
      const t = setTimeout(() => {
        setSelectedSignal(signals[0]);
        processSignal(signals[0]);
        setStep(0);
      }, 1000);
      return () => clearTimeout(t);
    }

    if (step >= pipelineSteps.length) {
      setDemoMode(false);
      return;
    }

    const t = setTimeout(() => {
      if (step === 2) {
        setShowGraphAfter(true);
      }
      setStep((s) => s + 1);
    }, DEMO_DELAYS[step] ?? 2000);

    return () => clearTimeout(t);
  }, [demoMode, step, signals, processSignal]);

  // Show graph after state shortly after graph step
  useEffect(() => {
    if (step === 2 && !demoMode) {
      const t = setTimeout(() => setShowGraphAfter(true), 1500);
      return () => clearTimeout(t);
    }
  }, [step, demoMode]);

  const handleSignalSelect = useCallback((signal: Signal) => {
    setSelectedSignal(signal);
    processSignal(signal);
    if (step < 0) setStep(0);
  }, [step, processSignal]);

  const handleStepClick = useCallback((s: number) => {
    setStep(s);
  }, []);

  const handleAdvance = useCallback(() => {
    if (step < pipelineSteps.length - 1) {
      if (step === 1) {
        // When advancing to graph step
        setShowGraphAfter(false);
      }
      setStep((s) => s + 1);
    }
  }, [step]);

  const handleReset = useCallback(() => {
    setStep(-1);
    setSelectedSignal(null);
    setShowGraphAfter(false);
    setDemoMode(false);
    setShowPipeline(false);
    setShowStakeholderMap(false);
    setShowNewStakeholder(false);
    setShowInfoFlow(false);
    setShowBlindSpots(false);
    setShowAgentThinking(false);
  }, []);

  const handleStartDemo = useCallback(() => {
    handleReset();
    setTimeout(() => setDemoMode(true), 100);
  }, [handleReset]);

  const currentStepLabel = step >= 0 && step < pipelineSteps.length
    ? pipelineSteps[step].description
    : "Select a signal";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 h-12 sm:h-14 flex items-center justify-between">
          {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
              </div>
              <span className="font-heading font-bold text-foreground tracking-tight text-sm sm:text-base">JARVIS</span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono hidden md:inline border border-border px-1.5 sm:px-2 py-0.5 rounded-full">
              {apiLive ? "API connected" : "Demo mode"}
            </span>
          </div>

          {/* Pipeline - hidden on mobile/tablet, shown on large screens */}
          <div className="hidden lg:block">
            <PipelineBar currentStep={step} onStepClick={handleStepClick} />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setShowInfoFlow(!showInfoFlow)}
              className={`
                p-1.5 rounded-md transition-colors
                ${showInfoFlow 
                  ? "bg-primary/15 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }
              `}
              title="Information Flow (F)"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowBlindSpots(!showBlindSpots)}
              className={`
                p-1.5 rounded-md transition-colors
                ${showBlindSpots 
                  ? "bg-primary/15 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }
              `}
              title="Blind Spots (B)"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowStakeholderMap(!showStakeholderMap)}
              className={`
                p-1.5 rounded-md transition-colors
                ${showStakeholderMap 
                  ? "bg-primary/15 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }
              `}
              title="Stakeholder Map"
            >
              <Users className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowNewStakeholder(!showNewStakeholder)}
              className={`
                p-1.5 rounded-md transition-colors
                ${showNewStakeholder 
                  ? "bg-primary/15 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }
              `}
              title="New Stakeholder Context"
            >
              <UserPlus className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-border mx-0.5 sm:mx-1 hidden sm:block" />
            <button
              onClick={() => setShowPipeline(!showPipeline)}
              className={`
                p-1.5 rounded-md transition-colors lg:hidden
                ${showPipeline 
                  ? "bg-primary/15 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }
              `}
              title="Show Pipeline"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowAgentThinking(!showAgentThinking)}
              className={`
                text-[10px] px-2 sm:px-2.5 py-1.5 rounded-md transition-colors hidden lg:block
                ${showAgentThinking 
                  ? "bg-primary/15 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }
              `}
            >
              How it thinks (A)
            </button>
            <button
              onClick={() => setShowKeyboardHints(!showKeyboardHints)}
              className={`
                p-1.5 rounded-md transition-colors hidden sm:block
                ${showKeyboardHints 
                  ? "bg-primary/15 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }
              `}
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Reset (R)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={demoMode ? () => setDemoMode(false) : handleStartDemo}
              className={`
                flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                ${demoMode
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
                }
              `}
            >
              {demoMode ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span className="hidden xs:inline">{demoMode ? "Pause" : "Demo (D)"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Keyboard hints overlay */}
      <AnimatePresence>
        {showKeyboardHints && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 right-4 z-50 w-56 rounded-lg border border-border bg-card shadow-lg p-3"
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
              Keyboard Shortcuts
            </div>
            <div className="space-y-1.5 text-xs">
              {[
                { key: "Space", action: "Next step" },
                { key: "D", action: "Toggle demo" },
                { key: "R", action: "Reset" },
                { key: "A", action: "Agent thinking" },
                { key: "F", action: "Info flow" },
                { key: "B", action: "Blind spots" },
                { key: "?", action: "This menu" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{item.action}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground font-mono text-[10px]">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pipeline visualization - scrollable on mobile */}
      <AnimatePresence>
        {showPipeline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-b border-border bg-muted/30"
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2 sm:mb-3">
                How JARVIS Thinks
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
                {pipelineSteps.map((s, i) => (
                  <div key={s.id} className="flex items-center flex-shrink-0">
                    <button
                      onClick={() => handleStepClick(i)}
                      className={`
                        px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs border transition-all duration-300 whitespace-nowrap
                        ${i === step
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : i < step
                          ? "border-accent/20 bg-accent/5 text-accent"
                          : "border-border bg-card text-muted-foreground"
                        }
                      `}
                    >
                      <div className="font-medium">{s.label}</div>
                      <div className="text-[9px] sm:text-[10px] opacity-60 mt-0.5 hidden sm:block">{s.description}</div>
                    </button>
                    {i < pipelineSteps.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-border mx-0.5 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agent Thinking Panel */}
      <AnimatePresence>
        {showAgentThinking && step >= 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
              <AgentThinking currentStep={step} isVisible={true} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {/* Landing state */}
        {step === -1 && !selectedSignal && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] text-center px-4"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 sm:mb-6">
              <Zap className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3 tracking-tight">
              The Nervous System<br />of Your Organization
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mb-6 sm:mb-8 leading-relaxed">
              JARVIS transforms signals into structured understanding, surfaces conflicts before they escalate, and routes actions to the right people with the right context.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={handleStartDemo}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto"
              >
                <Play className="w-4 h-4" />
                Watch Demo
              </button>
              <button
                onClick={() => setStep(0)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-secondary transition-colors w-full sm:w-auto"
              >
                Try It
              </button>
            </div>
            <div className="mt-6 text-[10px] text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 rounded bg-secondary font-mono">Space</kbd> to start, <kbd className="px-1.5 py-0.5 rounded bg-secondary font-mono">?</kbd> for shortcuts
            </div>
          </motion.div>
        )}

        {/* New Stakeholder Context (full-width) */}
        <AnimatePresence>
          {showNewStakeholder && (step >= 0 || selectedSignal) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <NewStakeholderContext 
                isVisible={true} 
                onClose={() => setShowNewStakeholder(false)} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Information Flow Panel (full-width when visible) */}
        <AnimatePresence>
          {showInfoFlow && (step >= 0 || selectedSignal) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <InformationFlow isVisible={true} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step content */}
        {(step >= 0 || selectedSignal) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pb-20 sm:pb-6">
            {/* Left column: Signal + Classification */}
            <div className="space-y-4 sm:space-y-6">
              <SignalIngest
                signals={signals}
                selectedSignal={selectedSignal}
                onSignalSelect={handleSignalSelect}
                onVoiceTranscript={addSignalFromVoice}
                onTextSubmit={addSignalFromText}
                isProcessing={isProcessing}
              />

              <IntentPanel isVisible={step >= 1} classification={pipelineData.classification} />

              <ConflictAlert isVisible={step >= 4} conflicts={pipelineData.conflicts} />

              {/* Blind Spots - Left column when enabled */}
              <AnimatePresence>
                {showBlindSpots && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <BlindSpots isVisible={true} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stakeholder Map - Left column when enabled */}
              <AnimatePresence>
                {showStakeholderMap && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <StakeholderMap isVisible={true} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right column: Graph + Truth + Actions + Query */}
            <div className="space-y-4 sm:space-y-6">
              <OrgGraph
                isVisible={step >= 2}
                showAfter={showGraphAfter}
                graphBefore={pipelineData.graphBefore}
                graphAfter={pipelineData.graphAfter}
              />

              <TruthPanel isVisible={step >= 3} truthVersions={pipelineData.truthVersions} />

              <ActionPanel isVisible={step >= 5} actions={pipelineData.actions} />

              <ExecQuery
                isVisible={step >= 6}
                autoQuery={demoMode}
                onSubmitQuery={submitQuery}
                queryResponse={queryResponse}
                isQuerying={isQuerying}
              />
            </div>
          </div>
        )}

        {/* Advance button (non-demo mode) - responsive positioning */}
        {step >= 0 && step < pipelineSteps.length - 1 && !demoMode && selectedSignal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-20"
          >
            <button
              onClick={handleAdvance}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium shadow-lg hover:bg-primary/90 transition-all glow-primary"
            >
              <span className="hidden xs:inline">Next:</span> {pipelineSteps[step + 1]?.label}
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </motion.div>
        )}

        {/* Status bar - responsive positioning */}
        {step >= 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed bottom-4 sm:bottom-6 left-3 sm:left-6 z-20"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-card/90 backdrop-blur-sm border border-border text-[9px] sm:text-[10px] text-muted-foreground font-mono">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${demoMode ? "bg-primary pulse-dot" : step < pipelineSteps.length - 1 ? "bg-accent" : "bg-intent-task"}`} />
              <span className="truncate max-w-[100px] sm:max-w-none">
                {demoMode ? "Demo" : currentStepLabel}
              </span>
              <span className="flex-shrink-0">({step + 1}/{pipelineSteps.length})</span>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
