const https = require('https');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function chat(model, messages, options = {}) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not set');
  }
  const payload = JSON.stringify({
    model: model || 'openai/gpt-4o-mini',
    messages,
    max_tokens: options.maxTokens || 4000,
    response_format: options.json ? { type: 'json_object' } : undefined,
  });
  const opt = {
    hostname: 'openrouter.ai',
    path: '/api/v1/chat/completions',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://jarvis.local',
      'X-Title': 'JARVIS Org Intelligence',
    },
  };
  const res = await makeRequest(opt, payload);
  if (res.error) throw new Error(res.error.message || 'API error');
  const content = res.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content in response');
  return content;
}

module.exports = { chat };
