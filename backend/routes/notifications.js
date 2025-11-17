const express = require('express');
const router = express.Router();
<<<<<<< HEAD
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
=======
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for the current user
 */
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const { unread_only } = req.query;

  try {
    let query = `SELECT * FROM notifications WHERE recipient_user_id = ?`;
    const params = [userId];

    if (unread_only === 'true') {
      query += ` AND is_read = FALSE`;
    }

    query += ` ORDER BY created_at DESC LIMIT 50`;

    const [notifications] = await pool.execute(query, params);
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Error fetching notifications.' });
  }
});

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a notification as read
 */
router.patch('/:id/read', authenticateToken, async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.user_id;

  try {
    await pool.execute(
      `UPDATE notifications SET is_read = TRUE WHERE id = ? AND recipient_user_id = ?`,
      [notificationId, userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Error updating notification.' });
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255
  }
});

/**
 * @route   POST /api/notifications/:id/respond
 * @desc    Handle actions like 'accept' or 'decline' for an invite
 */
router.post('/:id/respond', authenticateToken, async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.user_id;
  const { action } = req.body; // 'accept' or 'decline'

  if (!['accept', 'decline'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action.' });
  }

  const connection = await pool.getConnection();
  try {
<<<<<<< HEAD
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
=======
    await connection.beginTransaction();

    // 1. Get the notification to verify ownership and get metadata
    const [rows] = await connection.execute(
      `SELECT * FROM notifications WHERE id = ? AND recipient_user_id = ?`,
      [notificationId, userId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Notification not found.' });
    }
    const notif = rows[0];
    
    // Parse metadata if it's a string, or use it directly if it's an object
    const metadata = typeof notif.metadata === 'string' ? JSON.parse(notif.metadata) : notif.metadata;

    // 2. Handle Trip Invites
    if (notif.type === 'trip_invite') {
      const tripId = metadata.trip_id;
      
      if (action === 'accept') {
        // Update membership to 'accepted'
        await connection.execute(
          `UPDATE trip_membership SET status = 'accepted' WHERE trip_id = ? AND user_id = ?`,
          [tripId, userId]
        );
        // (Optional) Create a "User joined" notification for the organizer/group could go here
      } else {
        // 'decline' - Remove the membership row entirely
        await connection.execute(
          `DELETE FROM trip_membership WHERE trip_id = ? AND user_id = ?`,
          [tripId, userId]
        );
      }
    }

    // 3. Mark the notification as read (or delete it)
    // We'll mark it read so it stays in history
    await connection.execute(
      `UPDATE notifications SET is_read = TRUE WHERE id = ?`,
      [notificationId]
    );

    await connection.commit();
    res.json({ message: `Invitation ${action}ed successfully.` });

  } catch (error) {
    await connection.rollback();
    console.error('Respond error:', error);
    res.status(500).json({ message: 'Error responding to notification.' });
  } finally {
    connection.release();
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255
  }
});

module.exports = router;