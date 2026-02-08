require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getSignals, addSignal, getState, saveState } = require('./lib/storage');
const ai = require('./lib/aiPipeline');
const { textToSpeech } = require('./lib/elevenlabs');
const { authenticateRequest, rateLimit } = require('./lib/auth');
const { 
  validateSignal, 
  validateSlackIngest,
  validateEmailIngest,
  validateMeetingIngest,
  validateScreenshotIngest,
  validateQuery, 
  validateClassification, 
  validateTTS,
  validateSignalId,
  validate 
} = require('./lib/validation');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS Configuration ────────────────────────────────────────────
// More restrictive CORS - only allow specific origins in production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400  // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));  // Reduced from 10mb

// ─── Global Rate Limiting ──────────────────────────────────────────
app.use(rateLimit({ windowMs: 60000, maxRequests: 100, message: 'Too many requests' }));

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

// ─── Health Check (public) ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// ─── Protected Routes ──────────────────────────────────────────────
// All routes below require authentication

// GET /signals
app.get('/api/signals', authenticateRequest, (req, res) => {
  try {
    const signals = getSignals();
    res.json(signals);
  } catch (e) {
    console.error('Error fetching signals:', e.message);
    res.status(500).json({ error: 'Failed to fetch signals' });
  }
});

// POST /api/signals - Ingest new signal
app.post('/api/signals', authenticateRequest, validate(validateSignal), (req, res) => {
  try {
    const data = req.validated;
    const signal = {
      id: data.id || `sig_${Date.now()}`,
      type: data.type,
      title: data.title,
      source: data.source,
      timestamp: data.timestamp,
      content: data.content,
      userId: req.user.id  // Track who created the signal
    };
    const saved = addSignal(signal);
    res.status(201).json(saved);
  } catch (e) {
    console.error('Error adding signal:', e.message);
    res.status(500).json({ error: 'Failed to add signal' });
  }
});

// ─── Ingest endpoints (protected) ──────────────────────────────────

app.post('/api/ingest/slack', authenticateRequest, validate(validateSlackIngest), (req, res) => {
  try {
    const { text, user, channel, ts } = req.validated;
    const signal = {
      id: `sig_${Date.now()}`,
      type: 'slack',
      title: channel ? `#${channel}` : 'Slack Message',
      source: user || 'Slack',
      timestamp: ts ? new Date(Number(ts) * 1000).toISOString() : new Date().toISOString(),
      content: text,
      userId: req.user.id
    };
    const saved = addSignal(signal);
    res.status(201).json(saved);
  } catch (e) {
    console.error('Error ingesting slack:', e.message);
    res.status(500).json({ error: 'Failed to ingest slack message' });
  }
});

app.post('/api/ingest/email', authenticateRequest, validate(validateEmailIngest), (req, res) => {
  try {
    const { subject, from, body, timestamp } = req.validated;
    const signal = {
      id: `sig_${Date.now()}`,
      type: 'email',
      title: subject || 'Email Thread',
      source: from || 'Email',
      timestamp: timestamp || new Date().toISOString(),
      content: body,
      userId: req.user.id
    };
    const saved = addSignal(signal);
    res.status(201).json(saved);
  } catch (e) {
    console.error('Error ingesting email:', e.message);
    res.status(500).json({ error: 'Failed to ingest email' });
  }
});

app.post('/api/ingest/meeting', authenticateRequest, validate(validateMeetingIngest), (req, res) => {
  try {
    const { title, participants, transcript, timestamp } = req.validated;
    const signal = {
      id: `sig_${Date.now()}`,
      type: 'meeting',
      title: title || 'Meeting Transcript',
      source: participants ? `Participants: ${participants}` : 'Meeting',
      timestamp: timestamp || new Date().toISOString(),
      content: transcript,
      userId: req.user.id
    };
    const saved = addSignal(signal);
    res.status(201).json(saved);
  } catch (e) {
    console.error('Error ingesting meeting:', e.message);
    res.status(500).json({ error: 'Failed to ingest meeting' });
  }
});

app.post('/api/ingest/screenshot', authenticateRequest, validate(validateScreenshotIngest), (req, res) => {
  try {
    const { title, source, text, timestamp } = req.validated;
    const signal = {
      id: `sig_${Date.now()}`,
      type: 'screenshot',
      title: title || 'Screenshot',
      source: source || 'Screenshot',
      timestamp: timestamp || new Date().toISOString(),
      content: text,
      userId: req.user.id
    };
    const saved = addSignal(signal);
    res.status(201).json(saved);
  } catch (e) {
    console.error('Error ingesting screenshot:', e.message);
    res.status(500).json({ error: 'Failed to ingest screenshot' });
  }
});

// ─── Classification endpoints ──────────────────────────────────────

app.get('/api/classification/:signalId?', authenticateRequest, (req, res, next) => {
  // Validate signalId parameter
  const validation = validateSignalId(req.params.signalId);
  if (!validation.valid) {
    return res.status(400).json({ error: 'Validation Error', details: validation.errors });
  }
  req.validatedSignalId = validation.data;
  next();
}, async (req, res) => {
  try {
    const signalId = req.validatedSignalId;
    const signals = getSignals();
    const signal = signalId
      ? signals.find((s) => s.id === signalId)
      : signals[signals.length - 1];
    if (!signal) {
      return res.status(404).json({ error: 'No signal found' });
    }
    const classification = await ai.classifySignal(signal);
    saveState({ classification, lastSignalId: signal.id });
    res.json(classification);
  } catch (e) {
    console.error('Error classifying signal:', e.message);
    res.status(500).json({ error: 'Failed to classify signal' });
  }
});

app.post('/api/classification', authenticateRequest, validate(validateClassification), async (req, res) => {
  try {
    const { content } = req.validated;
    const classification = await ai.classifySignal(content);
    saveState({ classification });
    res.json(classification);
  } catch (e) {
    console.error('Error classifying content:', e.message);
    res.status(500).json({ error: 'Failed to classify content' });
  }
});

// ─── Graph endpoint ────────────────────────────────────────────────

app.get('/api/graph', authenticateRequest, async (req, res) => {
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

    res.json({ 
      graphBefore: graphBefore || { nodes: [], edges: [] }, 
      graphAfter: graphAfter || { nodes: [], edges: [] } 
    });
  } catch (e) {
    console.error('Error fetching graph:', e.message);
    res.status(500).json({ error: 'Failed to fetch graph' });
  }
});

// ─── Truth endpoint ────────────────────────────────────────────────

app.get('/api/truth', authenticateRequest, (req, res) => {
  try {
    const state = getState();
    res.json(state.truthVersions || []);
  } catch (e) {
    console.error('Error fetching truth:', e.message);
    res.status(500).json({ error: 'Failed to fetch truth versions' });
  }
});

// ─── Conflicts endpoint ────────────────────────────────────────────

app.get('/api/conflicts', authenticateRequest, async (req, res) => {
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
    console.error('Error fetching conflicts:', e.message);
    res.status(500).json({ error: 'Failed to fetch conflicts' });
  }
});

// ─── Actions endpoint ──────────────────────────────────────────────

app.get('/api/actions', authenticateRequest, async (req, res) => {
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
    console.error('Error fetching actions:', e.message);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

// ─── Query endpoint (with stricter rate limiting) ──────────────────

app.post('/api/query', 
  authenticateRequest, 
  rateLimit({ windowMs: 60000, maxRequests: 20, message: 'Query rate limit exceeded' }),
  validate(validateQuery), 
  async (req, res) => {
    try {
      const { query } = req.validated;
      const state = getState();
      const result = await ai.execQuery(query, state);
      res.json(result);
    } catch (e) {
      console.error('Error executing query:', e.message);
      res.status(500).json({ error: 'Failed to execute query' });
    }
  }
);

// ─── Process endpoint (with stricter rate limiting) ────────────────

app.post('/api/process/:signalId?', 
  authenticateRequest,
  rateLimit({ windowMs: 60000, maxRequests: 10, message: 'Process rate limit exceeded' }),
  (req, res, next) => {
    const validation = validateSignalId(req.params.signalId);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation Error', details: validation.errors });
    }
    req.validatedSignalId = validation.data;
    next();
  },
  async (req, res) => {
    try {
      const signalId = req.validatedSignalId;
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
      console.error('Error processing signal:', e.message);
      res.status(500).json({ error: 'Failed to process signal' });
    }
  }
);

// ─── TTS endpoint ──────────────────────────────────────────────────

app.post('/api/tts', 
  authenticateRequest, 
  rateLimit({ windowMs: 60000, maxRequests: 30, message: 'TTS rate limit exceeded' }),
  validate(validateTTS), 
  async (req, res) => {
    try {
      const { text } = req.validated;
      const audio = await textToSpeech(text);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(audio);
    } catch (e) {
      console.error('Error generating TTS:', e.message);
      res.status(500).json({ error: 'Failed to generate speech' });
    }
  }
);

// ─── Error handling middleware ─────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`JARVIS API running on http://localhost:${PORT}`);
  if (process.env.DISABLE_AUTH === 'true') {
    console.warn('⚠️  WARNING: Authentication is DISABLED (DISABLE_AUTH=true)');
  }
});
