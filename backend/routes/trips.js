// backend/routes/trips.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const geocodeLocation = require('../services/geocoding');
const pool = require('../config/database');

/**
 * Minimal startup log so we know file loaded
 */
console.log("\n" + "=".repeat(50));
console.log("   SUCCESSFULLY LOADED trips.js   ");
console.log("=".repeat(50) + "\n");

/**
 * GET /api/trips
 * Return trips for authenticated user (via trip_membership)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [trips] = await pool.execute(
      `SELECT t.* FROM trip t
       JOIN trip_membership tm ON t.trip_id = tm.trip_id
       WHERE tm.user_id = ? 
         AND tm.status IN ('accepted', 'organizer', 'owner', 'admin')`,
      [req.user.user_id]
    );
    res.status(200).json(trips);
  } catch (error) {
    console.error('GET /api/trips error', error && (error.stack || error.message) ? (error.stack || error.message) : error);
    res.status(500).json({ message: 'Error retrieving trips.' });
  }
});

/**
 * GET /api/trips/:tripId
 * Return single trip if user is a member
 */
router.get('/:tripId', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user.user_id;

  console.log(`🔍 [DEBUG GET TRIP] Looking for Trip: ${tripId}, User: ${userId}`);

  try {
    const [rows] = await pool.execute(
      `SELECT t.*, tm.role as my_role, tm.status as my_status
       FROM trip t
       JOIN trip_membership tm ON t.trip_id = tm.trip_id
       WHERE tm.user_id = ? AND t.trip_id = ?
         AND tm.status IN ('accepted', 'organizer', 'owner', 'admin')`,
      [userId, tripId]
    );

    console.log(`🔍 [DEBUG GET TRIP] Rows found: ${rows.length}`);

    if (rows.length === 0) {
      // membership check for debug
      const [check] = await pool.execute(
        `SELECT * FROM trip_membership WHERE user_id = ? AND trip_id = ?`,
        [userId, tripId]
      );
      console.log(`🔍 [DEBUG GET TRIP] Membership check:`, check[0] || "No membership found");

      return res.status(404).json({ message: 'Trip not found or access denied.' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('GET /api/trips/:tripId error', error && (error.stack || error.message) ? (error.stack || error.message) : error);
    res.status(500).json({ message: 'Error retrieving trip.' });
  }
});

/**
 * POST /api/trips
 * Create trip and add creator as owner/organizer
 */
router.post('/', authenticateToken, async (req, res) => {
  const { name, start_date, end_date, location_input } = req.body;
  const { user_id } = req.user; // Use user_id from token

  if (!name) {
    return res.status(400).json({ message: 'Trip name is required.' });
  }
  if (!location_input) {
    return res.status(400).json({ message: 'Trip location is required.' });
  }

  let insertData = {
    name,
    start_date: start_date || null,
    end_date: end_date || null,
    location_input,
  };

  try {
    const geoResult = await geocodeLocation(location_input).catch(() => null);
    if (geoResult) {
      Object.assign(insertData, geoResult);
    }
  } catch (e) {
    // continue even if geocoding fails
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const fields = Object.keys(insertData);
    const placeholders = fields.map(() => '?').join(', ');
    const values = Object.values(insertData);

    const [tripResult] = await connection.execute(
      `INSERT INTO trip (${fields.join(', ')}) VALUES (${placeholders})`,
      values
    );

    const newTripId = tripResult.insertId;

    // Add creator as organizer/owner with accepted status
    await connection.execute(
      `INSERT INTO trip_membership (user_id, trip_id, role, status, invited_at)
       VALUES (?, ?, ?, 'accepted', NOW())`,
      [user_id, newTripId, 'organizer']
    );

    await connection.commit();

    res.status(201).json({
      trip_id: newTripId,
      ...insertData
    });
  } catch (error) {
    await connection.rollback();
    console.error('POST /api/trips error', error && (error.stack || error.message) ? (error.stack || error.message) : error);
    res.status(500).json({ message: 'Error creating trip.' });
  } finally {
    connection.release();
  }
});

/**
 * PATCH /api/trips/:tripId
 * Update trip (only if user is member)
 */
router.patch('/:tripId', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const { name, start_date, end_date, location_input } = req.body;
  const updateFields = [];
  const values = [];

  if (name !== undefined) {
    updateFields.push('name = ?'); values.push(name);
  }
  if (start_date !== undefined) {
    updateFields.push('start_date = ?'); values.push(start_date);
  }
  if (end_date !== undefined) {
    updateFields.push('end_date = ?'); values.push(end_date);
  }
  if (location_input !== undefined) {
    updateFields.push('location_input = ?'); values.push(location_input);
    try {
      const geoResult = await geocodeLocation(location_input).catch(() => null);
      if (geoResult) {
        updateFields.push('location_display_name = ?'); values.push(geoResult.location_display_name);
        updateFields.push('latitude = ?'); values.push(geoResult.latitude);
        updateFields.push('longitude = ?'); values.push(geoResult.longitude);
      }
    } catch (e) {
      // ignore geocode errors
    }
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ message: 'No fields to update.' });
  }

  // Set tripId and user id for permission check
  values.push(tripId);
  values.push(req.user.user_id);

  try {
    // Note: using a conditional join update pattern
    const [result] = await pool.execute(
      `UPDATE trip t
         JOIN trip_membership tm ON t.trip_id = tm.trip_id
       SET ${updateFields.join(', ')}
       WHERE t.trip_id = ? AND tm.user_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Trip not found or access denied.' });
    }

    res.status(200).json({ message: 'Trip updated successfully!', updatedFields: req.body });
  } catch (error) {
    console.error('PATCH /api/trips/:tripId error', error && (error.stack || error.message) ? (error.stack || error.message) : error);
    res.status(500).json({ message: 'Error updating trip.' });
  }
});

/**
 * DELETE /api/trips/:tripId
 * Only owner/organizer/admin allowed to delete
 */
router.delete('/:tripId', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const { user_id } = req.user;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [membership] = await connection.execute(
      `SELECT tm.role FROM trip_membership tm
       WHERE tm.user_id = ? AND tm.trip_id = ? LIMIT 1`,
      [user_id, tripId]
    );

    if (membership.length === 0 || !['owner', 'organizer', 'admin'].includes(String(membership[0].role))) {
      await connection.rollback();
      return res.status(403).json({ message: 'Access denied. Only owner/organizer/admin can delete.' });
    }

    // delete related rows (best-effort)
    await connection.execute('DELETE FROM itinerary_event WHERE trip_id = ?', [tripId]);
    await connection.execute('DELETE FROM trip_membership WHERE trip_id = ?', [tripId]);
    const [result] = await connection.execute('DELETE FROM trip WHERE trip_id = ?', [tripId]);

    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    res.status(200).json({ message: 'Trip and all associated data deleted successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error('DELETE /api/trips/:tripId error', error && (error.stack || error.message) ? (error.stack || error.message) : error);
    res.status(500).json({ message: 'Error deleting trip.' });
  } finally {
    connection.release();
  }
});

/**
 * GET /api/trips/:tripId/members
 * Returns normalized membership rows.
 */
router.get('/:tripId/members', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  try {
    // ensure requester is a member of the trip
    const [access] = await pool.execute(
      `SELECT 1 FROM trip_membership tm
       WHERE tm.trip_id = ? AND tm.user_id = ? LIMIT 1`,
      [tripId, req.user.user_id]
    );
    if (access.length === 0) return res.status(403).json({ message: 'Access denied.' });

    const [rows] = await pool.execute(
      `SELECT tm.*, u.* 
       FROM trip_membership tm
       LEFT JOIN user u ON u.user_id = tm.user_id
       WHERE tm.trip_id = ?`,
      [tripId]
    );

    const normalized = (rows || []).map(r => {
      const membershipId = r.id ?? r.membership_id ?? r.trip_membership_id ?? r.tm_id ?? null;
      const userId = r.user_id ?? null;
      const name = r.name ?? r.user_name ?? r.full_name ?? null;
      const email = r.email ?? r.user_email ?? r.email_address ?? null;
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
    console.error('GET members error', err && (err.stack || err.message) ? (err.stack || err.message) : err);
    res.status(500).json({ message: 'Error fetching members.' });
  }
});

/**
 * POST /api/trips/:tripId/members/:userId/accept
 * Authenticated user accepts their invite -> status becomes 'accepted'
 */
router.post('/:tripId/members/:userId/accept', authenticateToken, async (req, res) => {
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
 * GET /api/trips/:tripId/events
 * Returns itinerary events for trip (if requester is member)
 */
router.get('/:tripId/events', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  try {
    const [tripRows] = await pool.execute(
      `SELECT t.trip_id FROM trip t
       JOIN trip_membership tm ON t.trip_id = tm.trip_id
       WHERE tm.user_id = ? AND t.trip_id = ?`,
      [req.user.user_id, tripId]
    );

    if (tripRows.length === 0) return res.status(404).json({ message: 'Trip not found or access denied.' });

    const [events] = await pool.execute(
      'SELECT * FROM itinerary_event WHERE trip_id = ? ORDER BY start_time ASC',
      [tripId]
    );

    res.json(events);
  } catch (error) {
    console.error('GET events error', error && (error.stack || error.message) ? (error.stack || error.message) : error);
    res.status(500).json({ message: 'Server error fetching events', error: error.message });
  }
});

/**
 * POST /api/trips/:tripId/invitations
 * Invite users by user_id or by email. Inserts trip_membership rows with status = 'invited' for known users.
 */
router.post('/:tripId/invitations', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const { invited_user_ids = [], invited_emails = [], message = '', role = 'member' } = req.body;
  const invitedBy = req.user.user_id || null;

  if ((!Array.isArray(invited_user_ids) || invited_user_ids.length === 0) &&
      (!Array.isArray(invited_emails) || invited_emails.length === 0)) {
    return res.status(400).json({ message: 'No invitees provided.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // permission check
    const [perm] = await conn.execute(
      `SELECT tm.role FROM trip_membership tm
       WHERE tm.trip_id = ? AND tm.user_id = ? LIMIT 1`,
      [tripId, req.user.user_id]
    );
    if (perm.length === 0) { await conn.rollback(); return res.status(403).json({ message: 'Access denied.' }); }
    const requesterRole = perm[0].role || '';
    if (!['owner', 'organizer', 'admin', 'member'].includes(requesterRole) && requesterRole !== 'owner') {
      await conn.rollback();
      return res.status(403).json({ message: 'Insufficient permissions to invite.' });
    }

    const created = [];

    // invited_user_ids -> trip_membership with status 'invited'
    for (const uidRaw of invited_user_ids) {
      const uid = Number(uidRaw);
      if (isNaN(uid)) continue;

      const [exists] = await conn.execute(
        `SELECT 1 FROM trip_membership WHERE trip_id = ? AND user_id = ? LIMIT 1`,
        [tripId, uid]
      );
      if (exists.length) continue;

      const [ins] = await conn.execute(
        `INSERT INTO trip_membership (trip_id, user_id, role, status, invited_by_user_id, invited_at)
         VALUES (?, ?, ?, 'invited', ?, NOW())`,
        [tripId, uid, role, invitedBy]
      );
      created.push({ id: ins.insertId, trip_id: Number(tripId), user_id: uid });
    }

    // invited_emails -> optional trip_invitations insert (non-fatal)
    if (Array.isArray(invited_emails) && invited_emails.length) {
      for (const email of invited_emails) {
        try {
          await conn.execute(
            `INSERT INTO trip_invitations (trip_id, invited_email, role, invited_by_user_id, invited_at, status)
             VALUES (?, ?, ?, ?, NOW(), 'invited')`,
            [tripId, email, role, invitedBy]
          );
        } catch (e) {
          // ignore if table doesn't exist
        }
      }
    }

    // best-effort notifications for created user invites
    try {
      for (const c of created) {
        await conn.execute(
          `INSERT INTO notifications (recipient_user_id, type, title, body, metadata, created_at)
           VALUES (?, 'trip_invite', ?, ?, ?, NOW())`,
          [c.user_id, `You were invited to trip ${tripId}`, message || `You've been invited to join a trip.`, JSON.stringify({ trip_id: tripId })]
        );
      }
    } catch (nErr) {
      console.warn('Notification insert failed (non-fatal):', nErr && (nErr.message || nErr));
    }

    await conn.commit();

    // return updated members list
    const [rows] = await pool.execute(
      `SELECT tm.*, u.* FROM trip_membership tm LEFT JOIN user u ON u.user_id = tm.user_id WHERE tm.trip_id = ?`,
      [tripId]
    );
    const normalized = (rows || []).map(r => {
      const membershipId = r.id ?? r.membership_id ?? null;
      const userId = r.user_id ?? null;
      const name = r.name ?? r.user_name ?? null;
      const email = r.email ?? r.user_email ?? null;
      return { id: membershipId, user_id: userId, name, email, role: r.role, status: r.status };
    });

    res.status(200).json({ success: true, created_count: created.length, members: normalized });
  } catch (err) {
    await conn.rollback();
    console.error('POST /invitations error', err && (err.stack || err.message) ? (err.stack || err.message) : err);
    res.status(500).json({ message: 'Error sending invites.' });
  } finally {
    conn.release();
  }
});

/**
 * POST /api/trips/:tripId/events
 * Create a new event (imported booking or manual).
 */
router.post('/:tripId/events', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const booking = req.body || {};
  const userId = req.user.user_id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Verify membership
    const [membership] = await connection.execute(
      `SELECT tm.role FROM trip_membership tm WHERE tm.user_id = ? AND tm.trip_id = ? LIMIT 1`,
      [userId, tripId]
    );
    if (membership.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Trip not found or access denied.' });
    }

    // Duplicate check if booking id present
    if (booking.id) {
      const [existing] = await connection.execute(
        `SELECT ie.event_id FROM itinerary_event ie
         JOIN trip_membership tm ON ie.trip_id = tm.trip_id
         WHERE tm.user_id = ? AND JSON_EXTRACT(ie.details, '$.id') = ? LIMIT 1`,
        [userId, booking.id]
      );
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(208).json({ message: 'Event already imported.' });
      }
    }

    // Map fields with safe defaults
    const type = booking.type ? booking.type.charAt(0).toUpperCase() + booking.type.slice(1) : 'Activity';
    const title = booking.title || booking.hotel_name || booking.airline || `${type} Booking`;
    let location_input = booking.address || booking.hotel_name || booking.departure_airport || null;
    let location_display_name = null;
    let latitude = null;
    let longitude = null;

    let start_time = booking.check_in_date || booking.departure_date || null;
    let end_time = booking.check_out_date || booking.arrival_date || null;

    if (location_input) {
      const geoResult = await geocodeLocation(location_input).catch(() => null);
      if (geoResult) {
        location_display_name = geoResult.location_display_name;
        latitude = geoResult.latitude;
        longitude = geoResult.longitude;
      } else {
        location_display_name = location_input;
      }
    }

    const details = JSON.stringify(booking);
    const cost = booking.price_usd || 0.00;

    const [result] = await connection.execute(
      `INSERT INTO itinerary_event (trip_id, title, type, start_time, end_time, location_input, location_display_name, latitude, longitude, details, cost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tripId, title, type, start_time, end_time, location_input, location_display_name, latitude, longitude, details, cost]
    );

    const newEventId = result.insertId;
    const [newEventRows] = await connection.execute('SELECT * FROM itinerary_event WHERE event_id = ?', [newEventId]);

    await connection.commit();
    res.status(201).json(newEventRows[0]);
  } catch (error) {
    await connection.rollback();
    console.error('POST /events error', error && (error.stack || error.message) ? (error.stack || error.message) : error);
    res.status(500).json({ message: 'Server error creating event', error: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
