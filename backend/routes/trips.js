// backend/routes/trips.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const geocodeLocation = require('../services/geocoding');
const pool = require('../config/database');

<<<<<<< HEAD
/**
 * Existing trip endpoints (unchanged)...
 */
=======
console.log("\n" + "="*50);
console.log("   SUCCESSFULLY LOADED NEW trips.js (v5)   ");
console.log("="*50 + "\n");
>>>>>>> 538effe (Email logic polished and finished)

// Get all trips for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [trips] = await pool.execute(
      `SELECT t.* FROM trip t
        JOIN trip_membership tm ON t.trip_id = tm.trip_id
        JOIN user u ON tm.user_id = u.user_id
        WHERE u.email = ?`,
      [req.user.email]
    );

    res.status(200).json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving trips.' });
  }
});

// Get single trip
router.get('/:tripId', authenticateToken, async (req, res) => {
  const { tripId } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT t.* FROM trip t
        JOIN trip_membership tm ON t.trip_id = tm.trip_id
        JOIN user u ON tm.user_id = u.user_id
        WHERE u.email = ? AND t.trip_id = ?`,
      [req.user.email, tripId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found or access denied.' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching single trip:', error);
    res.status(500).json({ message: 'Error retrieving trip.' });
  }
});

// Create trip
router.post('/', authenticateToken, async (req, res) => {
  const { name, start_date, end_date, location_input } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Trip name is required.' });
  }
  if (!location_input) {
    return res.status(400).json({ message: 'Trip location is required.' });
  }

  let insertData = {
    name: name,
    start_date: start_date || null,
    end_date: end_date || null,
    location_input: location_input,
  };

  const geoResult = await geocodeLocation(location_input);
  if (geoResult) {
    Object.assign(insertData, geoResult);
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

    // Add user to trip as organizer
    await connection.execute(
      'INSERT INTO trip_membership (user_id, trip_id, role, status, invited_at) VALUES (?, ?, ?, \'accepted\', NOW())',
      [req.user.user_id, newTripId, 'organizer']
    );

    await connection.commit();

    res.status(201).json({
      trip_id: newTripId,
      ...insertData
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating trip:', error);
    res.status(500).json({ message: 'Error creating trip.' });
  } finally {
    connection.release();
  }
});

// Update trip
router.patch('/:tripId', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const { name, start_date, end_date, location_input } = req.body;

  const updateFields = [];
  const values = [];

  if (name !== undefined) {
    updateFields.push('name = ?');
    values.push(name);
  }
  if (start_date !== undefined) {
    updateFields.push('start_date = ?');
    values.push(start_date);
  }
  if (end_date !== undefined) {
    updateFields.push('end_date = ?');
    values.push(end_date);
  }

  if (location_input !== undefined) {
    updateFields.push('location_input = ?');
    values.push(location_input);

    const geoResult = await geocodeLocation(location_input);
    if (geoResult) {
      updateFields.push('location_display_name = ?');
      values.push(geoResult.location_display_name);
      updateFields.push('latitude = ?');
      values.push(geoResult.latitude);
      updateFields.push('longitude = ?');
      values.push(geoResult.longitude);
    }
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ message: 'No fields to update.' });
  }

  values.push(tripId);
  values.push(req.user.email);

  try {
    const [result] = await pool.execute(
      `UPDATE trip t
       JOIN trip_membership tm ON t.trip_id = tm.trip_id
       JOIN user u ON tm.user_id = u.user_id
       SET ${updateFields.join(', ')}
       WHERE t.trip_id = ? AND u.email = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Trip not found or access denied.' });
    }

    res.status(200).json({ message: 'Trip updated successfully!', updatedFields: req.body });
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ message: 'Error updating trip.' });
  }
});

// Delete trip
router.delete('/:tripId', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Verify organizer role
    const [membership] = await connection.execute(
      `SELECT tm.role FROM trip_membership tm
       JOIN user u ON tm.user_id = u.user_id
       WHERE u.email = ? AND tm.trip_id = ?`,
      [req.user.email, tripId]
    );

    if (membership.length === 0 || membership[0].role !== 'organizer') {
      return res.status(403).json({ message: 'Access denied. Only organizer can delete.' });
    }

    // Delete all related data
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
    console.error('Error deleting trip:', error);
    res.status(500).json({ message: 'Error deleting trip.' });
  } finally {
    connection.release();
  }
});

<<<<<<< HEAD
/**
 * NEW: Get members for a trip
 * GET /api/trips/:tripId/members
 *
 * Returns normalized rows: { id, user_id, name, email, role, status }
 */
router.get('/:tripId/members', authenticateToken, async (req, res) => {
  const { tripId } = req.params;

  try {
    // Ensure requesting user is a member (access control)
    const [access] = await pool.execute(
      `SELECT 1 FROM trip_membership tm
       JOIN user u ON tm.user_id = u.user_id
       WHERE tm.trip_id = ? AND u.email = ? LIMIT 1`,
      [tripId, req.user.email]
    );
    if (access.length === 0) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const [rows] = await pool.execute(
      `SELECT tm.*, u.*
       FROM trip_membership tm
       LEFT JOIN user u ON u.user_id = tm.user_id
       WHERE tm.trip_id = ?`,
      [tripId]
    );

    // normalize column names to simple shape (works with many schemas)
    const normalized = (rows || []).map(r => {
      const membershipId = r.id ?? r.membership_id ?? r.trip_membership_id ?? r.tm_id ?? r.trip_member_id ?? null;
      const userId = r.user_id ?? r.userId ?? r.id ?? null; // r.id might collide; prefer user_id if available
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

    res.status(200).json(normalized);
  } catch (err) {
    console.error('GET members error', err && err.stack ? err.stack : err);
    res.status(500).json({ message: 'Error fetching members.' });
=======
router.get('/:tripId/events', authenticateToken, async (req, res) => {
  const { tripId } = req.params;

  try {
    // First, verify this trip belongs to the user (copying your logic)
    const [tripRows] = await pool.execute(
      `SELECT t.trip_id FROM trip t
       JOIN trip_membership tm ON t.trip_id = tm.trip_id
       JOIN user u ON tm.user_id = u.user_id
       WHERE u.email = ? AND t.trip_id = ?`,
      [req.user.email, tripId]
    );

    if (tripRows.length === 0) {
      return res.status(404).json({ message: 'Trip not found or access denied.' });
    }

    // Now, get the events for that trip
    // (Using 'itinerary_event' based on your DELETE route)
    const [events] = await pool.execute(
      'SELECT * FROM itinerary_event WHERE trip_id = ? ORDER BY start_time ASC',
      [tripId]
    );

    // Return the events. This will be [] if none are found.
    res.json(events);

  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error fetching events', error: error.message });
>>>>>>> 538effe (Email logic polished and finished)
  }
});

/**
<<<<<<< HEAD
 * NEW: Invite users to a trip
 * POST /api/trips/:tripId/invitations
 * Body: { invited_user_ids: [1,2,3], invited_emails: [...], message: 'optional', role: 'member' }
 *
 * Inserts trip_membership rows with status='invited'. Skips existing memberships.
 * Also creates notifications in notifications table if present (best-effort).
 */
router.post('/:tripId/invitations', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const { invited_user_ids = [], invited_emails = [], message = '', role = 'member' } = req.body;
  const invitedBy = req.user.user_id || null;

  if ((!Array.isArray(invited_user_ids) || invited_user_ids.length === 0) && (!Array.isArray(invited_emails) || invited_emails.length === 0)) {
    return res.status(400).json({ message: 'No invitees provided.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ensure requester is organizer/admin or a member with invite rights
    const [perm] = await conn.execute(
      `SELECT tm.role FROM trip_membership tm
       JOIN user u ON tm.user_id = u.user_id
       WHERE tm.trip_id = ? AND u.email = ? LIMIT 1`,
      [tripId, req.user.email]
    );
    if (perm.length === 0) {
      await conn.rollback();
      return res.status(403).json({ message: 'Access denied.' });
    }
    const requesterRole = perm[0].role || '';
    if (!['organizer', 'owner', 'admin', 'member'].includes(requesterRole) && requesterRole !== 'organizer') {
      // by default allow organizer/admin/owner; you can tighten this
      await conn.rollback();
      return res.status(403).json({ message: 'Insufficient permissions to invite.' });
    }

    const created = [];

    // handle numeric user ids invites
    for (const uidRaw of invited_user_ids) {
      const uid = Number(uidRaw);
      if (isNaN(uid)) continue;

      // skip if membership already exists
      const [exists] = await conn.execute(
        `SELECT 1 FROM trip_membership WHERE trip_id = ? AND user_id = ? LIMIT 1`,
        [tripId, uid]
      );
      if (exists.length) {
        // if previously removed/declined, you might want to update status -> invited; for now skip
        continue;
      }

      const [ins] = await conn.execute(
        `INSERT INTO trip_membership (trip_id, user_id, role, status, invited_by_user_id, invited_at)
         VALUES (?, ?, ?, 'invited', ?, NOW())`,
        [tripId, uid, role, invitedBy]
      );
      created.push({ id: ins.insertId, trip_id: Number(tripId), user_id: uid });
    }

    // (optional) handle invited_emails: store in a separate invitations table or insert with user_id = NULL
    // For class project we skip emails or you can create a row in an invitations table.

    // Optionally insert notifications into notifications table (best-effort)
    try {
      for (const c of created) {
        await conn.execute(
          `INSERT INTO notifications (recipient_user_id, type, title, body, metadata, created_at)
           VALUES (?, 'trip_invite', ?, ?, ?, NOW())`,
          [c.user_id, `You were invited to trip ${tripId}`, message || `You've been invited to join a trip.`, JSON.stringify({ trip_id: tripId })]
        );
      }
    } catch (nErr) {
      // don't fail invites if notification insert fails
      console.warn('Notification insert failed (non-fatal):', nErr.message || nErr);
    }

    await conn.commit();

    // return updated members list for convenience
    const [rows] = await pool.execute(
      `SELECT tm.*, u.*
       FROM trip_membership tm
       LEFT JOIN user u ON u.user_id = tm.user_id
       WHERE tm.trip_id = ?`,
      [tripId]
    );
    const normalized = (rows || []).map(r => {
      const membershipId = r.id ?? r.membership_id ?? r.trip_membership_id ?? r.tm_id ?? r.trip_member_id ?? null;
      const userId = r.user_id ?? r.userId ?? r.id ?? null;
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

    res.status(200).json({ success: true, created_count: created.length, members: normalized });
  } catch (err) {
    await conn.rollback();
    console.error('POST invitations error', err && err.stack ? err.stack : err);
    res.status(500).json({ message: 'Error sending invites.' });
  } finally {
    conn.release();
  }
});

module.exports = router;
=======
 * @route   POST /api/trips/:tripId/events
 * @desc    Create a new event from a booking (bulletproof version)
 * @access  Private
 */
router.post('/:tripId/events', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  // Ensure booking is an object, even if req.body is null or weird
  const booking = req.body || {}; 
  const userId = req.user.user_id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Verify this trip belongs to the user
    const [membership] = await connection.execute(
      `SELECT tm.role FROM trip_membership tm
       WHERE tm.user_id = ? AND tm.trip_id = ?`,
      [userId, tripId]
    );

    if (membership.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Trip not found or access denied.' });
    }

    // 2. --- DUPLICATE CHECK (Now Safe) ---
    // We only run this check if booking.id *actually exists*
    if (booking.id) {
      const [existing] = await connection.execute(
        `SELECT ie.event_id FROM itinerary_event ie
         JOIN trip_membership tm ON ie.trip_id = tm.trip_id
         WHERE tm.user_id = ? AND JSON_EXTRACT(ie.details, '$.id') = ?
         LIMIT 1`,
        [userId, booking.id]
      );
      
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(208).json({ message: 'Event already imported.' });
      }
    } else {
      // This is the log you're seeing. It's working as intended.
      console.warn('Booking object has no ID. Skipping duplicate check.');
    }

    // 3. --- MAP DATA (Now Safe) ---
    // We provide a fallback for *every single variable*
    const type = (booking.type ? booking.type.charAt(0).toUpperCase() + booking.type.slice(1) : 'Activity');
    const title = booking.title || booking.hotel_name || booking.airline || `${type} Booking`;
    let location_input = booking.address || booking.hotel_name || booking.departure_airport || null;
    let location_display_name = null;
    let latitude = null;
    let longitude = null;

    // Extract dates from booking
    let start_time = null;
    let end_time = null;

    try {
      const startDateString = booking.check_in_date || booking.departure_date;
      if (startDateString) {
        start_time = startDateString;
      }
      const endDateString = booking.check_out_date || booking.arrival_date;
      if (endDateString) {
        end_time = endDateString;
      }
    } catch (e) {
      console.warn('Error processing date string:', e.message);
    }


    // Geocode location if present
    if (location_input) {
      console.log(`📍 [Import Event] Geocoding location: "${location_input}"`);
      const geoResult = await require('../services/geocoding')(location_input);
      if (geoResult) {
        console.log(`📍 [Import Event] Geocoding succeeded:`, geoResult);
        location_display_name = geoResult.location_display_name;
        latitude = geoResult.latitude;
        longitude = geoResult.longitude;
      } else {
        console.warn(`📍 [Import Event] Geocoding returned null for "${location_input}"`);
        location_display_name = location_input;
      }
    } else {
      console.warn(`📍 [Import Event] No location_input to geocode`);
    }
    
    const details = JSON.stringify(booking, null, 2);
    const cost = booking.price_usd || 0.00;

    // Insert with dates, geocoded fields, and cost
    const [result] = await connection.execute(
      `INSERT INTO itinerary_event (trip_id, title, type, start_time, end_time, location_input, location_display_name, latitude, longitude, details, cost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tripId, title, type, start_time, end_time, location_input, location_display_name, latitude, longitude, details, cost]
    );

    const newEventId = result.insertId;

    // Fetch and return the newly created event
    const [newEventRows] = await connection.execute(
      'SELECT * FROM itinerary_event WHERE event_id = ?',
      [newEventId]
    );
    
    await connection.commit();
    res.status(201).json(newEventRows[0]); // Send the new event back

  } catch (error) {
    await connection.rollback();
    // We can now see the *real* error, if there is one
    console.error('Error creating event:', error); 
    res.status(500).json({ message: 'Server error creating event', error: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
>>>>>>> 538effe (Email logic polished and finished)
