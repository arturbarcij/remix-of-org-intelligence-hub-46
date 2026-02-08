import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";

interface VoiceInputProps {
  onTranscript: (text: string) => void | Promise<unknown>;
  onPartial?: (text: string) => void;
  className?: string;
  disabled?: boolean;
}

export default function VoiceInput({ onTranscript, onPartial, className = "", disabled = false }: VoiceInputProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [desiredListening, setDesiredListening] = useState(false);
  const transcriptRef = useRef("");
  const fallbackTimerRef = useRef<number | null>(null);
  const fallbackNoResultRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fallbackActiveRef = useRef(false);
  const lastTranscriptAtRef = useRef<number | null>(null);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onPartialTranscript: (data) => {
      transcriptRef.current = data.text;
      if (data.text?.trim()) {
        onPartial?.(data.text.trim());
      }
    },
    onCommittedTranscript: (data) => {
      if (data.text.trim()) {
        onTranscript(data.text.trim());
        onPartial?.("");
      }
    },
  });

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
  }, []);

  const stopBrowserRecognition = useCallback(() => {
    if (recognitionRef.current && fallbackActiveRef.current) {
      fallbackActiveRef.current = false;
      lastTranscriptAtRef.current = null;
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }
  }, []);

  const startBrowserRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || fallbackActiveRef.current) return;
    fallbackActiveRef.current = true;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1];
      const transcript = last?.[0]?.transcript?.trim() || "";
      if (!transcript) return;
      lastTranscriptAtRef.current = Date.now();
      if (last.isFinal) {
        onTranscript(transcript);
        onPartial?.("");
      } else {
        onPartial?.(transcript);
      }
    };
    recognition.onerror = () => {
      onPartial?.("");
    };
    recognition.onend = () => {
      if (!fallbackActiveRef.current || !desiredListening) return;
      const lastAt = lastTranscriptAtRef.current;
      if (lastAt && Date.now() - lastAt < 5000) {
        recognition.start();
      } else {
        fallbackActiveRef.current = false;
      }
    };
    recognition.start();
  }, [desiredListening, onPartial, onTranscript]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current);
      }
      if (fallbackNoResultRef.current) {
        window.clearTimeout(fallbackNoResultRef.current);
      }
      stopBrowserRecognition();
      if (scribe.isConnected) {
        scribe.disconnect();
      }
    };
  }, [scribe, stopBrowserRecognition]);

  const connectScribe = useCallback(async () => {
    setIsProcessing(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("elevenlabs-scribe-token");
      if (invokeError) {
        throw new Error(invokeError.message || "Failed to get scribe token");
      }
      if (!data?.token) {
        throw new Error("No token received");
      }
      transcriptRef.current = "";
      await scribe.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      setIsProcessing(false);
      setError(null);
      stopBrowserRecognition();
    } catch (err) {
      console.error("Voice input error:", err);
      setError(err instanceof Error ? err.message : "Voice input failed");
      setIsProcessing(false);
    }
  }, [scribe, startBrowserRecognition, stopBrowserRecognition]);

  const handleVoiceClick = useCallback(async () => {
    if (disabled) return;
    setError(null);

    if (scribe.isConnected) {
      // Stop listening
      scribe.disconnect();
      setIsProcessing(false);
      setDesiredListening(false);
      stopBrowserRecognition();
    } else {
      // Start listening
      setDesiredListening(true);
      startBrowserRecognition();
      if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
      if (fallbackNoResultRef.current) window.clearTimeout(fallbackNoResultRef.current);
      fallbackNoResultRef.current = window.setTimeout(() => {
        if (!lastTranscriptAtRef.current) {
          setError("Mic permission required");
          stopBrowserRecognition();
        }
      }, 3000);
      await connectScribe();
    }
  }, [disabled, scribe, connectScribe, startBrowserRecognition, stopBrowserRecognition]);

  useEffect(() => {
    if (!desiredListening) return;
    if (!scribe.isConnected && !isProcessing) {
      connectScribe();
    }
  }, [desiredListening, scribe.isConnected, isProcessing, connectScribe]);

  const isListening = scribe.isConnected;

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
        {(isListening || isProcessing || error) && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap"
          >
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full bg-card border border-border ${error ? "text-intent-risk" : "text-muted-foreground"}`}>
              {error ? "Error" : isProcessing ? "Connecting..." : "Listening..."}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live transcript preview */}
      <AnimatePresence>
        {isListening && scribe.partialTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full right-0 mt-8 max-w-xs"
          >
            <span className="text-[10px] font-mono text-muted-foreground/70 px-2 py-1 rounded bg-card/80 border border-border line-clamp-2">
              {scribe.partialTranscript}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
