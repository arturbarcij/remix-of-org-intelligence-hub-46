import { motion } from "framer-motion";
import { pipelineSteps } from "@/data/mockData";
import { Check } from "lucide-react";

interface PipelineBarProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export default function PipelineBar({ currentStep, onStepClick }: PipelineBarProps) {
  return (
    <div className="flex items-center gap-1">
      {pipelineSteps.map((step, i) => {
        const isComplete = i < currentStep;
        const isCurrent = i === currentStep;
        const isFuture = i > currentStep;

        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => isComplete && onStepClick(i)}
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-300
                ${isCurrent ? "bg-primary/15 text-primary" : ""}
                ${isComplete ? "text-accent cursor-pointer hover:bg-secondary" : ""}
                ${isFuture ? "text-muted-foreground/40 cursor-default" : ""}
              `}
            >
              <div className="relative flex items-center justify-center">
                {isComplete ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <div
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      isCurrent ? "bg-primary pulse-dot" : "bg-muted-foreground/30"
                    }`}
                  />
                )}
              </div>
              <span className="hidden sm:inline">{step.label}</span>
            </button>

            {i < pipelineSteps.length - 1 && (
              <div
                className={`w-4 h-px transition-colors duration-500 ${
                  isComplete ? "bg-accent/50" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
