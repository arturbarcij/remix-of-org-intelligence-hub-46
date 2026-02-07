import { useState, useEffect, useCallback } from "react";

export function useStreamText(
  text: string,
  speed: number = 20,
  enabled: boolean = false
) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDisplayText("");
      setIsComplete(false);
      return;
    }

    let i = 0;
    setDisplayText("");
    setIsComplete(false);

    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, enabled]);

  return { displayText, isComplete };
}

export function useDemoAutoAdvance(
  currentStep: number,
  setStep: (step: number) => void,
  demoMode: boolean,
  delays: number[] = [2000, 2500, 2500, 2000, 1500, 2000, 2500]
) {
  useEffect(() => {
    if (!demoMode) return;
    if (currentStep >= delays.length) return;

    const timeout = setTimeout(() => {
      setStep(currentStep + 1);
    }, delays[currentStep]);

    return () => clearTimeout(timeout);
  }, [currentStep, demoMode, setStep, delays]);
}
