// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // mysql2/promise pool

// POST /api/notifications
// body: { recipient_user_id, type, title, body, metadata }
router.post('/', async (req, res) => {
  const { recipient_user_id, type, title, body, metadata } = req.body;
  if (!recipient_user_id || !type) {
    return res.status(400).json({ error: 'recipient_user_id and type required' });
  }

  try {
    const metaString = metadata ? JSON.stringify(metadata) : null;

    const [result] = await db.execute(
      `INSERT INTO notifications (recipient_user_id, type, title, body, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [recipient_user_id, type, title || null, body || null, metaString]
    );

    // MySQL insertId -> fetch inserted row (use notification_id if that's your PK)
    const insertId = result.insertId;

    // try a few candidate PK names to be tolerant
    const pkNames = ['notification_id', 'id', 'notificationId'];
    let row = null;
    for (const pk of pkNames) {
      const [rows] = await db.execute(`SELECT * FROM notifications WHERE ${pk} = ? LIMIT 1`, [insertId]);
      if (rows && rows.length) {
        row = rows[0];
        break;
      }
    }

    if (!row) {
      // fallback: return simple created info
      return res.status(201).json({ success: true, insertId });
    }

    // parse metadata JSON if present
    try {
      if (row.metadata && typeof row.metadata === 'string') {
        row.metadata = JSON.parse(row.metadata);
      }
    } catch (e) {
      // leave metadata as raw string if parse fails
    }

    res.status(201).json(row);
  } catch (err) {
    console.error('POST /api/notifications error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'db error' });
  }
});

// GET /api/notifications?recipient_user_id=#
router.get('/', async (req, res) => {
  const rid = Number(req.query.recipient_user_id || 0);
  if (!rid) return res.json([]);
  try {
    const [rows] = await db.execute(
      `SELECT * FROM notifications WHERE recipient_user_id = ? ORDER BY created_at DESC LIMIT 100`,
      [rid]
    );

    const normalized = (rows || []).map(r => {
      // parse metadata if string
      let meta = r.metadata;
      try { if (meta && typeof meta === 'string') meta = JSON.parse(meta); } catch (e) { /* ignore */ }
      // unify id column name
      const id = r.notification_id ?? r.id ?? r.notificationId ?? null;
      return {
        id,
        recipient_user_id: r.recipient_user_id,
        type: r.type,
        title: r.title,
        body: r.body,
        metadata: meta,
        is_read: Number(r.is_read || r.read_flag || 0),
        created_at: r.created_at,
        raw: r
      };
    });

    res.json(normalized);
  } catch (err) {
    console.error('GET /api/notifications error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'db error' });
  }
});

// PATCH /api/notifications/:id/read  -> mark read/unread
router.patch('/:id/read', async (req, res) => {
  const id = req.params.id;
  const isRead = req.body.is_read === undefined ? 1 : (req.body.is_read ? 1 : 0);

  try {
    // update by common PK candidates
    const candidates = ['notification_id', 'id', 'notificationId'];
    let updated = false;
    for (const col of candidates) {
      try {
        const [result] = await db.execute(`UPDATE notifications SET is_read = ? WHERE ${col} = ?`, [isRead, id]);
        if (result && result.affectedRows > 0) {
          updated = true;
          break;
        }
      } catch (e) {
        // column might not exist — ignore and try next
      }
    }
    if (!updated) return res.status(404).json({ error: 'Notification not found' });

    res.json({ success: true, is_read: isRead });
  } catch (err) {
    console.error('PATCH /api/notifications/:id/read error', err);
    res.status(500).json({ error: 'db error' });
  }
});

module.exports = router;
