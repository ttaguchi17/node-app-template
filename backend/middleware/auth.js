const jwt = require('jsonwebtoken');
const pool = require('../config/database');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1] : authHeader;

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid token.' });

    try {
      const [rows] = await pool.execute(
        'SELECT user_id, email FROM `user` WHERE email = ?',
        [decoded.email]
      );

      if (rows.length === 0) {
        return res.status(403).json({ message: 'Account not found or deactivated.' });
      }

      req.user = {
        user_id: rows[0].user_id,
        email: rows[0].email
      };
      next();
    } catch (dbError) {
      console.error(dbError);
      res.status(500).json({ message: 'Database error during authentication.' });
    }
  });
}

module.exports = authenticateToken;