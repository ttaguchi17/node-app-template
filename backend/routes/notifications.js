// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database'); // mysql2/promise pool
const authenticateToken = require('../middleware/auth');

/**
 * POST /api/notifications
 * Create a notification.
 * body: { recipient_user_id, type, title, body, metadata }
 * (No auth here — adjust to require auth if desired)
 */
router.post('/', async (req, res) => {
  const { recipient_user_id, trip_id, type, title, body: content, metadata } = req.body;
  if (!recipient_user_id || !type) {
    return res.status(400).json({ error: 'recipient_user_id and type required' });
  }

  try {
    const metaString = metadata ? JSON.stringify(metadata) : null;

    const [result] = await pool.execute(
      `INSERT INTO notifications (recipient_user_id, trip_id, type, title, body, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [recipient_user_id, trip_id || null, type, title || null, content || null, metaString]
    );

    const insertId = result.insertId;

    // Try to load the created row (be tolerant to different PK names)
    const pkCandidates = ['id', 'notification_id', 'notificationId'];
    let row = null;
    for (const pk of pkCandidates) {
      try {
        const [rows] = await pool.execute(`SELECT * FROM notifications WHERE ${pk} = ? LIMIT 1`, [insertId]);
        if (rows && rows.length) {
          row = rows[0];
          break;
        }
      } catch (e) {
        // column might not exist; ignore and try next
      }
    }

    if (!row) {
      return res.status(201).json({ success: true, insertId });
    }

    // parse metadata if present
    try {
      if (row.metadata && typeof row.metadata === 'string') row.metadata = JSON.parse(row.metadata);
    } catch (e) { /* leave as-is if parse fails */ }

    res.status(201).json(row);
  } catch (err) {
    console.error('POST /api/notifications error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'db error' });
  }
});

/**
 * GET /api/notifications
 * Get notifications for authenticated user (limit 50).
 * Query: ?unread_only=true
 */
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user && req.user.user_id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const { unread_only } = req.query;
  try {
    let query = `SELECT * FROM notifications WHERE recipient_user_id = ?`;
    const params = [userId];

    if (unread_only === 'true') {
      query += ` AND is_read = FALSE`;
    }
    query += ` ORDER BY created_at DESC LIMIT 50`;

    console.log(`[Notifications GET] Querying notifications for user ${userId}`);
    const [rows] = await pool.execute(query, params);

    console.log(`[Notifications GET] User ${userId} fetched ${rows.length} notifications`, rows.map(r => ({ id: r.id, type: r.type, recipient: r.recipient_user_id, trip: r.trip_id })));

    // Normalize rows: parse metadata + unify id field
    const normalized = (rows || []).map((r) => {
      let meta = r.metadata;
      try { if (meta && typeof meta === 'string') meta = JSON.parse(meta); } catch (e) { /* ignore */ }

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
        raw: r,
      };
    });

    console.log(`[Notifications GET] Returning ${normalized.length} normalized notifications`);
    res.json(normalized);
  } catch (err) {
    console.error('GET /api/notifications error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'db error' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification read/unread. Body: { is_read: true/false }
 * Only authenticated users may update their own notifications.
 */
router.patch('/:id/read', authenticateToken, async (req, res) => {
  const id = req.params.id;
  const userId = req.user && req.user.user_id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const isRead = req.body.is_read === undefined ? 1 : (req.body.is_read ? 1 : 0);

  try {
    // Try common id column names
    const candidates = ['id', 'notification_id', 'notificationId'];
    let updated = false;
    for (const col of candidates) {
      try {
        const [result] = await pool.execute(
          `UPDATE notifications SET is_read = ? WHERE ${col} = ? AND recipient_user_id = ?`,
          [isRead, id, userId]
        );
        if (result && result.affectedRows > 0) {
          updated = true;
          break;
        }
      } catch (e) {
        // column might not exist -> ignore and continue
      }
    }

    if (!updated) return res.status(404).json({ error: 'Notification not found' });

    res.json({ success: true, is_read: isRead });
  } catch (err) {
    console.error('PATCH /api/notifications/:id/read error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'db error' });
  }
});

/**
 * POST /api/notifications/:id/respond
 * Handle actions like 'accept' or 'decline' for an invite notification.
 * Body: { action: 'accept'|'decline' }
 */
router.post('/:id/respond', authenticateToken, async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user && req.user.user_id;
  const { action } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!['accept', 'decline'].includes(action)) return res.status(400).json({ message: 'Invalid action.' });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT * FROM notifications WHERE id = ? AND recipient_user_id = ? LIMIT 1`,
      [notificationId, userId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Notification not found.' });
    }

    const notif = rows[0];
    const metadata = typeof notif.metadata === 'string' ? JSON.parse(notif.metadata) : notif.metadata;

    // Example: handle trip invite type
    if (notif.type === 'trip_invite' && notif.trip_id) {
      const tripId = notif.trip_id;

      if (action === 'accept') {
        // mark membership accepted (table name may vary)
        await connection.execute(
          `UPDATE trip_membership SET status = 'accepted' WHERE trip_id = ? AND user_id = ?`,
          [tripId, userId]
        );
      } else {
        // decline -> remove membership row
        await connection.execute(
          `DELETE FROM trip_membership WHERE trip_id = ? AND user_id = ?`,
          [tripId, userId]
        );
      }
    }

    // mark notification read
    await connection.execute(`UPDATE notifications SET is_read = TRUE WHERE id = ?`, [notificationId]);

    await connection.commit();
    res.json({ message: `Invitation ${action}ed successfully.` });
  } catch (error) {
    await connection.rollback();
    console.error('Respond error:', error && error.stack ? error.stack : error);
    res.status(500).json({ message: 'Error responding to notification.' });
  } finally {
    connection.release();
  }
});

module.exports = router;
