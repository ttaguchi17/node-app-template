// backend/routes/members.js
const express = require('express');
// CRITICAL: This allows us to get the :tripId from the parent router
const router = express.Router({ mergeParams: true }); 
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');

/**
 * @route   GET /api/trips/:tripId/members
 * @desc    Get members for a trip
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
 * @route   POST /api/trips/:tripId/invitations
 * @desc    Invite users to a trip
 */
router.post('/invitations', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const { invited_user_ids = [], message = '', role = 'member' } = req.body;
  const invitedBy = req.user.user_id;

  if (!Array.isArray(invited_user_ids) || invited_user_ids.length === 0) {
    return res.status(400).json({ message: 'No invitees provided.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Check permissions
    const [perm] = await conn.execute(
      `SELECT tm.role FROM trip_membership tm
       WHERE tm.trip_id = ? AND tm.user_id = ? LIMIT 1`,
      [tripId, req.user.user_id]
    );
    if (perm.length === 0) {
      await conn.rollback();
      return res.status(403).json({ message: 'Access denied.' });
    }
    const requesterRole = perm[0].role || '';
    if (!['organizer', 'owner', 'admin'].includes(requesterRole)) { 
      await conn.rollback();
      return res.status(403).json({ message: 'Insufficient permissions to invite.' });
    }

    const created = [];
    for (const uidRaw of invited_user_ids) {
      const uid = Number(uidRaw);
      if (isNaN(uid)) continue;

      // Skip if already a member
      const [exists] = await conn.execute(
        `SELECT 1 FROM trip_membership WHERE trip_id = ? AND user_id = ? LIMIT 1`,
        [tripId, uid]
      );
      if (exists.length) continue;

      // Insert invitation
      const [ins] = await conn.execute(
        `INSERT INTO trip_membership (trip_id, user_id, role, status, invited_by_user_id, invited_at)
         VALUES (?, ?, ?, 'invited', ?, NOW())`,
        [tripId, uid, role, invitedBy]
      );
      created.push({ id: ins.insertId, trip_id: Number(tripId), user_id: uid });
    }

    // 2. Insert Notifications (Best Effort)
    try {
      for (const c of created) {
        await conn.execute(
          `INSERT INTO notifications (recipient_user_id, type, title, body, metadata, created_at)
           VALUES (?, 'trip_invite', ?, ?, ?, NOW())`,
          [c.user_id, `You were invited to trip ${tripId}`, message || `You've been invited to join a trip.`, JSON.stringify({ trip_id: tripId })]
        );
      }
    } catch (nErr) {
      console.warn('Notification insert failed (non-fatal):', nErr.message || nErr);
    }

    await conn.commit();
    
    // 3. Return updated list (Copying logic from GET /)
    const [rows] = await pool.execute(
      `SELECT tm.*, u.*
       FROM trip_membership tm
       LEFT JOIN user u ON u.user_id = tm.user_id
       WHERE tm.trip_id = ?`,
      [tripId]
    );
    const normalized = (rows || []).map(r => ({
      id: r.id ?? r.membership_id ?? r.trip_membership_id,
      user_id: r.user_id,
      name: r.name ?? r.full_name ?? r.email ?? 'Pending User',
      email: r.email ?? 'Pending Email',
      role: r.role,
      status: r.status,
    }));

    res.status(200).json({ success: true, created_count: created.length, members: normalized });

  } catch (err) {
    await conn.rollback();
    console.error('POST invitations error', err && err.stack ? err.stack : err);
    res.status(500).json({ message: 'Error sending invites.' });
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
      
      // Notification logic
      if (isOrganizer && !isDeletingSelf) {
        try {
          await connection.execute(
            `INSERT INTO notifications (recipient_user_id, type, title, body, metadata, created_at)
             VALUES (?, 'trip_removed', ?, ?, ?, NOW())`,
            [targetMembership.user_id, 'Removed from trip', `You have been removed from trip ${tripId}.`, JSON.stringify({ trip_id: tripId })]
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