// backend/routes/invitations.js
const express = require('express');
// CRITICAL: mergeParams allows us to access :tripId from parent router (trips.js)
const router = express.Router({ mergeParams: true });
const authenticateToken = require('../middleware/auth');
const pool = require('../config/database'); // mysql2/promise pool

/**
 * POST /api/trips/:tripId/invitations
 * Body: { invited_user_ids: [1,2,3], invited_emails: ['a@b.com'], message: '', role: 'member' }
 *
 * - Auth required (authenticateToken). Uses req.user.user_id as inviter.
 * - Inserts trip_membership rows with status='invited' for known user ids (skips existing).
 * - Inserts invitations rows for email invites (if table exists) or falls back to storing invited_email in trip_membership when possible.
 * - Creates notifications (best-effort). Notification metadata contains invitation_id and trip_id when available.
 */
router.post('/', authenticateToken, async (req, res) => {
  const tripId = Number(req.params.tripId);
  if (Number.isNaN(tripId)) return res.status(400).json({ error: 'Invalid tripId' });

  const {
    invited_user_ids = [],
    invited_emails = [],
    message = '',
    role = 'member',
  } = req.body || {};

  const invitedBy = Number(req.user && (req.user.user_id || req.user.id));

  // Validate invitedBy user ID
  if (!invitedBy || Number.isNaN(invitedBy)) {
    return res.status(401).json({ error: 'Invalid user authentication.' });
  }

  if ((!Array.isArray(invited_user_ids) || invited_user_ids.length === 0)
    && (!Array.isArray(invited_emails) || invited_emails.length === 0)) {
    return res.status(400).json({ error: 'No invitees provided.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Permission: ensure inviter is a member on this trip
    const [permRows] = await conn.execute(
      `SELECT tm.role
       FROM trip_membership tm
       JOIN user u ON tm.user_id = u.user_id
       WHERE tm.trip_id = ? AND u.user_id = ? LIMIT 1`,
      [tripId, invitedBy]
    );
    if (!permRows || permRows.length === 0) {
      await conn.rollback();
      return res.status(403).json({ error: 'Access denied. You are not a member of this trip.' });
    }
    const inviterRole = (permRows[0].role || '').toLowerCase();
    if (!['organizer', 'owner', 'admin', 'member'].includes(inviterRole)) {
      await conn.rollback();
      return res.status(403).json({ error: 'Insufficient permissions to invite.' });
    }

    // Keep lists of created items to return
    const createdMemberships = [];
    const createdInvitations = [];

    // 2) invited_user_ids -> create trip_membership (invited) and an invitations row if possible
    for (const raw of invited_user_ids) {
      const uid = Number(raw);
      if (Number.isNaN(uid) || uid <= 0) continue;

      // skip if membership exists already
      const [exists] = await conn.execute(
        `SELECT status FROM trip_membership WHERE trip_id = ? AND user_id = ? LIMIT 1`,
        [tripId, uid]
      );
      if (exists && exists.length > 0) {
        // If status exists and is 'accepted' we skip; if 'declined' you could re-invite by updating — here we leave as-is
        continue;
      }

      // insert membership with invited status
      const [ins] = await conn.execute(
        `INSERT INTO trip_membership (trip_id, user_id, role, status, invited_by_user_id, invited_at)
         VALUES (?, ?, ?, 'invited', ?, NOW())`,
        [tripId, uid, role, invitedBy]
      );
      createdMemberships.push({ membership_id: ins.insertId, trip_id: tripId, user_id: uid });

      // try to insert an invitations record (if invitations table exists)
      try {
        console.log(`[Invitations] Inserting invitation: trip=${tripId}, invited_user=${uid}, inviter=${invitedBy}`);
        // Generate unique token for invitation
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const [invRes] = await conn.execute(
          `INSERT INTO invitations (trip_id, invited_user_id, invited_by_user_id, token, status, created_at)
           VALUES (?, ?, ?, ?, 'pending', NOW())`,
          [tripId, uid, invitedBy, token]
        );
        console.log(`[Invitations] Invitation created with ID: ${invRes.insertId}`);
        createdInvitations.push({ invitation_id: invRes.insertId, trip_id: tripId, invited_user_id: uid });
        // attempt to notify the user (best-effort)
        try {
          console.log(`[Invitations] Creating notification: recipient=${uid}, trip=${tripId}`);
          await conn.execute(
            `INSERT INTO notifications (recipient_user_id, trip_id, type, title, body, metadata, created_at)
             VALUES (?, ?, 'trip_invite', ?, ?, ?, NOW())`,
            [
              uid,
              tripId,
              `You were invited to a trip`,
              message || `You've been invited to join trip ${tripId}`,
              JSON.stringify({ invitation_id: invRes.insertId })
            ]
          );
          console.log(`[Invitations] ✅ Created notification for user ${uid} for trip ${tripId}`);
        } catch (nerr) {
          console.error(`[Invitations] ❌ Failed to create notification for user ${uid}:`, nerr.message, nerr.sqlMessage);
        }
      } catch (invErr) {
        console.error(`[Invitations] ❌ Failed to create invitation record:`, invErr.message);
        // If invitations table doesn't exist, ignore - we already created trip_membership row
      }
    }

    // 3) invited_emails -> insert into invitations table if exists; if email matches a user, create trip_membership also
    if (Array.isArray(invited_emails) && invited_emails.length > 0) {
      for (const emailRaw of invited_emails) {
        const email = String(emailRaw || '').trim().toLowerCase();
        if (!email) continue;

        // see if email corresponds to a user account
        const [userRows] = await conn.execute(`SELECT user_id FROM user WHERE email = ? LIMIT 1`, [email]);
        const matchedUserId = (userRows && userRows.length > 0) ? Number(userRows[0].user_id) : null;

        // insert invitation record if table exists
        let invId = null;
        try {
          // Generate unique token for invitation
          const crypto = require('crypto');
          const token = crypto.randomBytes(32).toString('hex');
          const [invRes] = await conn.execute(
            `INSERT INTO invitations (trip_id, invited_user_id, invited_email, invited_by_user_id, token, status, created_at)
             VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
            [tripId, matchedUserId, email, invitedBy, token]
          );
          invId = invRes.insertId;
          createdInvitations.push({ invitation_id: invId, trip_id: tripId, invited_email: email, invited_user_id: matchedUserId });
        } catch (invErr) {
          // no invitations table or insert failed; fallback to storing invited_email in trip_membership (if schema allows)
          try {
            const [fallback] = await conn.execute(
              `INSERT INTO trip_membership (trip_id, user_id, role, status, invited_by_user_id, invited_at, invited_email)
               VALUES (?, NULL, ?, 'invited', ?, NOW(), ?)`,
              [tripId, role, invitedBy, email]
            );
            createdMemberships.push({ membership_id: fallback.insertId, trip_id: tripId, invited_email: email });
          } catch (fbErr) {
            // can't persist email invite — log and continue
            console.warn('Could not persist email invite for', email, fbErr.message || fbErr);
          }
        }

        // If matched to a user account, ensure trip_membership exists with invited status (if not previously created)
        if (matchedUserId) {
          const [exists2] = await conn.execute(
            `SELECT 1 FROM trip_membership WHERE trip_id = ? AND user_id = ? LIMIT 1`,
            [tripId, matchedUserId]
          );
          if (!exists2 || exists2.length === 0) {
            await conn.execute(
              `INSERT INTO trip_membership (trip_id, user_id, role, status, invited_by_user_id, invited_at)
               VALUES (?, ?, ?, 'invited', ?, NOW())`,
              [tripId, matchedUserId, role, invitedBy]
            );
          }
          // create notification for the matched user
          try {
            await conn.execute(
              `INSERT INTO notifications (recipient_user_id, trip_id, type, title, body, metadata, created_at)
               VALUES (?, ?, 'trip_invite', ?, ?, ?, NOW())`,
              [
                matchedUserId,
                tripId,
                `You were invited to a trip`,
                message || `You've been invited to join trip ${tripId}`,
                JSON.stringify({ invitation_id: invId })
              ]
            );
            console.log(`[Invitations] Created notification for email-matched user ${matchedUserId} for trip ${tripId}`);
          } catch (nerr) {
            console.error(`[Invitations] Failed to create notification for email-matched user ${matchedUserId}:`, nerr.message, nerr.sqlMessage);
          }
        } else {
          // No matched account — you can choose to send an external email here (outside scope)
        }
      }
    }

    await conn.commit();

    // Return fresh membership list for convenience
    const [rows] = await pool.execute(
      `SELECT tm.*, u.user_id AS user_user_id, u.email AS user_email
       FROM trip_membership tm
       LEFT JOIN user u ON u.user_id = tm.user_id
       WHERE tm.trip_id = ?`,
      [tripId]
    );
    const normalized = (rows || []).map(r => ({
      membership_id: r.id ?? r.membership_id ?? null,
      user_id: r.user_id ?? r.user_user_id ?? null,
      email: r.user_email ?? r.email ?? null,
      role: r.role,
      status: r.status
    }));

    res.json({
      success: true,
      created_memberships: createdMemberships,
      created_invitations: createdInvitations,
      members: normalized
    });
  } catch (err) {
    await conn.rollback();
    console.error('POST /api/trips/:tripId/invitations error:', err);
    console.error('Error stack:', err && err.stack);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      sql: err.sql
    });
    res.status(500).json({ 
      error: 'Database error while creating invitations',
      message: err.message || String(err),
      code: err.code,
      sqlMessage: err.sqlMessage
    });
  } finally {
    conn.release();
  }
});


module.exports = router;
