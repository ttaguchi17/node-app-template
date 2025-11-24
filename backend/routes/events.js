// backend/routes/events.js
const express = require("express");
// CRITICAL: mergeParams allows us to access :tripId from parent router (trips.js)
const router = express.Router({ mergeParams: true });
const pool = require("../config/database");
const authenticateToken = require("../middleware/auth");
const geocodeLocation = require("../services/geocoding");

/**
 * Utility: safe ISO date parser (returns null if invalid)
 */
function parseToISO(value) {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch (e) {
    return null;
  }
}

/**
 * GET /api/trips/:tripId/events
 * Get events for a trip.
 * LOGIC: Returns Public events + Private events created by the requester.
 */
router.get("/", authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const { user_id } = req.user;

  try {
    // Security: verify membership
    const [membership] = await pool.execute(
      `SELECT 1 FROM trip_membership WHERE trip_id = ? AND user_id = ? LIMIT 1`,
      [tripId, user_id]
    );
    if (!membership || membership.length === 0) {
      return res.status(403).json({ message: "Access denied to this trip." });
    }

    // Fetch events with Privacy Filter
    const [events] = await pool.execute(
      `SELECT * FROM itinerary_event 
       WHERE trip_id = ? 
       AND (
         is_private = FALSE 
         OR 
         (is_private = TRUE AND created_by = ?)
       )
       ORDER BY start_time ASC`,
      [tripId, user_id]
    );

    return res.json({ success: true, events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res
      .status(500)
      .json({ message: "Server error fetching events", error: error.message });
  }
});

/**
 * POST /api/trips/:tripId/events
 * Create an event (manual or from Gmail import)
 */
router.post("/", authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const { user_id } = req.user;
  const body = req.body || {};

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verify membership/permission
    const [membership] = await connection.execute(
      `SELECT role FROM trip_membership WHERE user_id = ? AND trip_id = ? LIMIT 1`,
      [user_id, tripId]
    );
    if (!membership || membership.length === 0) {
      await connection.rollback();
      return res.status(403).json({ message: "Access denied." });
    }

    // Duplicate check for imported events (if body.id present)
    if (body.id) {
      const [existing] = await connection.execute(
        `SELECT ie.event_id FROM itinerary_event ie
         JOIN trip_membership tm ON ie.trip_id = tm.trip_id
         WHERE tm.user_id = ? AND JSON_UNQUOTE(JSON_EXTRACT(ie.details, '$.id')) = ?
         LIMIT 1`,
        [user_id, body.id]
      );
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(208).json({ message: "Event already imported." });
      }
    }

    // Map fields
    const type = body.type ? String(body.type).charAt(0).toUpperCase() + String(body.type).slice(1) : "Activity";
    const title = body.title || body.hotel_name || body.airline || `${type} Booking`;
    const location_input = body.address || body.hotel_name || body.departure_airport || body.location_input || null;
    const cost = body.price_usd || body.cost || 0.0;
    
    // Privacy: Default to false, unless specified (Gmail import might set this to true)
    const isPrivate = (body.is_private || body.id) ? 1 : 0;

    // Dates
    let start_time = parseToISO(body.check_in_date || body.departure_date || body.start_time);
    let end_time = parseToISO(body.check_out_date || body.arrival_date || body.end_time);

    const details = body.id ? JSON.stringify(body) : (body.details ? JSON.stringify(body.details) : null);

    // Geocode
    let location_display_name = null;
    let latitude = null;
    let longitude = null;
    if (location_input) {
      try {
        const geoResult = await geocodeLocation(location_input);
        if (geoResult) {
          location_display_name = geoResult.location_display_name;
          latitude = geoResult.latitude;
          longitude = geoResult.longitude;
        } else {
          location_display_name = location_input;
        }
      } catch (e) {
        console.warn("Geocoding error: ", e.message);
        location_display_name = location_input;
      }
    }

    // Insert event with created_by and is_private
    const [result] = await connection.execute(
      `INSERT INTO itinerary_event 
        (trip_id, title, type, start_time, end_time, location_input, location_display_name, latitude, longitude, details, cost, created_by, is_private)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tripId,
        title,
        type,
        start_time,
        end_time,
        location_input,
        location_display_name,
        latitude,
        longitude,
        details,
        cost,
        user_id,   // <-- Set Creator
        isPrivate  // <-- Set Privacy
      ]
    );

    const newEventId = result.insertId;
    const [newEventRows] = await connection.execute(
      `SELECT * FROM itinerary_event WHERE event_id = ?`,
      [newEventId]
    );

    await connection.commit();

    return res.status(201).json({ success: true, event: newEventRows[0] });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error creating event:", error);
    return res
      .status(500)
      .json({ message: "Server error creating event", error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * PATCH /api/trips/:tripId/events/:eventId
 * Update an existing event
 */
router.patch("/:eventId", authenticateToken, async (req, res) => {
  const { tripId, eventId } = req.params;
  const { user_id } = req.user;
  const { title, type, start_time, end_time, location_input, cost, details, is_private } = req.body || {};

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verify ownership/access
    // Note: For private events, usually only the creator can edit.
    // For public events, any member can edit (depending on your rules).
    const [eventCheck] = await connection.execute(
      `SELECT created_by, is_private FROM itinerary_event WHERE event_id = ? AND trip_id = ?`,
      [eventId, tripId]
    );

    if (!eventCheck || eventCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Event not found." });
    }

    // Check trip membership
    const [membership] = await connection.execute(
        `SELECT 1 FROM trip_membership WHERE user_id = ? AND trip_id = ?`,
        [user_id, tripId]
    );
    if (!membership.length) {
        await connection.rollback();
        return res.status(403).json({ message: "Access denied." });
    }

    // Specific Privacy Check: If private, ONLY creator can edit
    const existingEvent = eventCheck[0];
    if (existingEvent.is_private && String(existingEvent.created_by) !== String(user_id)) {
        await connection.rollback();
        return res.status(403).json({ message: "You cannot edit this private event." });
    }

    // Geocoding logic
    let locationFields = "";
    const values = [];

    if (location_input !== undefined && location_input !== null) {
      try {
        const geoResult = await geocodeLocation(location_input);
        if (geoResult) {
          locationFields = `, location_display_name = ?, latitude = ?, longitude = ?`;
          values.push(geoResult.location_display_name, geoResult.latitude, geoResult.longitude);
        } else {
          locationFields = `, location_display_name = ? , latitude = NULL, longitude = NULL`;
          values.push(location_input);
        }
      } catch (e) {
        locationFields = `, location_display_name = ?, latitude = NULL, longitude = NULL`;
        values.push(location_input);
      }
    }

    // Build update
    const safeCost = cost !== undefined ? Number(cost) : null;
    const safeStart = parseToISO(start_time);
    const safeEnd = parseToISO(end_time);
    const safePrivate = is_private !== undefined ? (is_private ? 1 : 0) : null;

    const updateQuery = `
      UPDATE itinerary_event SET
        title = COALESCE(?, title),
        type = COALESCE(?, type),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        location_input = COALESCE(?, location_input),
        cost = COALESCE(?, cost),
        details = COALESCE(?, details),
        is_private = COALESCE(?, is_private)
        ${locationFields}
      WHERE event_id = ? AND trip_id = ?
    `;

    const params = [
      title,
      type,
      safeStart,
      safeEnd,
      location_input,
      safeCost,
      details,
      safePrivate,
      ...values,
      eventId,
      tripId,
    ];

    await connection.execute(updateQuery, params);
    await connection.commit();

    const [updatedEventRows] = await connection.execute(
      "SELECT * FROM itinerary_event WHERE event_id = ?",
      [eventId]
    );

    return res.status(200).json({ success: true, event: updatedEventRows[0] });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error updating event:", error);
    return res
      .status(500)
      .json({ message: "Server error updating event", error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * DELETE /api/trips/:tripId/events/:eventId
 */
router.delete("/:eventId", authenticateToken, async (req, res) => {
  const { eventId, tripId } = req.params;
  const { user_id } = req.user;

  try {
    // 1. Get event details to check ownership
    const [rows] = await pool.execute(
        `SELECT created_by, is_private FROM itinerary_event WHERE event_id = ? AND trip_id = ?`,
        [eventId, tripId]
    );
    
    if (rows.length === 0) return res.status(404).json({ message: "Event not found" });
    const event = rows[0];

    // 2. Check permissions
    const [membership] = await pool.execute(
        `SELECT role FROM trip_membership WHERE user_id = ? AND trip_id = ?`,
        [user_id, tripId]
    );
    if (!membership.length) return res.status(403).json({message: "Access Denied"});

    const role = membership[0].role;
    const isCreator = String(event.created_by) === String(user_id);
    const isAdmin = ['owner', 'organizer'].includes(role);

    // RULE: 
    // - If Private: Only Creator can delete
    // - If Public: Creator OR Admin can delete
    if (event.is_private && !isCreator) {
        return res.status(403).json({ message: "Only the creator can delete this private event." });
    }
    if (!event.is_private && !isCreator && !isAdmin) {
        return res.status(403).json({ message: "You don't have permission to delete this event." });
    }

    // 3. Delete
    await pool.execute("DELETE FROM itinerary_event WHERE event_id = ?", [eventId]);

    return res.status(200).json({ success: true, message: "Event deleted successfully." });
  } catch (error) {
    console.error("Error deleting event:", error);
    return res.status(500).json({ message: "Error deleting event.", error: error.message });
  }
});

module.exports = router;