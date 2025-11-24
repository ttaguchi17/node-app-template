// backend/routes/members.js
const express = require('express');
// CRITICAL: mergeParams allows us to access :tripId from parent router (trips.js)
const router = express.Router({ mergeParams: true }); 
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');

/**
 * @route   GET /api/trips/:tripId/members
 * @desc    Get all members for a specific trip
 */
router.get('/', authenticateToken, async (req, res) => {
  const { tripId } = req.params;

  try {
    // 1. Check access using user_id (not email)
    const [access] = await pool.execute(
      `SELECT 1 FROM trip_membership tm
       WHERE tm.trip_id = ? AND tm.user_id = ? LIMIT 1`,
      [tripId, req.user.user_id]
    );
    if (access.length === 0) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // 2. Fetch members
    // FIX: We use u.* because your user table doesn't have a 'name' column yet
    const [rows] = await pool.execute(
      `SELECT tm.*, u.*
       FROM trip_membership tm
       LEFT JOIN user u ON u.user_id = tm.user_id
       WHERE tm.trip_id = ?`,
      [tripId]
    );

    // 3. Normalize the data
    const normalized = (rows || []).map(r => {
      const membershipId = r.id ?? r.membership_id ?? r.trip_membership_id;
      const userId = r.user_id;
      
      // FIX: Use email as fallback for name
      const name = r.name ?? r.full_name ?? r.email ?? 'Pending User';
      const email = r.email ?? 'Pending Email';

      return {
        id: membershipId,
        user_id: userId,
        name,
        email,
        role: r.role,
        status: r.status,
      };
    });

    res.status(200).json(normalized);
  } catch (err) {
    console.error('GET members error', err && err.stack ? err.stack : err);
    res.status(500).json({ message: 'Error fetching members.' });
  }
});

/**
 * @route   POST /api/trips/:tripId/members/:userId/accept
 * @desc    Accept invitation to join trip
 */
router.post('/:userId/accept', authenticateToken, async (req, res) => {
  const { tripId, userId } = req.params;
  const authUserId = String(req.user.user_id ?? req.user.id ?? '');
  const authEmail = (req.user.email || '').toLowerCase();

  if (String(userId) !== authUserId) {
    return res.status(403).json({ message: 'You can only accept invites for your own account.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // check membership row
    const [exists] = await conn.execute(
      `SELECT * FROM trip_membership WHERE trip_id = ? AND user_id = ? LIMIT 1`,
      [tripId, userId]
    );

    if (exists.length) {
      // update status to accepted
      try {
        await conn.execute(
          `UPDATE trip_membership SET status = 'accepted', responded_at = NOW() WHERE trip_id = ? AND user_id = ?`,
          [tripId, userId]
        );
      } catch (e) {
        await conn.execute(
          `UPDATE trip_membership SET status = 'accepted' WHERE trip_id = ? AND user_id = ?`,
          [tripId, userId]
        );
      }
    } else {
      // no membership row: attempt to find a trip_invitations record by email (optional)
      let inserted = false;
      try {
        const [invRows] = await conn.execute(
          `SELECT id FROM trip_invitations WHERE trip_id = ? AND LOWER(invited_email) = ? LIMIT 1`,
          [tripId, authEmail]
        );
        if (invRows.length) {
          await conn.execute(
            `INSERT INTO trip_membership (trip_id, user_id, role, status, invited_by_user_id, invited_at, responded_at)
             VALUES (?, ?, ?, 'accepted', NULL, NOW(), NOW())`,
            [tripId, userId, 'member']
          );
          inserted = true;
          try {
            await conn.execute(`UPDATE trip_invitations SET status = 'accepted' WHERE id = ?`, [invRows[0].id]);
          } catch (e) { /* ignore if column missing */ }
        }
      } catch (e) {
        // silent: table may not exist
      }

      if (!inserted) {
        await conn.execute(
          `INSERT INTO trip_membership (trip_id, user_id, role, status, invited_at, responded_at)
           VALUES (?, ?, ?, 'accepted', NOW(), NOW())`,
          [tripId, userId, 'member']
        );
      }
    }

    await conn.commit();

    // return refreshed members
    const [rows] = await pool.execute(
      `SELECT tm.*, u.* FROM trip_membership tm LEFT JOIN user u ON u.user_id = tm.user_id WHERE tm.trip_id = ?`,
      [tripId]
    );

    const normalized = (rows || []).map(r => {
      const membershipId = r.id ?? r.membership_id ?? null;
      const userId = r.user_id ?? null;
      const name = r.name ?? r.user_name ?? null;
      const email = r.email ?? r.user_email ?? null;
      return {
        id: membershipId,
        user_id: userId,
        name,
        email,
        role: r.role,
        status: r.status,
      };
    });

    res.status(200).json({ success: true, members: normalized });
  } catch (err) {
    await conn.rollback();
    console.error('POST accept invite error', err && (err.stack || err.message) ? (err.stack || err.message) : err);
    res.status(500).json({ message: 'Error accepting invite.' });
  } finally {
    conn.release();
  }
});

/**
 * @route   PATCH /api/trips/:tripId/members/:userId
 * @desc    Update member role (organizer/admin only)
 */
router.patch('/:userId', authenticateToken, async (req, res) => {
  const { tripId, userId } = req.params;
  const { role } = req.body; // Expecting { "role": "admin" }

  // Validate role
  const validRoles = ['organizer', 'admin', 'member', 'viewer'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified.' });
  }

  const conn = await pool.getConnection();
  try {
    // Check Permissions: Requester must be Owner or Organizer
    const [requester] = await conn.execute(
      `SELECT role FROM trip_membership WHERE trip_id = ? AND user_id = ?`,
      [tripId, req.user.user_id]
    );

    if (!requester.length || !['owner', 'organizer'].includes(requester[0].role)) {
      return res.status(403).json({ message: 'Only Owners and Organizers can change roles.' });
    }

    // Update the target user's role
    const [result] = await conn.execute(
      `UPDATE trip_membership SET role = ? WHERE trip_id = ? AND user_id = ?`,
      [role, tripId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Member not found.' });
    }

    res.json({ message: 'Member role updated successfully.', userId, newRole: role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating role.' });
  } finally {
    conn.release();
  }
});

/**
 * @route   DELETE /api/trips/:tripId/members/:membershipId
 * @desc    Remove a member (or leave a trip)
 */
router.delete('/:membershipId', authenticateToken, async (req, res) => {
  const { tripId, membershipId } = req.params;
  const requesterUserId = req.user.user_id;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Get the membership details (FIX: use membership_id)
    const [targetRows] = await connection.execute(
      `SELECT * FROM trip_membership WHERE membership_id = ? AND trip_id = ?`,
      [membershipId, tripId]
    );
    if (targetRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Membership not found.' });
    }
    const targetMembership = targetRows[0];
    
    // 2. Get the requester's role
    const [requesterRows] = await connection.execute(
      `SELECT * FROM trip_membership WHERE user_id = ? AND trip_id = ?`,
      [requesterUserId, tripId]
    );
    if (requesterRows.length === 0) {
      await connection.rollback();
      return res.status(403).json({ message: 'Access denied.' });
    }
    const requesterMembership = requesterRows[0];

    // 3. Rules
    // Rule A: Organizer cannot leave (must delete trip)
    if (targetMembership.role === 'organizer' && String(targetMembership.user_id) === String(requesterUserId)) {
      await connection.rollback();
      return res.status(403).json({ message: 'Organizer cannot leave the trip. You must delete the trip instead.' });
    }
    
    // Rule B: Must be organizer OR deleting self
    const isOrganizer = requesterMembership.role === 'organizer' || requesterMembership.role === 'owner';
    const isDeletingSelf = String(targetMembership.user_id) === String(requesterUserId);

    if (isOrganizer || isDeletingSelf) {
      // FIX: use membership_id
      await connection.execute(
        `DELETE FROM trip_membership WHERE membership_id = ?`,
        [membershipId]
      );
      
      // Notification logic: only notify if user was an accepted member (not just invited)
      if (isOrganizer && !isDeletingSelf && targetMembership.status === 'accepted') {
        try {
          await connection.execute(
            `INSERT INTO notifications (recipient_user_id, trip_id, type, title, body, metadata, created_at)
             VALUES (?, ?, 'trip_removed', ?, ?, ?, NOW())`,
            [targetMembership.user_id, tripId, 'Removed from trip', `You have been removed from trip ${tripId}.`, JSON.stringify({})]
          );
        } catch (nErr) { console.warn('Notification failed:', nErr.message); }
      }

    } else {
      await connection.rollback();
      return res.status(403).json({ message: 'You do not have permission to remove this member.' });
    }

    await connection.commit();
    res.status(200).json({ message: 'Member removed successfully.' });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Server error removing member.' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;