// backend/routes/trips.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const geocodeLocation = require('../services/geocoding');
const pool = require('../config/database');


// Import modular sub-routers
const membersRouter = require('./members');
const eventsRouter = require('./events');
const invitationsRouter = require('./invitations');
const budgetRouter = require('./budget');

/**
 * Minimal startup log so we know file loaded
 */
console.log("\n" + "=".repeat(50));
console.log("   SUCCESSFULLY LOADED trips.js (HUB)   ");
console.log("=".repeat(50) + "\n");

// Mount sub-routers for trip-specific resources
// These handle /:tripId/members, /:tripId/events, /:tripId/invitations
router.use('/:tripId/members', membersRouter);
router.use('/:tripId/events', eventsRouter);
router.use('/:tripId/invitations', invitationsRouter);
router.use('/:tripId/budget', budgetRouter);

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
 * GET /api/trips/budget/all
 * Returns a summary of all trips with budget vs total spent and forecasted spending
 */
router.get('/budget/all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;

    // 1. Get all trips user is part of
    const [trips] = await pool.execute(
      `SELECT t.trip_id, t.name, t.start_date, tm.budget_goal
       FROM trip t
       JOIN trip_membership tm ON t.trip_id = tm.trip_id
       WHERE tm.user_id = ? AND tm.status IN ('accepted', 'organizer', 'owner', 'admin')
       ORDER BY t.start_date DESC`,
      [userId]
    );

    // 2. Calculate Total Spent per trip (Actual expenses)
    const tripIds = trips.map(t => t.trip_id);
    
    let expenseMap = {};
    let pendingMap = {};
    
    if (tripIds.length > 0) {
      const placeholders = tripIds.map(() => '?').join(',');
      
      // Get actual expenses
      const [expenses] = await pool.execute(
        `SELECT trip_id, SUM(amount) as total
         FROM expenses 
         WHERE trip_id IN (${placeholders})
         GROUP BY trip_id`,
        tripIds
      );
      
      expenses.forEach(row => {
        expenseMap[row.trip_id] = parseFloat(row.total || 0);
      });

      // 3. Calculate Pending/Forecasted Costs (Events without linked expenses)
      // Only count public events OR private events created by current user
      const [pendingCosts] = await pool.execute(
        `SELECT ie.trip_id, SUM(ie.cost) as total_pending
         FROM itinerary_event ie
         LEFT JOIN expenses e ON ie.event_id = e.event_id
         WHERE ie.trip_id IN (${placeholders})
           AND e.expense_id IS NULL
           AND ie.cost > 0
           AND (ie.is_private = 0 OR (ie.is_private = 1 AND ie.created_by = ?))
         GROUP BY ie.trip_id`,
        [...tripIds, userId]
      );
      
      pendingCosts.forEach(row => {
        pendingMap[row.trip_id] = parseFloat(row.total_pending || 0);
      });
    }

    // 4. Merge Data with Plan vs. Actual
    const summary = trips.map(t => ({
      trip_id: t.trip_id,
      name: t.name,
      start_date: t.start_date,
      budget_goal: parseFloat(t.budget_goal || 1000),
      total_spent: expenseMap[t.trip_id] || 0,
      total_pending: pendingMap[t.trip_id] || 0
    }));

    res.json(summary);

  } catch (error) {
    console.error('GET /api/trips/budget/all error', error);
    res.status(500).json({ message: 'Error retrieving budget summary.' });
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

module.exports = router;
