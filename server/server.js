require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getSignals, addSignal, getState, saveState } = require('./lib/storage');
const ai = require('./lib/aiPipeline');
const { textToSpeech } = require('./lib/elevenlabs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Seed initial mock signals if empty ─────────────────────────
function ensureSeeded() {
  const signals = getSignals();
  if (signals.length > 0) return;
  const seed = [
    {
      id: 'slack-1',
      type: 'slack',
      title: '#leadership-sync',
      source: 'David Chen, VP Engineering',
      timestamp: '2 min ago',
      content: `Just got off the phone with Acme Corp. They're pushing the API migration deadline from March 15 to February 28. Sarah from Platform thinks we can make it if we pull two engineers from the mobile team, but Marcus hasn't signed off on this yet. We need to decide by end of week.\n\nAlso — the SOC2 audit findings came back. Three critical items directly overlap with the migration work. Compliance is flagging this as a blocker.\n\nCan someone set up a decision meeting for Thursday?`,
    },
  ];
  seed.forEach((s) => addSignal(s));
}

ensureSeeded();

// ─── Routes ────────────────────────────────────────────────────

// GET /signals
app.get('/api/signals', (req, res) => {
  try {
    const signals = getSignals();
    res.json(signals);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/signals - Ingest new signal (text or from JARVIS screenshot)
app.post('/api/signals', (req, res) => {
  try {
    const body = req.body;
    const signal = {
      id: body.id || `sig_${Date.now()}`,
      type: body.type || 'screenshot',
      title: body.title || 'New Signal',
      source: body.source || 'Unknown',
      timestamp: body.timestamp || new Date().toISOString(),
      content: body.content || body.summary || JSON.stringify(body),
    };
    const saved = addSignal(signal);
    res.status(201).json(saved);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Ingest helpers (Slack / Email / Meeting / Screenshot) ─────
function saveSignalFromPayload(payload) {
  const signal = {
    id: payload.id || `sig_${Date.now()}`,
    type: payload.type || 'slack',
    title: payload.title || 'New Signal',
    source: payload.source || 'Unknown',
    timestamp: payload.timestamp || new Date().toISOString(),
    content: payload.content || payload.summary || JSON.stringify(payload),
  };
  return addSignal(signal);
}

app.post('/api/ingest/slack', (req, res) => {
  try {
    const { text, user, channel, ts } = req.body || {};
    const saved = saveSignalFromPayload({
      type: 'slack',
      title: channel ? `#${channel}` : 'Slack Message',
      source: user || 'Slack',
      timestamp: ts ? new Date(Number(ts) * 1000).toISOString() : new Date().toISOString(),
      content: text || '',
    });
    res.status(201).json(saved);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ingest/email', (req, res) => {
  try {
    const { subject, from, body, timestamp } = req.body || {};
    const saved = saveSignalFromPayload({
      type: 'email',
      title: subject || 'Email Thread',
      source: from || 'Email',
      timestamp: timestamp || new Date().toISOString(),
      content: body || '',
    });
    res.status(201).json(saved);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ingest/meeting', (req, res) => {
  try {
    const { title, participants, transcript, timestamp } = req.body || {};
    const saved = saveSignalFromPayload({
      type: 'meeting',
      title: title || 'Meeting Transcript',
      source: participants ? `Participants: ${participants}` : 'Meeting',
      timestamp: timestamp || new Date().toISOString(),
      content: transcript || '',
    });
    res.status(201).json(saved);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ingest/screenshot', (req, res) => {
  try {
    const { title, source, text, timestamp } = req.body || {};
    const saved = saveSignalFromPayload({
      type: 'screenshot',
      title: title || 'Screenshot',
      source: source || 'Screenshot',
      timestamp: timestamp || new Date().toISOString(),
      content: text || '',
    });
    res.status(201).json(saved);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/classification/:signalId - Classify signal by ID (or use first signal)
app.get('/api/classification/:signalId?', async (req, res) => {
  try {
    const signalId = req.params.signalId;
    const signals = getSignals();
    const signal = signalId
      ? signals.find((s) => s.id === signalId)
      : signals[signals.length - 1];
    if (!signal) {
      return res.status(404).json({ error: 'No signal found' });
    }
    const classification = await ai.classifySignal(signal);
    const state = getState();
    saveState({ classification, lastSignalId: signal.id });
    res.json(classification);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/classification - Classify custom text
app.post('/api/classification', async (req, res) => {
  try {
    const { content } = req.body;
    const classification = await ai.classifySignal(content || '');
    const state = getState();
    saveState({ classification });
    res.json(classification);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/graph - Full graph state (before/after)
app.get('/api/graph', async (req, res) => {
  try {
    const state = getState();
    let { graphBefore, graphAfter, classification } = state;

    if (!graphAfter || graphAfter.nodes.length === 0) {
      if (classification) {
        graphBefore = { nodes: [], edges: [] };
        graphAfter = await ai.buildGraph(classification, graphBefore);
        saveState({ graphBefore, graphAfter });
      }
    }

    res.json({ graphBefore: graphBefore || { nodes: [], edges: [] }, graphAfter: graphAfter || { nodes: [], edges: [] } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/truth
app.get('/api/truth', (req, res) => {
  try {
    const state = getState();
    res.json(state.truthVersions || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/conflicts
app.get('/api/conflicts', async (req, res) => {
  try {
    const state = getState();
    let { conflicts, classification, lastSignalId } = state;
    const signals = getSignals();
    const signal = lastSignalId ? signals.find((s) => s.id === lastSignalId) : signals[signals.length - 1];
    if (!conflicts?.length && signal && classification) {
      conflicts = await ai.detectConflicts(signal, classification);
      const truthChanges = await ai.extractTruthChanges(signal, classification);
      const versions = state.truthVersions || [];
      versions.push({
        version: versions.length + 1,
        timestamp: new Date().toLocaleString(),
        changes: truthChanges,
      });
      saveState({ conflicts, truthVersions: versions });
    }
    res.json(conflicts || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/actions
app.get('/api/actions', async (req, res) => {
  try {
    const state = getState();
    let { actions, conflicts, classification, lastSignalId } = state;
    const signals = getSignals();
    const signal = lastSignalId ? signals.find((s) => s.id === lastSignalId) : signals[signals.length - 1];
    if (!actions?.length && signal && classification) {
      const conf = conflicts || await ai.detectConflicts(signal, classification);
      actions = await ai.suggestActions(signal, classification, conf);
      saveState({ actions });
    }
    res.json(actions || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/query - Executive query
app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;
    const state = getState();
    const result = await ai.execQuery(query || 'What changed today?', state);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/process/:signalId - Full pipeline for a signal (classify -> graph -> conflicts -> actions)
app.post('/api/process/:signalId?', async (req, res) => {
  try {
    const signalId = req.params.signalId;
    const signals = getSignals();
    const signal = signalId ? signals.find((s) => s.id === signalId) : signals[signals.length - 1];
    if (!signal) {
      return res.status(404).json({ error: 'No signal found' });
    }

    const classification = await ai.classifySignal(signal);
    const state = getState();
    const graphBefore = state.graphAfter || { nodes: [], edges: [] };
    const graphAfter = await ai.buildGraph(classification, graphBefore);
    const conflicts = await ai.detectConflicts(signal, classification);
    const truthChanges = await ai.extractTruthChanges(signal, classification);
    const actions = await ai.suggestActions(signal, classification, conflicts);

    const truthVersions = state.truthVersions || [];
    truthVersions.push({
      version: truthVersions.length + 1,
      timestamp: new Date().toLocaleString(),
      changes: truthChanges,
    });

    saveState({
      classification,
      lastSignalId: signal.id,
      graphBefore,
      graphAfter,
      conflicts,
      truthVersions,
      actions,
    });

    res.json({
      signal: signal.id,
      classification,
      graphBefore,
      graphAfter,
      conflicts,
      truthVersions,
      actions,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// TTS
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ error: 'Missing text' });
    const audio = await textToSpeech(text);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audio);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`JARVIS API running on http://localhost:${PORT}`);
});
