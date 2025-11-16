// backend/routes/users.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * Robust GET /api/users
 * - Reads all columns from `user` table (so we don't reference missing columns)
 * - Normalizes each row to { id, name, email }
 * - If a query param is provided, performs case-insensitive filter in JS
 *
 * Note: For large production DBs you'd implement a proper SQL search, but for a class project
 * reading a limited set and filtering in JS is simpler and more tolerant of schema differences.
 */
router.get('/', async (req, res) => {
  try {
    const qRaw = (req.query.query || '').trim();
    const q = qRaw.toLowerCase();

    // Read rows from `user` table. Use backticks to avoid reserved word issue.
    // Limit to 1000 rows to avoid returning too much for class project.
    const [rows] = await pool.execute('SELECT * FROM `user` LIMIT 1000');

    // Normalize rows to common shape { id, name, email }
    const normalized = (rows || []).map(r => {
      // id candidates
      const id = r.user_id ?? r.id ?? r.ID ?? r.userId ?? null;

      // name candidates: try single name-like columns first, otherwise combine first/last
      let name = null;
      if (r.name) name = r.name;
      else if (r.full_name) name = r.full_name;
      else if (r.display_name) name = r.display_name;
      else {
        const first = r.first_name ?? r.firstname ?? r.given_name ?? '';
        const last = r.last_name ?? r.lastname ?? r.surname ?? r.family_name ?? '';
        const combined = `${first} ${last}`.trim();
        if (combined) name = combined;
      }

      // fallback to username/email if still no name
      if (!name) name = r.username ?? r.email ?? r.user_email ?? `User ${id ?? ''}`;

      // email candidates
      const email = r.email ?? r.user_email ?? r.username ?? null;

      return {
        id: id !== undefined && id !== null ? String(id) : null,
        name: name || null,
        email: email || null,
        raw: r // include raw row for debugging if you want
      };
    });

    // If query present, filter client-side by name or email (case-insensitive)
    const filtered = q
      ? normalized.filter(u => {
          const hay = `${u.name ?? ''} ${u.email ?? ''}`.toLowerCase();
          return hay.includes(q);
        })
      : normalized;

    res.json(filtered);
  } catch (err) {
    console.error('GET /api/users error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'db error', details: err && err.message });
  }
});

module.exports = router;
