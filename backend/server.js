// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // adjust origin in production if needed
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Simple boot-time banner
console.log(`\nStarting backend server (env: ${process.env.NODE_ENV || 'development'})`);
console.log(`Listening on http://localhost:${port}\n`);

// --- Mount primary routes ---
// Use try/catch so a missing/buggy route file doesn't crash the whole server.
// Each mounted route logs success or a warning on failure.

function tryMount(mountPath, modulePath) {
  try {
    const router = require(modulePath);
    app.use(mountPath, router);
    console.log(`mounted ${mountPath} -> ${modulePath}`);
  } catch (err) {
    console.warn(`WARNING: could not mount ${mountPath} -> ${modulePath}:`, err && err.message);
  }
}

// Core routes
tryMount('/api/auth', './routes/auth');           // optional/auth
tryMount('/api/trips', './routes/trips');         // trip CRUD + members/events (if present)

// If you split invitations into its own file, also mount it under /api/trips so routes like
// '/:tripId/invitations' still map to '/api/trips/:tripId/invitations'
tryMount('/api/trips', './routes/invitations');   // optional/invitations (may overlap - it's okay)

// Other common endpoints
tryMount('/api/users', './routes/users');
tryMount('/api/gmail', './routes/gmail');
tryMount('/api/emails', './routes/emails');
tryMount('/api/events', './routes/events');
tryMount('/api/notifications', './routes/notifications');

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Optional: serve built frontend (uncomment if you build frontend into ../frontend/dist)
// const staticPath = path.join(__dirname, '..', 'frontend', 'dist');
// if (fs.existsSync(staticPath)) {
//   app.use(express.static(staticPath));
//   app.get('*', (req, res) => res.sendFile(path.join(staticPath, 'index.html')));
//   console.log(`Serving frontend from ${staticPath}`);
// }

// 404 handler (API)
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler (last middleware)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`✅ Backend API server running at http://localhost:${port}`);
});
