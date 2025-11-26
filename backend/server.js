// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDev = NODE_ENV === 'development';

//
// Middleware
//
const allowedOrigins = isDev
  ? ['http://localhost:5173', 'http://127.0.0.1:5173']
  : (process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []);

const corsOptions = {
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // enable preflight for all routes

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

console.log(`\n🚀 Starting backend server in ${NODE_ENV} mode...`);
console.log(`Backend running at: http://localhost:${port}\n`);

/**
 * tryMount - require and mount a router, but log full stack on failure
 * mountPath - the path to mount (e.g. '/api/events')
 * modulePath - the module path to require (e.g. './routes/events')
 */
function tryMount(mountPath, modulePath) {
  try {
    // require can throw if module missing or has syntax/runtime errors
    const router = require(modulePath);
    app.use(mountPath, router);
    console.log(`✅ Mounted ${mountPath} -> ${modulePath}`);
  } catch (err) {
    // log full stack to help debugging require-time failures
    console.warn(`⚠️  Could not mount ${mountPath} -> ${modulePath}:`);
    console.warn(err && err.stack ? err.stack : err);
  }
}

// Mount API routers (missing routers will be skipped with a helpful log)
tryMount('/api/auth', './routes/auth');
tryMount('/api/me', './routes/me');
tryMount('/api/trips', './routes/trips');

// Avoid mounting another router to the exact same path which can be confusing.
// Mount invitations at /api/invitations instead (change if you prefer nested).
tryMount('/api/invitations', './routes/invitations');

tryMount('/api/gmail', './routes/gmail');
tryMount('/api/users', './routes/users');
tryMount('/api/notifications', './routes/notifications');
tryMount('/api/events', './routes/events');
tryMount('/api/emails', './routes/emails');

// optional maps export
try {
  const mapsExport = require('./routes/mapsExport');
  app.use('/maps', mapsExport);
  console.log('✅ Mounted /maps -> ./routes/mapsExport');
} catch (err) {
  console.warn('⚠️  Could not mount /maps -> ./routes/mapsExport:', err && err.message ? err.message : err);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// --- Serve Frontend Build (if present) ---
// Serve static files only if the frontend build exists
const staticPath = path.join(__dirname, '..', 'frontend', 'dist');
const frontendExists = fs.existsSync(staticPath);

if (frontendExists) {
  app.use(express.static(staticPath));

  // SPA fallback: serve index.html for non-API GET requests only.
  app.get('*', (req, res, next) => {
    // Let API routes pass through
    if (req.path.startsWith('/api/') || req.path.startsWith('/maps/')) {
      return next();
    }
    // Only serve index.html for GETs (so POST/PUT etc still get 404 from API)
    if (req.method !== 'GET') return next();
    return res.sendFile(path.join(staticPath, 'index.html'));
  });

  console.log(`📦 Serving frontend from ${staticPath}`);
} else {
  console.warn('⚠️  Frontend build not found. Skipping static serve.');
}

// 404 handler (keeps API 404 JSON)
app.use((req, res) => {
  // If request looks like an API call -> JSON 404
  if (req.path.startsWith('/api/') || req.path.startsWith('/maps/')) {
    return res.status(404).json({ message: 'Route not found' });
  }

  // Non-API clients (browsers) — if frontend exists, show SPA index (already handled above),
  // otherwise show a friendly HTML 404 or JSON depending on Accept header.
  if (req.accepts('html')) {
    return res.status(404).send('<h1>404: Page Not Found</h1><p>The page you are looking for does not exist.</p>');
  }
  if (req.accepts('json')) {
    return res.status(404).json({ message: 'Not found' });
  }
  return res.status(404).type('txt').send('Not found');
});

// Error handler (last middleware)
app.use((err, req, res, next) => {
  // Log the full error stack to the server console
  console.error('🔥 Unhandled error:', err && err.stack ? err.stack : err);

  // In development return some error details to the client for debugging
  if (isDev) {
    return res.status(500).json({
      message: err && err.message ? err.message : 'Internal server error',
      stack: err && err.stack ? err.stack : undefined,
    });
  }

  // Production: don't leak internals
  return res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`✅ Backend API server running at http://localhost:${port}`);
});
