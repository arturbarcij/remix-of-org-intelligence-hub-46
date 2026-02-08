/**
 * Authentication middleware for Express server
 * Validates JWT tokens from Supabase Auth
 */
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client for server-side auth validation
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured. Auth disabled.');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Authentication middleware
 * Validates Bearer token from Authorization header
 */
async function authenticateRequest(req, res, next) {
  // Skip auth in development if explicitly disabled
  if (process.env.DISABLE_AUTH === 'true') {
    req.user = { id: 'dev-user', email: 'dev@localhost' };
    return next();
  }
  
  const supabase = getSupabaseClient();
  
  // If Supabase is not configured, reject all requests
  if (!supabase) {
    return res.status(503).json({ 
      error: 'Authentication service not configured',
      message: 'Server requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables'
    });
  }
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header. Expected: Bearer <token>'
    });
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  if (!token || token.length < 10) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid token format'
    });
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.warn('Auth validation failed:', error?.message || 'No user found');
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }
    
    // Attach user to request for downstream handlers
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'Failed to validate token'
    });
  }
}

/**
 * Optional auth middleware - continues even if not authenticated
 * Sets req.user if valid token provided, otherwise req.user is null
 */
async function optionalAuth(req, res, next) {
  const supabase = getSupabaseClient();
  const authHeader = req.headers.authorization;
  
  if (!supabase || !authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    req.user = user || null;
  } catch {
    req.user = null;
  }
  
  next();
}

/**
 * Simple rate limiting middleware
 * Limits requests per IP address
 */
const rateLimitMap = new Map();

function rateLimit(options = {}) {
  const { 
    windowMs = 60000,  // 1 minute window
    maxRequests = 60,  // 60 requests per window
    message = 'Too many requests, please try again later'
  } = options;
  
  // Clean up old entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now - value.windowStart > windowMs) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000);
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    let entry = rateLimitMap.get(ip);
    
    if (!entry || now - entry.windowStart > windowMs) {
      entry = { count: 1, windowStart: now };
      rateLimitMap.set(ip, entry);
    } else {
      entry.count++;
    }
    
    if (entry.count > maxRequests) {
      return res.status(429).json({ 
        error: 'Too Many Requests',
        message,
        retryAfter: Math.ceil((entry.windowStart + windowMs - now) / 1000)
      });
    }
    
    next();
  };
}

module.exports = {
  authenticateRequest,
  optionalAuth,
  rateLimit,
  getSupabaseClient
};
