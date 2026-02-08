import { useState, useCallback, useEffect } from "react";
import { api, isApiAvailable } from "@/lib/api";
import type { ProcessResponse, QueryResponse, Signal } from "@/lib/api";
import {
  signals as mockSignals,
  classification as mockClassification,
  graphBefore as mockGraphBefore,
  graphAfter as mockGraphAfter,
  truthVersions as mockTruthVersions,
  conflicts as mockConflicts,
  actions as mockActions,
  execQueryResponse as mockQueryResponse,
} from "@/data/mockData";

export interface PipelineData {
  classification: ProcessResponse["classification"] | null;
  graphBefore: ProcessResponse["graphBefore"] | null;
  graphAfter: ProcessResponse["graphAfter"] | null;
  truthVersions: ProcessResponse["truthVersions"];
  conflicts: ProcessResponse["conflicts"];
  actions: ProcessResponse["actions"];
}

const defaultPipeline: PipelineData = {
  classification: mockClassification,
  graphBefore: mockGraphBefore,
  graphAfter: mockGraphAfter,
  truthVersions: mockTruthVersions,
  conflicts: mockConflicts,
  actions: mockActions,
};

export function usePipeline() {
  const [apiLive, setApiLive] = useState<boolean | null>(null);
  const [signals, setSignals] = useState<Signal[]>(mockSignals);
  const [pipelineData, setPipelineData] = useState<PipelineData>(defaultPipeline);
  const [isProcessing, setIsProcessing] = useState(false);
  const [queryResponse, setQueryResponse] = useState<QueryResponse | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const ok = await isApiAvailable();
      if (!cancelled) setApiLive(ok);
    };
    check();
    if (apiLive) return () => { cancelled = true; };
    const id = setInterval(check, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [apiLive]);

  useEffect(() => {
    if (apiLive) {
      api.getSignals().then(setSignals).catch(() => setSignals(mockSignals));
    }
  }, [apiLive]);

  const processSignal = useCallback(
    async (signal: Signal | null) => {
      if (!signal) {
        setPipelineData(defaultPipeline);
        return;
      }
      if (apiLive) {
        setIsProcessing(true);
        try {
          const res = await api.process(signal.id);
          setPipelineData({
            classification: res.classification,
            graphBefore: res.graphBefore,
            graphAfter: res.graphAfter,
            truthVersions: res.truthVersions || [],
            conflicts: res.conflicts || [],
            actions: res.actions || [],
          });
        } catch {
          setPipelineData(defaultPipeline);
        } finally {
          setIsProcessing(false);
        }
      } else {
        setPipelineData(defaultPipeline);
      }
    },
    [apiLive]
  );

  const submitQuery = useCallback(
    async (query: string): Promise<QueryResponse> => {
      if (apiLive) {
        setIsQuerying(true);
        try {
          const res = await api.query(query);
          setQueryResponse(res);
          return res;
        } catch {
          setQueryResponse(mockQueryResponse);
          return mockQueryResponse;
        } finally {
          setIsQuerying(false);
        }
      }
      setQueryResponse(mockQueryResponse);
      return mockQueryResponse;
    },
    [apiLive]
  );

  const addSignalFromVoice = useCallback(
    async (content: string): Promise<Signal> => {
      const voiceSignal: Signal = {
        id: `voice-${Date.now()}`,
        type: "meeting",
        title: "Voice Note",
        source: "Voice Input",
        timestamp: "Just now",
        content,
      };
      if (apiLive) {
        try {
          const saved = await api.addSignal(voiceSignal);
          setSignals((prev) => [...prev.filter((s) => s.id !== saved.id), saved]);
          return saved;
        } catch {
          setSignals((prev) => [...prev, voiceSignal]);
          return voiceSignal;
        }
      }
      setSignals((prev) => [...prev, voiceSignal]);
      return voiceSignal;
    },
    [apiLive]
  );

  const addSignalFromText = useCallback(
    async (payload: { content: string; title?: string; source?: string; type?: Signal["type"] }): Promise<Signal> => {
      const textSignal: Signal = {
        id: `text-${Date.now()}`,
        type: payload.type || "slack",
        title: payload.title || "Manual Ingest",
        source: payload.source || "User Input",
        timestamp: "Just now",
        content: payload.content,
      };
      if (apiLive) {
        try {
          const saved = await api.addSignal(textSignal);
          setSignals((prev) => [...prev.filter((s) => s.id !== saved.id), saved]);
          return saved;
        } catch {
          setSignals((prev) => [...prev, textSignal]);
          return textSignal;
        }
      }
      setSignals((prev) => [...prev, textSignal]);
      return textSignal;
    },
    [apiLive]
  );

  return {
    apiLive,
    signals,
    pipelineData,
    processSignal,
    isProcessing,
    queryResponse,
    submitQuery,
    isQuerying,
    addSignalFromVoice,
    addSignalFromText,
  };
}
