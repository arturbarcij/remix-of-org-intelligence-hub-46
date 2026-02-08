import { motion, AnimatePresence } from "framer-motion";
import type { Signal } from "@/lib/api";
import { MessageSquare, Mic, Image, Mail } from "lucide-react";
import VoiceInput from "./VoiceInput";
import { useCallback, useMemo, useState } from "react";

interface SignalIngestProps {
  signals: Signal[];
  selectedSignal: Signal | null;
  onSignalSelect: (signal: Signal) => void;
  onVoiceTranscript?: (text: string) => Promise<Signal>;
  onTextSubmit?: (payload: { content: string; title?: string; source?: string; type?: Signal["type"] }) => Promise<Signal>;
  isProcessing?: boolean;
}

const typeIcons = {
  slack: MessageSquare,
  meeting: Mic,
  screenshot: Image,
  email: Mail,
};

const typeLabels = {
  slack: "Slack Message",
  meeting: "Meeting Transcript",
  screenshot: "Screenshot",
  email: "Email Thread",
};

const presets = [
  {
    label: "Decision Made",
    type: "meeting" as const,
    title: "Leadership Decision",
    source: "Exec Sync",
    content:
      "Decision: Approve expedited API migration to Feb 28. Platform team will take two engineers from Mobile for 2 weeks. CFO approved budget reallocation.",
  },
  {
    label: "Conflict Flag",
    type: "slack" as const,
    title: "Resource Conflict",
    source: "Marcus Rivera",
    content:
      "I can't approve pulling two mobile engineers this sprint. Mobile roadmap is at risk and we already committed to the release.",
  },
  {
    label: "Risk Update",
    type: "email" as const,
    title: "SOC2 Findings",
    source: "Compliance",
    content:
      "SOC2 audit returned three critical findings overlapping with the migration timeline. Recommend pausing release until mitigation plan is approved.",
  },
];

export default function SignalIngest({
  signals,
  selectedSignal,
  onSignalSelect,
  onVoiceTranscript,
  onTextSubmit,
  isProcessing,
}: SignalIngestProps) {
  const [textContent, setTextContent] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [textSource, setTextSource] = useState("");
  const [textType, setTextType] = useState<Signal["type"]>("slack");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [voiceMode, setVoiceMode] = useState<"fields" | "signal">("fields");

  const voiceHint = useMemo(
    () => 'Say: "title ... source ... type ... message ..." (or just dictate message)',
    []
  );

  const applyTranscriptToFields = useCallback(
    (transcript: string) => {
      const text = transcript.trim();
      if (!text) return;

      const getSegment = (label: string) => {
        const re = new RegExp(`${label}\\s*(?:is|:)?\\s*([\\s\\S]*?)(?=(title|source|field|type|message|content)\\b|$)`, "i");
        const match = text.match(re);
        return match?.[1]?.trim();
      };

      const titleSeg = getSegment("title");
      const sourceSeg = getSegment("source") || getSegment("field");
      const typeSeg = getSegment("type");
      const messageSeg = getSegment("message") || getSegment("content");

      if (titleSeg) setTextTitle(titleSeg);
      if (sourceSeg) setTextSource(sourceSeg);
      if (typeSeg) {
        const lowered = typeSeg.toLowerCase();
        if (lowered.includes("meeting")) setTextType("meeting");
        else if (lowered.includes("email")) setTextType("email");
        else if (lowered.includes("screenshot")) setTextType("screenshot");
        else if (lowered.includes("slack")) setTextType("slack");
      }

      if (messageSeg) {
        setTextContent(messageSeg);
        return;
      }

      if (/\b(add signal|submit|send)\b/i.test(text)) {
        handleTextSubmit();
        return;
      }

      if (!titleSeg && !sourceSeg && !typeSeg) {
        setTextContent((prev) => (prev ? `${prev} ${text}` : text));
      }
    },
    []
  );

  const handleVoiceTranscript = useCallback(async (text: string) => {
    if (voiceMode === "signal") {
      if (onVoiceTranscript) {
        const voiceSignal = await onVoiceTranscript(text);
        onSignalSelect(voiceSignal);
      } else {
        const voiceSignal: Signal = {
          id: "voice-" + Date.now(),
          type: "meeting",
          title: "Voice Note",
          source: "Voice Input",
          timestamp: "Just now",
          content: text,
        };
        onSignalSelect(voiceSignal);
      }
      return;
    }
    applyTranscriptToFields(text);
  }, [applyTranscriptToFields, onSignalSelect, onVoiceTranscript, voiceMode]);

  const handleTextSubmit = useCallback(async () => {
    if (!onTextSubmit || !textContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const saved = await onTextSubmit({
        content: textContent.trim(),
        title: textTitle.trim() || "Manual Ingest",
        source: textSource.trim() || "User Input",
        type: textType,
      });
      onSignalSelect(saved);
      setTextContent("");
      setTextTitle("");
      setTextSource("");
      setTextType("slack");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onTextSubmit, onSignalSelect, textContent, textSource, textTitle, textType]);

  const handlePreset = useCallback(
    async (preset: (typeof presets)[number]) => {
      setTextTitle(preset.title);
      setTextSource(preset.source);
      setTextType(preset.type);
      setTextContent(preset.content);
      if (!onTextSubmit || isSubmitting || isProcessing) return;
      setIsSubmitting(true);
      try {
        const saved = await onTextSubmit({
          content: preset.content,
          title: preset.title,
          source: preset.source,
          type: preset.type,
        });
        onSignalSelect(saved);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isProcessing, isSubmitting, onSignalSelect, onTextSubmit]
  );

  const handleScreenshotUpload = useCallback(
    async (file: File | null) => {
      if (!file || !onTextSubmit || isSubmitting || isProcessing) return;
      setIsOcrRunning(true);
      try {
        const { default: Tesseract } = await import("tesseract.js");
        const result = await Tesseract.recognize(file, "eng");
        const extracted = (result?.data?.text || "").trim();
        const content = extracted || "Screenshot uploaded (no text recognized).";
        const saved = await onTextSubmit({
          content,
          title: "Screenshot Upload",
          source: file.name || "Screenshot",
          type: "screenshot",
        });
        onSignalSelect(saved);
      } catch {
        const saved = await onTextSubmit({
          content: "Screenshot uploaded (OCR failed).",
          title: "Screenshot Upload",
          source: file.name || "Screenshot",
          type: "screenshot",
        });
        onSignalSelect(saved);
      } finally {
        setIsOcrRunning(false);
      }
    },
    [isProcessing, isSubmitting, onSignalSelect, onTextSubmit]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-1">Signal Ingest</h2>
          <p className="text-xs text-muted-foreground">Select a signal or use voice input {isProcessing && "(processing…)"}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>Voice</span>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={voiceMode === "fields"}
                onChange={(e) => setVoiceMode(e.target.checked ? "fields" : "signal")}
                className="accent-primary"
              />
              <span>{voiceMode === "fields" ? "to fields" : "as signal"}</span>
            </label>
          </div>
          <VoiceInput onTranscript={handleVoiceTranscript} disabled={isProcessing} />
        </div>
      </div>

      {/* Manual ingest */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-2">
        <div className="text-[10px] text-muted-foreground">{voiceHint}</div>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset)}
              disabled={isSubmitting || isProcessing}
              className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-secondary/40 text-foreground hover:bg-secondary disabled:opacity-40"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={textTitle}
            onChange={(e) => setTextTitle(e.target.value)}
            placeholder="Title (optional)"
            className="flex-1 text-xs bg-secondary/40 border border-border rounded px-2 py-1.5 text-foreground placeholder:text-muted-foreground/60 outline-none"
          />
          <input
            value={textSource}
            onChange={(e) => setTextSource(e.target.value)}
            placeholder="Source (optional)"
            className="flex-1 text-xs bg-secondary/40 border border-border rounded px-2 py-1.5 text-foreground placeholder:text-muted-foreground/60 outline-none"
          />
          <select
            value={textType}
            onChange={(e) => setTextType(e.target.value as Signal["type"])}
            className="text-xs bg-secondary/40 border border-border rounded px-2 py-1.5 text-foreground"
          >
            <option value="slack">Slack</option>
            <option value="meeting">Meeting</option>
            <option value="email">Email</option>
            <option value="screenshot">Screenshot</option>
          </select>
        </div>
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Paste a message, meeting notes, or decision here..."
          rows={3}
          className="w-full text-xs bg-secondary/40 border border-border rounded px-2 py-2 text-foreground placeholder:text-muted-foreground/60 outline-none resize-none"
        />
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground">
            This will create a new signal and run the pipeline.
          </span>
          <div className="flex items-center gap-2">
            <label className="text-[11px] px-2.5 py-1 rounded-md border border-border bg-secondary/40 text-foreground cursor-pointer">
              {isOcrRunning ? "Scanning..." : "Upload Screenshot"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isOcrRunning || isSubmitting || isProcessing}
                onChange={(e) => handleScreenshotUpload(e.target.files?.[0] || null)}
              />
            </label>
            <button
              onClick={handleTextSubmit}
              disabled={!textContent.trim() || isSubmitting || isProcessing}
              className="text-[11px] px-2.5 py-1 rounded-md bg-primary text-primary-foreground disabled:opacity-40"
            >
              {isSubmitting ? "Adding..." : "Add Signal"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {signals.length === 0 ? (
          <div className="col-span-2 rounded-lg border border-dashed border-border bg-card/50 p-4 text-center text-xs text-muted-foreground">
            No signals yet. Add a voice note to ingest new context.
          </div>
        ) : (
          signals.map((signal) => {
            const Icon = typeIcons[signal.type];
            const isSelected = selectedSignal?.id === signal.id;

            return (
              <motion.button
                key={signal.id}
                onClick={() => onSignalSelect(signal)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200
                  border
                  ${
                    isSelected
                      ? "border-glow bg-primary/5"
                      : "border-border bg-card hover:border-muted-foreground/20 hover:bg-secondary/50"
                  }
                `}
              >
                <div
                  className={`p-1.5 rounded-md ${
                    isSelected ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-foreground truncate">{typeLabels[signal.type]}</div>
                  <div className="text-[10px] text-muted-foreground truncate mt-0.5">{signal.source}</div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      <AnimatePresence mode="wait">
        {selectedSignal && (
          <motion.div
            key={selectedSignal.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">{selectedSignal.title}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{selectedSignal.timestamp}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                {typeLabels[selectedSignal.type]}
              </span>
            </div>
            <div className="text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-line">
              {selectedSignal.content}
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-[10px] text-muted-foreground">
                Source: <span className="text-foreground">{selectedSignal.source}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
