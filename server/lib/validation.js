/**
 * Input validation utilities for Express server
 * Provides schema validation and sanitization
 */

// ─── Validation Schemas ───────────────────────────────────────────

const VALID_SIGNAL_TYPES = ['slack', 'meeting', 'screenshot', 'email'];
const MAX_CONTENT_LENGTH = 50000;  // 50KB max for content
const MAX_TITLE_LENGTH = 500;
const MAX_SOURCE_LENGTH = 500;
const MAX_QUERY_LENGTH = 2000;
const MAX_TEXT_LENGTH = 5000;  // For TTS

/**
 * Validates and sanitizes a string field
 */
function sanitizeString(value, maxLength = 1000) {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value !== 'string') {
    return String(value).slice(0, maxLength);
  }
  
  // Remove null bytes and control characters (except newlines and tabs)
  let sanitized = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim and limit length
  return sanitized.trim().slice(0, maxLength);
}

/**
 * Validates signal input
 */
function validateSignal(body) {
  const errors = [];
  
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }
  
  // Validate type if provided
  if (body.type !== undefined) {
    if (!VALID_SIGNAL_TYPES.includes(body.type)) {
      errors.push(`type must be one of: ${VALID_SIGNAL_TYPES.join(', ')}`);
    }
  }
  
  // Validate content - must have some content
  const content = body.content || body.summary;
  if (!content || (typeof content === 'string' && content.trim().length === 0)) {
    errors.push('content is required and cannot be empty');
  }
  
  if (content && typeof content === 'string' && content.length > MAX_CONTENT_LENGTH) {
    errors.push(`content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`);
  }
  
  // Validate optional fields
  if (body.title && typeof body.title === 'string' && body.title.length > MAX_TITLE_LENGTH) {
    errors.push(`title exceeds maximum length of ${MAX_TITLE_LENGTH} characters`);
  }
  
  if (body.source && typeof body.source === 'string' && body.source.length > MAX_SOURCE_LENGTH) {
    errors.push(`source exceeds maximum length of ${MAX_SOURCE_LENGTH} characters`);
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // Return sanitized data
  return {
    valid: true,
    data: {
      id: body.id ? sanitizeString(body.id, 100) : undefined,
      type: body.type || 'screenshot',
      title: sanitizeString(body.title, MAX_TITLE_LENGTH) || 'New Signal',
      source: sanitizeString(body.source, MAX_SOURCE_LENGTH) || 'Unknown',
      timestamp: body.timestamp || new Date().toISOString(),
      content: sanitizeString(content, MAX_CONTENT_LENGTH)
    }
  };
}

/**
 * Validates slack ingest input
 */
function validateSlackIngest(body) {
  const errors = [];
  
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }
  
  // Text is required
  if (!body.text || (typeof body.text === 'string' && body.text.trim().length === 0)) {
    errors.push('text is required and cannot be empty');
  }
  
  if (body.text && typeof body.text === 'string' && body.text.length > MAX_CONTENT_LENGTH) {
    errors.push(`text exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`);
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return {
    valid: true,
    data: {
      text: sanitizeString(body.text, MAX_CONTENT_LENGTH),
      user: sanitizeString(body.user, 200),
      channel: sanitizeString(body.channel, 200),
      ts: body.ts
    }
  };
}

/**
 * Validates email ingest input
 */
function validateEmailIngest(body) {
  const errors = [];
  
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }
  
  // Body is required
  if (!body.body || (typeof body.body === 'string' && body.body.trim().length === 0)) {
    errors.push('body is required and cannot be empty');
  }
  
  if (body.body && typeof body.body === 'string' && body.body.length > MAX_CONTENT_LENGTH) {
    errors.push(`body exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`);
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return {
    valid: true,
    data: {
      subject: sanitizeString(body.subject, MAX_TITLE_LENGTH),
      from: sanitizeString(body.from, 500),
      body: sanitizeString(body.body, MAX_CONTENT_LENGTH),
      timestamp: body.timestamp
    }
  };
}

/**
 * Validates meeting ingest input
 */
function validateMeetingIngest(body) {
  const errors = [];
  
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }
  
  // Transcript is required
  if (!body.transcript || (typeof body.transcript === 'string' && body.transcript.trim().length === 0)) {
    errors.push('transcript is required and cannot be empty');
  }
  
  if (body.transcript && typeof body.transcript === 'string' && body.transcript.length > MAX_CONTENT_LENGTH) {
    errors.push(`transcript exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`);
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return {
    valid: true,
    data: {
      title: sanitizeString(body.title, MAX_TITLE_LENGTH),
      participants: sanitizeString(body.participants, 1000),
      transcript: sanitizeString(body.transcript, MAX_CONTENT_LENGTH),
      timestamp: body.timestamp
    }
  };
}

/**
 * Validates screenshot ingest input
 */
function validateScreenshotIngest(body) {
  const errors = [];
  
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }
  
  // Text is required
  if (!body.text || (typeof body.text === 'string' && body.text.trim().length === 0)) {
    errors.push('text is required and cannot be empty');
  }
  
  if (body.text && typeof body.text === 'string' && body.text.length > MAX_CONTENT_LENGTH) {
    errors.push(`text exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`);
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return {
    valid: true,
    data: {
      title: sanitizeString(body.title, MAX_TITLE_LENGTH),
      source: sanitizeString(body.source, MAX_SOURCE_LENGTH),
      text: sanitizeString(body.text, MAX_CONTENT_LENGTH),
      timestamp: body.timestamp
    }
  };
}

/**
 * Validates query input
 */
function validateQuery(body) {
  const errors = [];
  
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }
  
  if (!body.query || (typeof body.query === 'string' && body.query.trim().length === 0)) {
    errors.push('query is required and cannot be empty');
  }
  
  if (body.query && typeof body.query === 'string' && body.query.length > MAX_QUERY_LENGTH) {
    errors.push(`query exceeds maximum length of ${MAX_QUERY_LENGTH} characters`);
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return {
    valid: true,
    data: {
      query: sanitizeString(body.query, MAX_QUERY_LENGTH)
    }
  };
}

/**
 * Validates classification input
 */
function validateClassification(body) {
  const errors = [];
  
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }
  
  if (!body.content || (typeof body.content === 'string' && body.content.trim().length === 0)) {
    errors.push('content is required and cannot be empty');
  }
  
  if (body.content && typeof body.content === 'string' && body.content.length > MAX_CONTENT_LENGTH) {
    errors.push(`content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`);
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return {
    valid: true,
    data: {
      content: sanitizeString(body.content, MAX_CONTENT_LENGTH)
    }
  };
}

/**
 * Validates TTS input
 */
function validateTTS(body) {
  const errors = [];
  
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }
  
  if (!body.text || (typeof body.text === 'string' && body.text.trim().length === 0)) {
    errors.push('text is required and cannot be empty');
  }
  
  if (body.text && typeof body.text === 'string' && body.text.length > MAX_TEXT_LENGTH) {
    errors.push(`text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`);
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return {
    valid: true,
    data: {
      text: sanitizeString(body.text, MAX_TEXT_LENGTH)
    }
  };
}

/**
 * Validates signal ID parameter
 */
function validateSignalId(signalId) {
  if (!signalId) {
    return { valid: true, data: null };
  }
  
  // Signal IDs should be alphanumeric with underscores/hyphens
  const sanitized = sanitizeString(signalId, 100);
  
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    return { 
      valid: false, 
      errors: ['signalId must contain only alphanumeric characters, underscores, and hyphens'] 
    };
  }
  
  return { valid: true, data: sanitized };
}

/**
 * Validation middleware factory
 */
function validate(validator) {
  return (req, res, next) => {
    const result = validator(req.body);
    
    if (!result.valid) {
      return res.status(400).json({
        error: 'Validation Error',
        details: result.errors
      });
    }
    
    req.validated = result.data;
    next();
  };
}

module.exports = {
  sanitizeString,
  validateSignal,
  validateSlackIngest,
  validateEmailIngest,
  validateMeetingIngest,
  validateScreenshotIngest,
  validateQuery,
  validateClassification,
  validateTTS,
  validateSignalId,
  validate,
  MAX_CONTENT_LENGTH,
  MAX_QUERY_LENGTH,
  MAX_TEXT_LENGTH
};
