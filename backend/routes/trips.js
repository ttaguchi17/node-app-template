// backend/routes/trips.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const geocodeLocation = require('../services/geocoding');
const pool = require('../config/database');

// --- Import the sub-routers ---
const eventsRouter = require('./events');
const membersRouter = require('./members');

console.log("\n" + "="*50);
console.log("   SUCCESSFULLY LOADED NEW trips.js (v8 - Fixed)   ");
console.log("="*50 + "\n");

// --- Tell Express to use the sub-routers ---
router.use('/:tripId/events', eventsRouter); 
router.use('/:tripId/members', membersRouter);


// Get all trips for user
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
    console.error(error);
    res.status(500).json({ message: 'Error retrieving trips.' });
  }
});

// Get single trip
router.get('/:tripId', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user.user_id;

  console.log(`🔍 [DEBUG GET TRIP] Looking for Trip: ${tripId}, User: ${userId}`);

  try {
    const [rows] = await pool.execute(
      `SELECT t.*, tm.role as my_role, tm.status as my_status FROM trip t
         JOIN trip_membership tm ON t.trip_id = tm.trip_id
       WHERE tm.user_id = ? AND t.trip_id = ? 
       AND tm.status IN ('accepted', 'organizer', 'owner', 'admin')`,
      [userId, tripId]
    );
    
    console.log(`🔍 [DEBUG GET TRIP] Rows found: ${rows.length}`);

    if (rows.length === 0) {
      // Let's see WHY it failed. Does the membership exist at all?
      const [check] = await pool.execute(
          `SELECT * FROM trip_membership WHERE user_id = ? AND trip_id = ?`, 
          [userId, tripId]
      );
      console.log(`🔍 [DEBUG GET TRIP] Membership check:`, check[0] || "No membership found");
      
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
  const { user_id } = req.user; // Use user_id from token

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
    await connection.execute(
      'INSERT INTO trip_membership (user_id, trip_id, role, status, invited_at) VALUES (?, ?, ?, \'accepted\', NOW())',
      [user_id, newTripId, 'organizer'] // Use user_id
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
  values.push(req.user.user_id); // <-- FIXED: Use user_id
  try {
    const [result] = await pool.execute(
      `UPDATE trip t
         JOIN trip_membership tm ON t.trip_id = tm.trip_id
       WHERE t.trip_id = ? AND tm.user_id = ?
         SET ${updateFields.join(', ')}`, // <-- Fixed: SET clause at end
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
  const { user_id } = req.user; // <-- FIXED: Use user_id
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [membership] = await connection.execute(
      `SELECT tm.role FROM trip_membership tm
       WHERE tm.user_id = ? AND tm.trip_id = ?`,
      [user_id, tripId] // <-- Fixed
    );
    if (membership.length === 0 || membership[0].role !== 'organizer') {
      return res.status(403).json({ message: 'Access denied. Only organizer can delete.' });
    }
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

module.exports = router;