import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";

interface VoiceInputProps {
  onTranscript: (text: string) => void | Promise<unknown>;
  className?: string;
  disabled?: boolean;
}

const mockTranscripts = [
  "Just had a call with the Acme team. They want to move the deadline up by two weeks.",
  "Quick update — the SOC2 audit results are in. Three critical findings.",
  "Can someone check with Marcus about the engineer reallocation?",
  "The board meeting has been moved to Friday. Need to update the deck.",
];

export default function VoiceInput({ onTranscript, className = "", disabled = false }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVoiceClick = useCallback(() => {
    if (disabled) return;
    if (isListening) {
      // Stop listening
      setIsListening(false);
      setIsProcessing(true);
      
      // Simulate processing and return mock transcript
      setTimeout(() => {
        const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
        onTranscript(randomTranscript);
        setIsProcessing(false);
      }, 1500);
    } else {
      // Start listening
      setIsListening(true);
    }
  }, [disabled, isListening, onTranscript]);

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={handleVoiceClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={disabled}
        className={`
          relative p-2.5 rounded-lg border transition-all duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${isListening 
            ? "bg-intent-risk/10 border-intent-risk/30 text-intent-risk" 
            : isProcessing
            ? "bg-primary/10 border-primary/30 text-primary"
            : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
          }
        `}
        title={isListening ? "Stop recording" : "Voice input"}
      >
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ rotate: { repeat: Infinity, duration: 1, ease: "linear" } }}
            >
              <Loader2 className="w-4 h-4" />
            </motion.div>
          ) : isListening ? (
            <motion.div
              key="listening"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              <MicOff className="w-4 h-4" />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              <Mic className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse animation when listening */}
        {isListening && (
          <>
            <motion.div
              className="absolute inset-0 rounded-lg bg-intent-risk/20"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <motion.div
              className="absolute inset-0 rounded-lg bg-intent-risk/20"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
            />
          </>
        )}
      </motion.button>

      {/* Status label */}
      <AnimatePresence>
        {(isListening || isProcessing) && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap"
          >
            <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded-full bg-card border border-border">
              {isProcessing ? "Processing..." : "Listening..."}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
