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

// --- Boot Log ---
console.log(`\n🚀 Starting backend server in ${process.env.NODE_ENV || 'development'} mode...`);
console.log(`Backend running at: http://localhost:${port}\n`);

// --- Dynamic Route Mounting ---
function tryMount(mountPath, modulePath) {
  try {
    const router = require(modulePath);
    app.use(mountPath, router);
    console.log(`✅ Mounted ${mountPath} -> ${modulePath}`);
  } catch (err) {
    console.warn(`⚠️  Could not mount ${mountPath} -> ${modulePath}:`, err.message);
  }
}

// Core API routes (optional routes will be skipped if missing)
tryMount('/api/auth', './routes/auth');
tryMount('/api/trips', './routes/trips'); // This includes /api/trips/:tripId/invitations
tryMount('/api/gmail', './routes/gmail');
tryMount('/api/users', './routes/users');
tryMount('/api/notifications', './routes/notifications');
tryMount('/api/events', './routes/events');
tryMount('/api/emails', './routes/emails');
tryMount('/api/calendar', './routes/calendar');

try {
  const mapsExport = require('./routes/mapsExport');
  app.use('/maps', mapsExport);
  console.log('✅ Mounted /maps -> ./routes/mapsExport');
} catch (err) {
  console.warn('⚠️  Could not mount /maps -> ./routes/mapsExport:', err.message);
}

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// --- Serve Frontend Build (SPA fallback for React Router) ---
const staticPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
  console.log(`📦 Serving frontend from ${staticPath}`);
} else {
  console.warn('⚠️  Frontend build not found. Skipping static serve.');
}

// 404 handler (API and others)
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler (last middleware)
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled error:', err && err.stack ? err.stack : err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`✅ Backend API server running at http://localhost:${port}`);
});