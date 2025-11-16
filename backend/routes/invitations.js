// backend/routes/invitations.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// POST /api/trips/:tripId/invitations
router.post('/:tripId/invitations', async (req, res) => {
  const tripId = Number(req.params.tripId);
  const { invited_user_ids = [], invited_emails = [], message = '', role = 'member' } = req.body;
  const invitedBy = req.body.invited_by_user_id || null;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const created = [];

    for (const uidRaw of invited_user_ids) {
      const uid = Number(uidRaw);
      // skip if membership exists
      const [existing] = await conn.execute(
        `SELECT id FROM trip_membership WHERE trip_id = ? AND user_id = ? LIMIT 1`,
        [tripId, uid]
      );
      if (existing.length) continue;

      const [result] = await conn.execute(
        `INSERT INTO trip_membership (trip_id, user_id, role, status, invited_by_user_id, invited_at)
         VALUES (?, ?, ?, 'invited', ?, NOW())`,
        [tripId, uid, role, invitedBy]
      );
      created.push({ id: result.insertId, trip_id: tripId, user_id: uid });
    }

    // (optional) create rows for invited_emails if you want to store email-only invites

    await conn.commit();
    res.json({ success: true, created_count: created.length, created });
  } catch (err) {
    await conn.rollback();
    console.error('POST /api/trips/:tripId/invitations error', err);
    res.status(500).json({ error: 'db error' });
  } finally {
    conn.release();
  }
});

module.exports = router;
