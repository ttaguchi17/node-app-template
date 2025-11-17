const express = require('express');
const router = express.Router();
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
  }
});

module.exports = router;