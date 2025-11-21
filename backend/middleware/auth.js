// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1] : authHeader;

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // Verify token synchronously via callback
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.error('JWT verify error:', err && err.message);
      return res.status(403).json({ message: 'Invalid token.' });
    }

    // Debug: log decoded claims (remove if token contains sensitive data)
    console.log('authenticateToken - decoded token:', { ...decoded });

    try {
      // Prefer numeric user id from token if present
      const tokenUserId = decoded.user_id ?? decoded.userId ?? decoded.id ?? null;
      const tokenEmail = decoded.email ?? null;

      let userRow = null;

      // Try to find by user id first (common and reliable)
      if (tokenUserId) {
        try {
          const [rows] = await pool.execute(
            'SELECT user_id, email FROM `user` WHERE user_id = ? LIMIT 1',
            [tokenUserId]
          );
          if (rows && rows.length) userRow = rows[0];
        } catch (e) {
          // If the `user` table/column doesn't exist, we'll fall through to other attempts
          console.warn('authenticateToken: lookup by user_id failed (maybe different schema).', e.message);
        }
      }

      // If not found, try lookup by email in `user` table
      if (!userRow && tokenEmail) {
        try {
          const [rows] = await pool.execute(
            'SELECT user_id, email FROM `user` WHERE email = ? LIMIT 1',
            [tokenEmail]
          );
          if (rows && rows.length) userRow = rows[0];
        } catch (e) {
          console.warn('authenticateToken: lookup by email (user) failed.', e.message);
        }
      }

      // Fallback: try common alternative table name `users` with column `id`
      if (!userRow) {
        try {
          const idCandidate = tokenUserId ?? null;
          if (idCandidate) {
            const [rows] = await pool.execute(
              'SELECT id AS user_id, email FROM `users` WHERE id = ? LIMIT 1',
              [idCandidate]
            );
            if (rows && rows.length) userRow = rows[0];
          }
        } catch (e) {
          // ignore
        }
      }

      // Fallback: try users table by email
      if (!userRow && tokenEmail) {
        try {
          const [rows] = await pool.execute(
            'SELECT id AS user_id, email FROM `users` WHERE email = ? LIMIT 1',
            [tokenEmail]
          );
          if (rows && rows.length) userRow = rows[0];
        } catch (e) {
          // ignore
        }
      }

      if (!userRow) {
        console.warn('authenticateToken: no user found for token.', { tokenUserId, tokenEmail });
        // Use 401 to request auth; change to 403 if you want to keep previous semantics
        return res.status(401).json({ message: 'Account not found or deactivated.' });
      }

      // attach normalized user to request
      req.user = {
        user_id: Number(userRow.user_id),
        email: userRow.email,
      };

      next();
    } catch (dbError) {
      console.error('Database error during authentication:', dbError && dbError.stack ? dbError.stack : dbError);
      res.status(500).json({ message: 'Database error during authentication.' });
    }
  });
}

module.exports = authenticateToken;
