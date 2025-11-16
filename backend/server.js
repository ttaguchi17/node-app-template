// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mount routes (make sure these files exist under backend/routes)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/gmail', require('./routes/gmail'));

// New /api/users route (make sure backend/routes/users.js exists)
try {
  app.use('/api/users', require('./routes/users'));
} catch (err) {
  console.warn('Warning: /api/users route not mounted — routes/users.js not found or errored:', err && err.message);
}

// Optional: mount other routes if you have them
// (emails.js, events.js etc. - comment out if you don't have those files)
try {
  app.use('/api/emails', require('./routes/emails'));
} catch (err) {
  // ignore if not present
}
try {
  app.use('/api/events', require('./routes/events'));
} catch (err) {
  // ignore if not present
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`✅ Backend API server running at http://localhost:${port}`);
});
