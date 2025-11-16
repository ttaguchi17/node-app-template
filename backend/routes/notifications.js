// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// POST /api/notifications
router.post('/', async (req, res) => {
  const { recipient_user_id, type, title, body, metadata } = req.body;
  if (!recipient_user_id || !type) return res.status(400).json({ error: 'recipient_user_id and type required' });
  try {
    const [result] = await db.execute(
      `INSERT INTO notifications (recipient_user_id, type, title, body, metadata) VALUES (?, ?, ?, ?, ?)`,
      [recipient_user_id, type, title || null, body || null, metadata ? JSON.stringify(metadata) : null]
    );
    const [rows] = await db.execute(`SELECT * FROM notifications WHERE id = ?`, [result.insertId]);
    res.json(rows[0]);
  } catch (err) {
    console.error('POST /api/notifications error', err);
    res.status(500).json({ error: 'db error' });
  }
});

// GET /api/notifications?recipient_user_id=#
router.get('/', async (req, res) => {
  const rid = Number(req.query.recipient_user_id || 0);
  if (!rid) return res.json([]);
  try {
    const [rows] = await db.execute(`SELECT * FROM notifications WHERE recipient_user_id = ? ORDER BY created_at DESC`, [rid]);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/notifications error', err);
    res.status(500).json({ error: 'db error' });
  }
});

module.exports = router;
