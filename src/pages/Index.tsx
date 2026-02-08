import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Zap, ChevronRight, Users, UserPlus } from "lucide-react";
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
import { Signal, signals, pipelineSteps } from "@/data/mockData";

const DEMO_DELAYS = [1500, 2500, 2000, 2500, 2000, 1500, 2000];

export default function Index() {
  const [step, setStep] = useState(-1);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [showGraphAfter, setShowGraphAfter] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [showPipeline, setShowPipeline] = useState(false);
  const [showStakeholderMap, setShowStakeholderMap] = useState(false);
  const [showNewStakeholder, setShowNewStakeholder] = useState(false);

  // Demo auto-advance
  useEffect(() => {
    if (!demoMode) return;

    // First: auto-select signal
    if (step === -1) {
      const t = setTimeout(() => {
        setSelectedSignal(signals[0]);
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
  }, [demoMode, step]);

  // Show graph after state shortly after graph step
  useEffect(() => {
    if (step === 2 && !demoMode) {
      const t = setTimeout(() => setShowGraphAfter(true), 1500);
      return () => clearTimeout(t);
    }
  }, [step, demoMode]);

  const handleSignalSelect = useCallback((signal: Signal) => {
    setSelectedSignal(signal);
    if (step < 0) setStep(0);
  }, [step]);

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
              AI Chief of Staff
            </span>
          </div>

          {/* Pipeline - hidden on mobile/tablet, shown on large screens */}
          <div className="hidden lg:block">
            <PipelineBar currentStep={step} onStepClick={handleStepClick} />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5">
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
              onClick={() => setShowPipeline(!showPipeline)}
              className="text-[10px] text-muted-foreground hover:text-foreground px-2 sm:px-2.5 py-1.5 rounded-md hover:bg-secondary transition-colors hidden lg:block"
            >
              How it thinks
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Reset"
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
              <span className="hidden xs:inline">{demoMode ? "Pause" : "Demo"}</span>
            </button>
          </div>
        </div>
      </header>

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

        {/* Step content */}
        {(step >= 0 || selectedSignal) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pb-20 sm:pb-6">
            {/* Left column: Signal + Classification */}
            <div className="space-y-4 sm:space-y-6">
              <SignalIngest
                selectedSignal={selectedSignal}
                onSignalSelect={handleSignalSelect}
              />

              <IntentPanel isVisible={step >= 1} />

              <ConflictAlert isVisible={step >= 4} />

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
              />

              <TruthPanel isVisible={step >= 3} />

              <ActionPanel isVisible={step >= 5} />

              <ExecQuery
                isVisible={step >= 6}
                autoQuery={demoMode}
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
