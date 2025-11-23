// backend/routes/events.js
const express = require("express");
// CRITICAL: This allows us to get the :tripId from the parent router
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
    // If it already looks like an ISO with 'T', just validate it
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch (e) {
    return null;
  }
}

/**
 * GET /api/trips/:tripId/events
 * Get all events for a specific trip
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

    // Fetch events
    const [events] = await pool.execute(
      `SELECT * FROM itinerary_event WHERE trip_id = ? ORDER BY start_time ASC`,
      [tripId]
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

    // Dates - prefer well-formed ISO, else try parse
    let start_time = body.check_in_date || body.departure_date || body.start_time || null;
    let end_time = body.check_out_date || body.arrival_date || body.end_time || null;

    start_time = parseToISO(start_time);
    end_time = parseToISO(end_time);

    // Prepare details: full JSON for imports, otherwise provided details
    const details = body.id ? JSON.stringify(body) : (body.details ? JSON.stringify(body.details) : null);

    // Geocode if we have an input location
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
        // Geocoding failure shouldn't block event creation
        console.warn("Geocoding error: ", e && e.message ? e.message : e);
        location_display_name = location_input;
      }
    }

    // Insert event
    const [result] = await connection.execute(
      `INSERT INTO itinerary_event 
        (trip_id, title, type, start_time, end_time, location_input, location_display_name, latitude, longitude, details, cost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
  const { title, type, start_time, end_time, location_input, cost, details } = req.body || {};

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verify ownership (user is on trip)
    const [ownerRows] = await connection.execute(
      `SELECT 1 FROM itinerary_event ie
       JOIN trip_membership tm ON ie.trip_id = tm.trip_id
       WHERE ie.event_id = ? AND ie.trip_id = ? AND tm.user_id = ? LIMIT 1`,
      [eventId, tripId, user_id]
    );

    if (!ownerRows || ownerRows.length === 0) {
      await connection.rollback();
      return res.status(403).json({ message: "Access denied or event not found." });
    }

    // If location changed, re-geocode
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
        // If geocoding fails, still allow update but store raw input
        locationFields = `, location_display_name = ?, latitude = NULL, longitude = NULL`;
        values.push(location_input);
        console.warn("Geocoding failed during update:", e && e.message ? e.message : e);
      }
    }

    // sanitize numeric cost
    const safeCost = cost !== undefined ? Number(cost) : null;

    // Use parseToISO helper for dates
    const safeStart = parseToISO(start_time);
    const safeEnd = parseToISO(end_time);

    // Build update statement
    const updateQuery = `
      UPDATE itinerary_event SET
        title = COALESCE(?, title),
        type = COALESCE(?, type),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        location_input = COALESCE(?, location_input),
        cost = COALESCE(?, cost),
        details = COALESCE(?, details)
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
      ...values,
      eventId,
      tripId,
    ];

    const [result] = await connection.execute(updateQuery, params);

    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Event not found." });
    }

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
 * Delete an event
 */
router.delete("/:eventId", authenticateToken, async (req, res) => {
  const { eventId, tripId } = req.params;
  const { user_id } = req.user;

  try {
    // Verify membership
    const [ownerRows] = await pool.execute(
      `SELECT 1 FROM trip_membership WHERE trip_id = ? AND user_id = ? LIMIT 1`,
      [tripId, user_id]
    );
    if (!ownerRows || ownerRows.length === 0) {
      return res.status(403).json({ message: "Access denied." });
    }

    const [result] = await pool.execute(
      "DELETE FROM itinerary_event WHERE event_id = ? AND trip_id = ?",
      [eventId, tripId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Event not found." });
    }

    return res.status(200).json({ success: true, message: "Event deleted successfully." });
  } catch (error) {
    console.error("Error deleting event:", error);
    return res.status(500).json({ message: "Error deleting event.", error: error.message });
  }
});

module.exports = router;
