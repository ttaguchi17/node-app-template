// backend/routes/invitation-actions.js
// GLOBAL invitation routes (NOT nested under trips)
// These handle invitation responses and queries that don't need trip context

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const pool = require('../config/database');

/**
 * GET /api/invitations
 * Get all pending invitations for the authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
  const userId = Number(req.user.user_id || req.user.id);

  try {
    // Get invitations from invitations table (if exists)
    let invitations = [];
    try {
      const [invRows] = await pool.execute(
        `SELECT i.*, t.name as trip_name, u.email as invited_by_email
         FROM invitations i
         LEFT JOIN trip t ON i.trip_id = t.trip_id
         LEFT JOIN user u ON i.invited_by_user_id = u.user_id
         WHERE i.invited_user_id = ? AND i.status = 'pending'
         ORDER BY i.created_at DESC`,
        [userId]
      );
      invitations = invRows || [];
    } catch (e) {
      // Table might not exist
    }

    // Also get pending from trip_membership
    const [membershipInvites] = await pool.execute(
      `SELECT tm.*, t.name as trip_name, u.email as invited_by_email
       FROM trip_membership tm
       LEFT JOIN trip t ON tm.trip_id = t.trip_id
       LEFT JOIN user u ON tm.invited_by_user_id = u.user_id
       WHERE tm.user_id = ? AND tm.status = 'invited'
       ORDER BY tm.invited_at DESC`,
      [userId]
    );

    res.json({
      invitations: invitations,
      pending_memberships: membershipInvites || []
    });
  } catch (err) {
    console.error('GET /api/invitations error', err);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

/**
 * POST /api/invitations/:invitationId/respond
 * Body: { action: 'accept' | 'decline' }
 *
 * User responds to an invitation using ONLY the invitation ID.
 * Perfect for email links like: myapp.com/invitations/99
 */
router.post('/:invitationId/respond', authenticateToken, async (req, res) => {
  const invitationId = Number(req.params.invitationId);
  if (Number.isNaN(invitationId)) return res.status(400).json({ error: 'Invalid invitationId' });

  const action = String((req.body.action || '').toLowerCase()).trim();
  if (!['accept', 'decline'].includes(action)) return res.status(400).json({ error: 'Invalid action' });

  const responderId = Number(req.user && (req.user.user_id || req.user.id));

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Load invitation row
    const [invRows] = await conn.execute(
      `SELECT * FROM invitations WHERE invitation_id = ? LIMIT 1`,
      [invitationId]
    );
    if (!invRows || invRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Invitation not found' });
    }
    const inv = invRows[0];

    // Verify this user is the invitee
    if (inv.invited_user_id && Number(inv.invited_user_id) !== responderId) {
      await conn.rollback();
      return res.status(403).json({ error: 'Not your invitation' });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    
    // Update invitation status
    await conn.execute(
      `UPDATE invitations SET status = ?, responded_at = NOW() WHERE invitation_id = ?`,
      [newStatus, invitationId]
    );

    if (action === 'accept') {
      // Ensure trip_membership exists and set to accepted
      const [exists] = await conn.execute(
        `SELECT * FROM trip_membership WHERE trip_id = ? AND user_id = ? LIMIT 1`,
        [inv.trip_id, responderId]
      );
      
      if (exists && exists.length > 0) {
        await conn.execute(
          `UPDATE trip_membership SET status = 'accepted', responded_at = NOW() WHERE trip_id = ? AND user_id = ?`,
          [inv.trip_id, responderId]
        );
      } else {
        await conn.execute(
          `INSERT INTO trip_membership (trip_id, user_id, role, status, invited_by_user_id, invited_at, responded_at)
           VALUES (?, ?, 'member', 'accepted', ?, NOW(), NOW())`,
          [inv.trip_id, responderId, inv.invited_by_user_id || null]
        );
      }
    } else {
      // Decline: update membership if exists
      await conn.execute(
        `UPDATE trip_membership SET status = 'declined', responded_at = NOW() WHERE trip_id = ? AND user_id = ?`,
        [inv.trip_id, responderId]
      );
    }

    // Mark related notifications as read (best-effort)
    try {
      await conn.execute(
        `UPDATE notifications SET is_read = 1 WHERE JSON_EXTRACT(metadata, '$.invitation_id') = ?`,
        [String(invitationId)]
      );
    } catch (_) {
      // Ignore if not supported
    }

    // Notify inviter about the response (best-effort)
    try {
      if (inv.invited_by_user_id) {
        await conn.execute(
          `INSERT INTO notifications (recipient_user_id, trip_id, type, title, body, metadata, created_at)
           VALUES (?, ?, 'invite_response', ?, ?, ?, NOW())`,
          [
            inv.invited_by_user_id,
            inv.trip_id,
            `Invitation ${newStatus}`,
            `${req.user?.name || req.user?.email || 'A user'} ${newStatus} your invite to trip ${inv.trip_id}`,
            JSON.stringify({ invitation_id: invitationId, response: newStatus })
          ]
        );
      }
    } catch (_) {
      // Non-fatal
    }

    await conn.commit();
    
    res.json({ 
      success: true, 
      invitation_id: invitationId, 
      status: newStatus,
      trip_id: inv.trip_id // Return trip_id so frontend can redirect
    });
  } catch (err) {
    await conn.rollback();
    console.error('POST /api/invitations/:invitationId/respond error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Database error', details: err.message || String(err) });
  } finally {
    conn.release();
  }
});

module.exports = router;
