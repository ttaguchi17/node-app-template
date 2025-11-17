const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const EmailExtractorService = require('../services/emailExtractor');
const { mapExtractedDataToEvent, mapToItineraryEventPreview } = require('../utils/mappers');
const pool = require('../config/database');

// Extract booking from email
router.post('/extract', authenticateToken, async (req, res) => {
  const { from, subject, body } = req.body;
  
  if (!from || !subject || !body) {
    return res.status(400).json({ message: 'Email from, subject, and body are required.' });
  }

  try {
    // Call Python service
    const result = await EmailExtractorService.extractBooking({
      email_id: 'manual_' + Date.now()
    });

    if (!result.success) {
      return res.status(400).json({ message: 'Extraction failed', error: result.error });
    }

    // Return extracted data for review
    res.json({
      message: 'Extraction successful',
      extracted: result.data,
      preview: mapToItineraryEventPreview(result.data)
    });

  } catch (error) {
    console.error('Error in extraction route:', error);
    res.status(500).json({ message: 'Server error during extraction.' });
  }
});

// Save extracted booking to a trip
router.post('/trips/:tripId/bookings', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const { extractedData } = req.body;
  const userId = req.user.user_id;

  if (!extractedData || !extractedData.type) {
    return res.status(400).json({ message: 'Valid extracted data required.' });
  }

  const connection = await pool.getConnection();
  try {
    // Verify user is member of trip
    const [membership] = await connection.execute(
      "SELECT tm.role FROM trip_membership tm\nJOIN `user` u ON tm.user_id = u.user_id\nWHERE u.user_id = ? AND tm.trip_id = ?",
      [userId, tripId]
    );

    if (membership.length === 0) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this trip.' });
    }

    // Map extracted data to itinerary_event format
    const eventData = mapExtractedDataToEvent(extractedData);

    // Insert into itinerary_event
    const [result] = await connection.execute(
      `INSERT INTO itinerary_event (
        trip_id, title, type, start_time, end_time, 
        location_input, location_display_name, latitude, longitude, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tripId,
        eventData.title,
        eventData.type,
        eventData.start_time,
        eventData.end_time,
        eventData.location_input,
        eventData.location_display_name,
        eventData.latitude,
        eventData.longitude,
        JSON.stringify(extractedData) // Store full extracted data as backup
      ]
    );

    res.status(201).json({
      message: 'Booking saved to trip',
      event_id: result.insertId,
      event: eventData
    });
  } catch (error) {
    console.error('Error saving booking:', error);
    res.status(500).json({ message: 'Error saving booking to trip.' });
  } finally {
    connection.release();
  }
});

module.exports = router;