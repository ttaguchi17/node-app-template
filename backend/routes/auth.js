const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis'); // Move to top
const pool = require('../config/database'); // Only declare ONCE

// ====================
// AUTH ROUTES (Login/Register)
// ====================

router.post('/create-account', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO `user` (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );
    
    res.status(201).json({ message: 'Account created successfully!', user_id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'An account with this email already exists.' });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Error creating account.' });
    }
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  try {
    const [rows] = await pool.execute('SELECT * FROM `user` WHERE email = ?', [email]);
    
    if (rows.length === 0)
      return res.status(401).json({ message: 'Invalid email or password.' });

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid email or password.' });

    const token = jwt.sign(
      { email: user.email, user_id: user.user_id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    res.status(200).json({ token, user_id: user.user_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging in.' });
  }
});

// ====================
// GMAIL OAUTH ROUTES
// ====================

// OAuth2 client setup (moved BEFORE module.exports)
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Middleware to authenticate JWT (needed for Gmail routes)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1] : authHeader;

  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid token.' });

    try {
      const [rows] = await pool.execute(
        'SELECT user_id, email FROM `user` WHERE email = ?',
        [decoded.email]
      );

      if (rows.length === 0)
        return res.status(403).json({ message: 'Account not found or deactivated.' });

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

// ✅ Get OAuth URL
router.get('/gmail/connect', authenticateToken, (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    prompt: 'consent'
  });
  
  res.json({ auth_url: authUrl });
});

// ✅ OAuth callback
router.get('/gmail/callback', authenticateToken, async (req, res) => {
  const { code } = req.query;
  const userId = req.user.user_id;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const gmailAddress = profile.data.emailAddress;

    await pool.execute(
      `INSERT INTO gmail_tokens (user_id, email, access_token, refresh_token, token_expiry, scope)
       VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND), ?)
       ON DUPLICATE KEY UPDATE
       access_token = VALUES(access_token),
       refresh_token = VALUES(refresh_token),
       token_expiry = VALUES(token_expiry),
       email = VALUES(email)`,
      [
        userId,
        gmailAddress,
        tokens.access_token,
        tokens.refresh_token,
        tokens.expires_in,
        tokens.scope
      ]
    );

    res.redirect(`http://localhost:3000?gmail=success`);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`http://localhost:3000?gmail=error&message=${encodeURIComponent(error.message)}`);
  }
});

// ✅ Check Gmail status
router.get('/gmail/status', authenticateToken, async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT email, token_expiry FROM gmail_tokens WHERE user_id = ?',
    [req.user.user_id]
  );
  
  const isConnected = rows.length > 0;
  const needsReauth = isConnected && new Date(rows[0].token_expiry) < new Date();
  
  res.json({
    connected: isConnected,
    email: isConnected ? rows[0].email : null,
    needs_reauth: needsReauth
  });
});

// ✅ Disconnect Gmail
router.delete('/gmail/disconnect', authenticateToken, async (req, res) => {
  await pool.execute(
    'DELETE FROM gmail_tokens WHERE user_id = ?',
    [req.user.user_id]
  );
  
  res.json({ message: 'Gmail disconnected' });
});

// ====================
// EXPORT ROUTER (MUST BE LAST)
// ====================
module.exports = router; // ✨ This must be at the very end!