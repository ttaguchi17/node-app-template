// backend/routes/calendar.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const pool = require('../config/database');

/**
 * Helper: Generate consistent color for a trip based on trip_id
 */
function getTripColor(tripId) {
  const colors = [
    '#4A6CF7', // Blue
    '#8B63F0', // Purple
    '#FF6B9D', // Pink
    '#FFA26B', // Orange
    '#6BCF7F', // Green
    '#FFD93D', // Yellow
    '#6BCF9F', // Teal
    '#FF6B6B', // Red
    '#9B6BFF', // Lavender
    '#6BAFFF', // Sky Blue
  ];
  return colors[tripId % colors.length];
}

/**
 * GET /api/calendar/events
 * Returns all events across all user's trips with privacy filtering
 * - Public events: visible to all trip members
 * - Private events: only visible to event creator
 */
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Fetch all events from trips the user is a member of
    // Filter: Public events OR private events created by the current user
    const [events] = await pool.execute(
      `SELECT 
        ie.event_id,
        ie.trip_id,
        ie.title as eventName,
        ie.type,
        ie.start_time as startDate,
        ie.end_time as endDate,
        ie.location_display_name as location,
        ie.cost,
        ie.is_private,
        ie.created_by,
        t.name as tripName
       FROM itinerary_event ie
       JOIN trip t ON ie.trip_id = t.trip_id
       JOIN trip_membership tm ON t.trip_id = tm.trip_id
       WHERE tm.user_id = ? 
         AND tm.status IN ('accepted', 'organizer', 'owner', 'admin')
         AND (
           ie.is_private = FALSE 
           OR 
           (ie.is_private = TRUE AND ie.created_by = ?)
         )
       ORDER BY ie.start_time ASC`,
      [userId, userId]
    );

    // Add color to each event based on trip_id
    const eventsWithColors = events.map(event => ({
      id: event.event_id,
      tripId: event.trip_id,
      tripName: event.tripName,
      eventName: event.eventName,
      type: event.type,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      cost: event.cost,
      isPrivate: event.is_private === 1,
      createdBy: event.created_by,
      color: getTripColor(event.trip_id),
    }));

    res.status(200).json({ success: true, events: eventsWithColors });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving calendar events', 
      error: error.message 
    });
  }
});

module.exports = router;
