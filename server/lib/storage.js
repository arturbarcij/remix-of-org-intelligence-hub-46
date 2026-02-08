const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const SIGNALS_FILE = path.join(DATA_DIR, 'signals.json');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadJson(file, defaultVal) {
  ensureDir();
  try {
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
  } catch {
    return defaultVal;
  }
}

function saveJson(file, data) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ─── Signals ──────────────────────────────────────────────────
function getSignals() {
  const data = loadJson(SIGNALS_FILE, { signals: [] });
  return data.signals || [];
}

function addSignal(signal) {
  const data = loadJson(SIGNALS_FILE, { signals: [] });
  const id = signal.id || `sig_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const s = { ...signal, id };
  data.signals.push(s);
  if (data.signals.length > 500) data.signals = data.signals.slice(-500);
  saveJson(SIGNALS_FILE, data);
  return s;
}

// ─── Organizational State (classification, graph, truth, conflicts, actions) ───
const defaultState = {
  classification: null,
  graphBefore: { nodes: [], edges: [] },
  graphAfter: { nodes: [], edges: [] },
  truthVersions: [],
  conflicts: [],
  actions: [],
};

function getState() {
  return loadJson(STATE_FILE, defaultState);
}

function saveState(partial) {
  const state = { ...getState(), ...partial };
  saveJson(STATE_FILE, state);
  return state;
}

module.exports = {
  getSignals,
  addSignal,
  getState,
  saveState,
};
