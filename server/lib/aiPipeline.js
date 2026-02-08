const { chat } = require('./llm');

const INTENT_TYPES = ['decision', 'task', 'fyi', 'risk', 'conflict'];
const NODE_TYPES = ['person', 'team', 'topic', 'decision', 'task', 'system'];
const TOOL_TYPES = ['slack', 'notion', 'linear', 'github', 'gmail'];
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-5-mini';

// ─── Classification ────────────────────────────────────────────
async function classifySignal(signal) {
  const content = typeof signal === 'string' ? signal : (signal.content || signal.title || '');
  const prompt = `You are an organizational intelligence system. Analyze this communication signal and extract structured data.

Signal:
${content}

Return a JSON object with this exact structure:
{
  "primary": { "intent": "decision|task|fyi|risk|conflict", "confidence": 0.0-1.0 },
  "secondary": [ { "intent": "decision|task|fyi|risk|conflict", "confidence": 0.0-1.0 } ],
  "people": [ { "name": "Full Name", "role": "optional role", "citation": "exact quote" } ],
  "teams": [ { "name": "Team Name", "citation": "exact quote" } ],
  "topics": [ { "name": "Topic", "citation": "exact quote" } ],
  "systems": [ { "name": "System/Tool", "citation": "exact quote" } ]
}

Be thorough but only include entities clearly mentioned. Keep citations short.`;
  const raw = await chat(DEFAULT_MODEL, [{ role: 'user', content: prompt }], { json: true });
  const parsed = JSON.parse(raw);
  return {
    primary: parsed.primary || { intent: 'fyi', confidence: 0.5 },
    secondary: parsed.secondary || [],
    people: parsed.people || [],
    teams: parsed.teams || [],
    topics: parsed.topics || [],
    systems: parsed.systems || [],
  };
}

// ─── Graph Update ───────────────────────────────────────────────
async function buildGraph(classification, prevGraph) {
  const prevNodes = prevGraph?.nodes || [];
  const prevEdges = prevGraph?.edges || [];
  const entities = [
    ...(classification.people || []).map((p) => ({ ...p, type: 'person' })),
    ...(classification.teams || []).map((t) => ({ ...t, type: 'team' })),
    ...(classification.topics || []).map((t) => ({ ...t, type: 'topic' })),
    ...(classification.systems || []).map((s) => ({ ...s, type: 'system' })),
  ];

  const prompt = `You are building a knowledge graph for organizational communication. Based on this classification and existing graph, add new nodes and edges.

Existing nodes: ${JSON.stringify(prevNodes.map((n) => n.label))}
Existing edges: ${JSON.stringify(prevEdges.map((e) => `${e.source}->${e.target}`))}

New entities from signal:
${JSON.stringify(entities, null, 2)}

Return JSON:
{
  "nodes": [ { "id": "slug-id", "label": "Display Name", "type": "person|team|topic|decision|task|system", "x": 100, "y": 100, "isNew": true } ],
  "edges": [ { "id": "e1", "source": "id1", "target": "id2", "label": "optional", "isNew": true, "edgeType": "normal|conflict|dependency" } ]
}

Include ALL previous nodes (isNew: false) plus new ones (isNew: true). Use kebab-case ids. Place new nodes around center 350,200.`;
  const raw = await chat(DEFAULT_MODEL, [{ role: 'user', content: prompt }], { json: true });
  const out = JSON.parse(raw);
  return {
    nodes: out.nodes || prevNodes,
    edges: out.edges || prevEdges,
  };
}

// ─── Conflicts ──────────────────────────────────────────────────
async function detectConflicts(signal, classification) {
  const content = typeof signal === 'string' ? signal : (signal.content || '');
  const prompt = `Analyze this organizational signal for conflicts (disagreements, misalignment, blocked decisions).

Signal:
${content}

Entities: ${JSON.stringify({ people: classification.people, teams: classification.teams })}

Return JSON:
{
  "conflicts": [
    {
      "title": "Conflict title",
      "sourceA": { "person": "Name", "claim": "their position" },
      "sourceB": { "person": "Name", "claim": "their position" },
      "severity": "high|medium|low",
      "suggestedResolution": "actionable resolution"
    }
  ]
}
If no conflicts, return { "conflicts": [] }.`;
  const raw = await chat(DEFAULT_MODEL, [{ role: 'user', content: prompt }], { json: true });
  const parsed = JSON.parse(raw);
  const list = parsed.conflicts || [];
  return list.map((c, i) => ({ ...c, id: `c${i + 1}` }));
}

// ─── Truth Changes ──────────────────────────────────────────────
async function extractTruthChanges(signal, classification) {
  const content = typeof signal === 'string' ? signal : (signal.content || '');
  const prompt = `Extract verifiable facts and decisions from this signal that should update the organizational source of truth.

Signal:
${content}

Return JSON:
{
  "changes": [
    { "field": "Field name", "from": "old value or null", "to": "new value", "reason": "why", "owner": "person name" }
  ]
}
Only include concrete decisions, dates, allocations. If nothing, return { "changes": [] }.`;
  const raw = await chat(DEFAULT_MODEL, [{ role: 'user', content: prompt }], { json: true });
  const parsed = JSON.parse(raw);
  return parsed.changes || [];
}

// ─── Action Items ───────────────────────────────────────────────
async function suggestActions(signal, classification, conflicts) {
  const content = typeof signal === 'string' ? signal : (signal.content || '');
  const prompt = `Based on this signal and any conflicts, suggest action items to route to stakeholders.

Signal:
${content}

Conflicts: ${JSON.stringify(conflicts || [])}

Return JSON:
{
  "actions": [
    {
      "tool": "slack|notion|linear|github|gmail",
      "stakeholder": "Person Name",
      "reason": "why",
      "context": "brief context",
      "preview": "draft message or task text",
      "requiresConfirmation": true,
      "priority": "high|medium|low"
    }
  ]
}
Limit to 5 actions. Be specific.`;
  const raw = await chat(DEFAULT_MODEL, [{ role: 'user', content: prompt }], { json: true });
  const parsed = JSON.parse(raw);
  const list = parsed.actions || [];
  return list.map((a, i) => ({ ...a, id: `a${i + 1}` }));
}

// ─── Executive Query ────────────────────────────────────────────
async function execQuery(query, state) {
  const { graphAfter, truthVersions, conflicts, actions } = state;
  const context = `
Graph: ${JSON.stringify(graphAfter, null, 2)}
Truth versions: ${JSON.stringify((truthVersions || []).slice(-3), null, 2)}
Conflicts: ${JSON.stringify(conflicts || [], null, 2)}
Actions: ${JSON.stringify(actions || [], null, 2)}
`;

  const prompt = `You are an AI Chief of Staff. Answer this executive query about the organization.

Query: ${query}

Context:
${context}

Return JSON:
{
  "summary": "2-3 sentence briefing",
  "stakeholders": [ { "name": "Name", "impact": "their impact", "action": "action taken or pending" } ],
  "pendingActions": number,
  "riskLevel": "High|Medium|Low"
}`;
  const raw = await chat('openai/gpt-4o-mini', [{ role: 'user', content: prompt }], { json: true });
  return JSON.parse(raw);
}

module.exports = {
  classifySignal,
  buildGraph,
  detectConflicts,
  extractTruthChanges,
  suggestActions,
  execQuery,
};
