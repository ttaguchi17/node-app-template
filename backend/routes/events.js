const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const geocodeLocation = require('../services/geocoding');
const pool = require('../config/database');

// Get all events for a trip
router.get('/trips/:tripId/events', authenticateToken, async (req, res) => {
  const { tripId } = req.params;

  try {
    const [events] = await pool.execute(
      'SELECT * FROM itinerary_event WHERE trip_id = ? ORDER BY start_time ASC',
      [tripId]
    );
    
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events.' });
  }
});

// Add event to trip
router.post('/trips/:tripId/events', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const { title, type, start_time, end_time, location_input, details } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Event title is required.' });
  }

  let insertData = {
    trip_id: tripId,
    title: title,
    type: type || 'Other',
    start_time: start_time || null,
    end_time: end_time || null,
    details: details || null,
    location_input: location_input || null,
  };

  // Try to geocode location
  if (location_input) {
    const geoResult = await geocodeLocation(location_input);
    if (geoResult) {
      Object.assign(insertData, geoResult);
    } else {
      insertData.location_display_name = location_input;
    }
  }

  const connection = await pool.getConnection();
  try {
    const fields = Object.keys(insertData);
    const placeholders = fields.map(() => '?').join(', ');
    const values = Object.values(insertData);

    const [result] = await connection.execute(
      `INSERT INTO itinerary_event (${fields.join(', ')}) VALUES (${placeholders})`,
      values
    );

    res.status(201).json({
      event_id: result.insertId,
      ...insertData
    });
  } catch (error) {
    console.error('Error adding event:', error);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(404).json({ message: `Trip with ID ${tripId} not found.` });
    }
    res.status(500).json({ message: 'Error adding event.' });
  } finally {
    connection.release();
  }
});

// Update event
router.patch('/trips/:tripId/events/:eventId', authenticateToken, async (req, res) => {
  const { eventId } = req.params;
  const { title, type, start_time, end_time, location_input, details } = req.body;

  const updateFields = [];
  const values = [];

  if (title !== undefined) {
    updateFields.push('title = ?');
    values.push(title);
  }
  if (type !== undefined) {
    updateFields.push('type = ?');
    values.push(type);
  }
  // ... (same for other fields)

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

  values.push(eventId);

  try {
    const [result] = await pool.execute(
      `UPDATE itinerary_event SET ${updateFields.join(', ')} WHERE event_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    res.status(200).json({ message: 'Event updated successfully!', updatedFields: req.body });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Error updating event.' });
  }
});

// Delete event
router.delete('/trips/:tripId/events/:eventId', authenticateToken, async (req, res) => {
  const { eventId } = req.params;

  try {
    const [result] = await pool.execute(
      'DELETE FROM itinerary_event WHERE event_id = ?',
      [eventId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    res.status(200).json({ message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Error deleting event.' });
  }
});

module.exports = router;