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

// === API ROUTES ===
// We only mount our "parent" routers here.
// Child routes (like events and members) are handled inside trips.js

app.use('/api/auth', require('./routes/auth'));
app.use('/api/trips', require('./routes/trips')); // This parent router now handles /trips, /trips/:id/events, and /trips/:id/members
app.use('/api/gmail', require('./routes/gmail'));
app.use('/api/users', require('./routes/users'));



app.use('/api/notifications', require('./routes/notifications'));
// --- ALL THE OLD, CONFLICTING ROUTES ARE REMOVED ---
// (No more app.use('/api/events') or app.use('/api/emails'))


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