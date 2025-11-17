// backend/routes/events.js
const express = require("express");
// CRITICAL: This allows us to get the :tripId from the parent router
const router = express.Router({ mergeParams: true });
const pool = require("../config/database");
const authenticateToken = require("../middleware/auth");
const geocodeLocation = require("../services/geocoding");

/**
 * @route   GET /api/trips/:tripId/events
 * @desc    Get all events for a specific trip
 */
router.get("/", authenticateToken, async (req, res) => {
  const { tripId } = req.params; // <-- This works because of mergeParams
  const { user_id } = req.user;

  try {
    // Verify user is on this trip (Security Check)
    const [tripRows] = await pool.execute(
      `SELECT 1 FROM trip_membership WHERE trip_id = ? AND user_id = ?`,
      [tripId, user_id]
    );
    if (tripRows.length === 0) {
      return res.status(403).json({ message: "Access denied to this trip." });
    }

    // Get the events
    const [events] = await pool.execute(
      "SELECT * FROM itinerary_event WHERE trip_id = ? ORDER BY start_time ASC",
      [tripId]
    );
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res
      .status(500)
      .json({ message: "Server error fetching events", error: error.message });
  }
});

/**
 * @route   POST /api/trips/:tripId/events
 * @desc    Create a new event (Handles BOTH manual and Gmail import)
 */
router.post("/", authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const { user_id } = req.user;
  // This body could be a full 'booking' object OR a manual event
  const body = req.body || {};
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction(); // 1. Verify user is on this trip

    const [membership] = await connection.execute(
      `SELECT role FROM trip_membership WHERE user_id = ? AND trip_id = ?`,
      [user_id, tripId]
    );
    if (membership.length === 0) {
      await connection.rollback();
      return res.status(403).json({ message: "Access denied." });
    }

    // 2. --- DUPLICATE CHECK (for Gmail imports) ---
    if (body.id) {
      // 'id' will only exist on a Gmail booking
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
    } // 3. --- MAP DATA (Handles BOTH import and manual) ---

    // Use data from body, or fallbacks
    const type = body.type
      ? body.type.charAt(0).toUpperCase() + body.type.slice(1)
      : "Activity";
    const title =
      body.title || body.hotel_name || body.airline || `${type} Booking`;
    let location_input =
      body.address ||
      body.hotel_name ||
      body.departure_airport ||
      body.location_input ||
      null;
    const cost = body.price_usd || body.cost || 0.0;

    // Dates: Use Python-parsed dates first, fall back to manual start_time
    let start_time =
      body.check_in_date || body.departure_date || body.start_time || null;
    let end_time =
      body.check_out_date || body.arrival_date || body.end_time || null;

    // Convert to ISO if it's a "human" string (like from Python)
    try {
      if (start_time && !start_time.includes("T"))
        start_time = new Date(start_time).toISOString();
      if (end_time && !end_time.includes("T"))
        end_time = new Date(end_time).toISOString();
    } catch (e) {
      console.warn("Could not parse date string:", e.message);
    }

    // Set details: If 'id' exists, it's an import, so save full JSON.
    // Otherwise, it's manual, so save the 'details' field.
    const details = body.id
      ? JSON.stringify(body, null, 2)
      : body.details || null;

    // 4. Geocode
    let location_display_name = null;
    let latitude = null;
    let longitude = null;
    if (location_input) {
      const geoResult = await geocodeLocation(location_input);
      if (geoResult) {
        location_display_name = geoResult.location_display_name;
        latitude = geoResult.latitude;
        longitude = geoResult.longitude;
      } else {
        location_display_name = location_input;
      }
    } // 5. Insert
    const [result] = await connection.execute(
      `INSERT INTO itinerary_event (trip_id, title, type, start_time, end_time, location_input, location_display_name, latitude, longitude, details, cost)
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
      "SELECT * FROM itinerary_event WHERE event_id = ?",
      [newEventId]
    );
    await connection.commit();
    res.status(201).json(newEventRows[0]);
  } catch (error) {
    await connection.rollback();
    console.error("Error creating event:", error);
    res
      .status(500)
      .json({ message: "Server error creating event", error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * @route   PATCH /api/trips/:tripId/events/:eventId
 * @desc    Update an existing event
 */
router.patch("/:eventId", authenticateToken, async (req, res) => {
  const { tripId, eventId } = req.params;
  const { user_id } = req.user;

  const { title, type, start_time, end_time, location_input, cost, details } =
    req.body;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Verify user owns this event
    const [ownerRows] = await connection.execute(
      `SELECT 1 FROM itinerary_event ie
       JOIN trip_membership tm ON ie.trip_id = tm.trip_id
       WHERE ie.event_id = ? AND ie.trip_id = ? AND tm.user_id = ?`,
      [eventId, tripId, user_id]
    );

    if (ownerRows.length === 0) {
      await connection.rollback();
      return res
        .status(403)
        .json({ message: "Access denied or event not found." });
    }

    // 2. Re-geocode if location changed
    let locationFields = "";
    const values = [];

    if (location_input) {
      const geoResult = await geocodeLocation(location_input);
      if (geoResult) {
        locationFields = `,
          location_display_name = ?,
          latitude = ?,
          longitude = ?
        `;
        values.push(
          geoResult.location_display_name,
          geoResult.latitude,
          geoResult.longitude
        );
      } else {
        locationFields = `,
          location_display_name = ?,
          latitude = NULL,
          longitude = NULL
        `;
        values.push(location_input);
      }
    }

    // 3. Prepare the main update query
    const [result] = await connection.execute(
      `UPDATE itinerary_event SET
         title = ?, type = ?, start_time = ?, end_time = ?, 
         location_input = ?, cost = ?, details = ?
         ${locationFields}
       WHERE event_id = ? AND trip_id = ?`,
      [
        title,
        type,
        start_time,
        end_time,
        location_input,
        Number(cost),
        details,
        ...values, // Add the geocoding values
        eventId,
        tripId,
      ]
    );

    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Event not found." });
    }

    // 4. Fetch and return the updated event
    const [updatedEventRows] = await connection.execute(
      "SELECT * FROM itinerary_event WHERE event_id = ?",
      [eventId]
    );
    res.status(200).json(updatedEventRows[0]);
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error updating event:", error);
    res
      .status(500)
      .json({ message: "Server error updating event", error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * @route   DELETE /api/trips/:tripId/events/:eventId
 * @desc    Delete an event
 */
router.delete("/:eventId", authenticateToken, async (req, res) => {
  const { eventId, tripId } = req.params;
  const { user_id } = req.user;

  try {
    // Security check: Verify user is on the trip
    const [ownerRows] = await pool.execute(
      `SELECT 1 FROM trip_membership
       WHERE trip_id = ? AND user_id = ?`,
      [tripId, user_id]
    );
    if (ownerRows.length === 0) {
      return res.status(403).json({ message: "Access denied." });
    }

    const [result] = await pool.execute(
      "DELETE FROM itinerary_event WHERE event_id = ? AND trip_id = ?",
      [eventId, tripId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Event not found." });
    }

    res.status(200).json({ message: "Event deleted successfully." });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Error deleting event." });
  }
});

module.exports = router;
