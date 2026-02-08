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
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  const transcriptRef = useRef("");
  const fallbackTimerRef = useRef<number | null>(null);
  const fallbackNoResultRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const fallbackActiveRef = useRef(false);
  const lastTranscriptAtRef = useRef<number | null>(null);
  const spaceDownRef = useRef(false);
  const mouseDownRef = useRef(false);

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
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
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
    recognition.onresult = (event: any) => {
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
    recognition.onerror = (e: any) => {
      onPartial?.("");
      // Auto-cancel on permission denied
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Mic permission denied");
        stopListening();
      }
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

  const stopListening = useCallback(() => {
    setDesiredListening(false);
    setIsPushToTalk(false);
    setIsProcessing(false);
    stopBrowserRecognition();
    if (scribe.isConnected) {
      scribe.disconnect();
    }
    onPartial?.("");
  }, [scribe, stopBrowserRecognition, onPartial]);

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
    } catch (err: any) {
      console.error("Voice input error:", err);
      // Auto-cancel on permission denied
      if (err?.name === "NotAllowedError" || err?.message?.includes("permission")) {
        setError("Mic permission denied");
      } else {
        setError(err instanceof Error ? err.message : "Voice input failed");
      }
      setIsProcessing(false);
      stopListening();
    }
  }, [scribe, stopBrowserRecognition, stopListening]);

  const startListening = useCallback(async (pushToTalk = false) => {
    if (disabled) return;
    setError(null);
    setDesiredListening(true);
    setIsPushToTalk(pushToTalk);
    startBrowserRecognition();
    if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
    if (fallbackNoResultRef.current) window.clearTimeout(fallbackNoResultRef.current);
    fallbackNoResultRef.current = window.setTimeout(() => {
      if (!lastTranscriptAtRef.current && !scribe.isConnected) {
        setError("Mic permission required");
        stopListening();
      }
    }, 3000);
    await connectScribe();
  }, [disabled, connectScribe, startBrowserRecognition, stopListening, scribe.isConnected]);

  const handleVoiceClick = useCallback(async () => {
    if (disabled) return;
    if (scribe.isConnected || desiredListening) {
      stopListening();
    } else {
      await startListening(false);
    }
  }, [disabled, scribe.isConnected, desiredListening, stopListening, startListening]);

  // Push-to-talk: mouse/touch hold on button
  const handleMouseDown = useCallback(async () => {
    if (disabled || mouseDownRef.current) return;
    mouseDownRef.current = true;
    await startListening(true);
  }, [disabled, startListening]);

  const handleMouseUp = useCallback(() => {
    if (!mouseDownRef.current) return;
    mouseDownRef.current = false;
    if (isPushToTalk) {
      stopListening();
    }
  }, [isPushToTalk, stopListening]);

  // Push-to-talk: hold Space key
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Only trigger if Space and not in an input/textarea
      if (e.code !== "Space" || e.repeat) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      
      if (!spaceDownRef.current && !desiredListening) {
        e.preventDefault();
        spaceDownRef.current = true;
        await startListening(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (spaceDownRef.current) {
        e.preventDefault();
        spaceDownRef.current = false;
        if (isPushToTalk) {
          stopListening();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [disabled, desiredListening, isPushToTalk, startListening, stopListening]);

  useEffect(() => {
    if (!desiredListening) return;
    if (!scribe.isConnected && !isProcessing) {
      connectScribe();
    }
  }, [desiredListening, scribe.isConnected, isProcessing, connectScribe]);

  const isListening = scribe.isConnected;

  // Status text
  const getStatusText = () => {
    if (error) return error;
    if (isProcessing) return "Connecting...";
    if (isPushToTalk && isListening) return "Release to send";
    if (isListening) return "Listening...";
    return null;
  };

  const statusText = getStatusText();

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={handleVoiceClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={disabled}
        className={`
          relative p-2.5 rounded-lg border transition-all duration-200 select-none
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${isListening 
            ? isPushToTalk 
              ? "bg-primary/20 border-primary/50 text-primary ring-2 ring-primary/30" 
              : "bg-intent-risk/10 border-intent-risk/30 text-intent-risk" 
            : isProcessing
            ? "bg-primary/10 border-primary/30 text-primary"
            : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
          }
        `}
        title={isListening ? (isPushToTalk ? "Release to send" : "Stop recording") : "Hold Space or click to talk"}
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
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              {isPushToTalk ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
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
              className={`absolute inset-0 rounded-lg ${isPushToTalk ? "bg-primary/20" : "bg-intent-risk/20"}`}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <motion.div
              className={`absolute inset-0 rounded-lg ${isPushToTalk ? "bg-primary/20" : "bg-intent-risk/20"}`}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
            />
          </>
        )}
      </motion.button>

      {/* Status label */}
      <AnimatePresence>
        {statusText && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap"
          >
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full bg-card border border-border ${error ? "text-intent-risk" : isPushToTalk ? "text-primary" : "text-muted-foreground"}`}>
              {statusText}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard hint when idle */}
      <AnimatePresence>
        {!isListening && !isProcessing && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap pointer-events-none"
          >
            <span className="text-[9px] font-mono text-muted-foreground/50 px-1.5 py-0.5 rounded bg-muted/30 border border-border/50">
              Hold <kbd className="px-1 py-0.5 bg-muted rounded text-[8px] mx-0.5">Space</kbd> to talk
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
