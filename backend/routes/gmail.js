// backend/routes/gmail.js
const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Node versions >=18 expose a global `fetch`. node-fetch v3 is ESM-only
// and cannot be required from CommonJS. Provide a small helper that uses
// the global fetch when available, otherwise dynamically imports node-fetch.
async function nodeFetch(url, options) {
  if (typeof fetch === 'function') {
    return fetch(url, options);
  }
  const mod = await import('node-fetch');
  const nf = mod && (mod.default || mod);
  return nf(url, options);
}

// --- Middleware (Copied from auth.js) ---
const authenticateToken = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next();
    }
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// --- OAuth Setup ---
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// --- GMAIL OAUTH ROUTES ---

// ✅ Get OAuth URL
router.get('/connect', authenticateToken, (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.json({ auth_url: authUrl });
});

// ✅ OAuth callback
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  let connection;
  try {
    if (!state) throw new Error('No state token provided.');
    const user = jwt.verify(state, process.env.JWT_SECRET);
    if (!user || !user.user_id) throw new Error('Invalid state token');

    const { tokens } = await oauth2Client.getToken(code);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const gmailAddress = profile.data.emailAddress;
    const expiryDate = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);
    const expiryString = expiryDate.toISOString().slice(0, 19).replace('T', ' ');

    connection = await pool.getConnection();
    await connection.execute(
      `INSERT INTO gmail_tokens (user_id, email, access_token, refresh_token, token_expiry, scope)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       access_token = VALUES(access_token),
       refresh_token = IFNULL(VALUES(refresh_token), refresh_token),
       token_expiry = VALUES(token_expiry),
       email = VALUES(email)`,
      [
        user.user_id,
        gmailAddress,
        tokens.access_token,
        tokens.refresh_token || null,
        expiryString,
        tokens.scope
      ]
    );
    
    res.send(`<script>window.opener.postMessage({ type: 'GMAIL_CONNECTED' }, '*'); window.close();</script>`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.send(`<script>window.opener.postMessage({ type: 'GMAIL_ERROR' }, '*'); window.close();</script>`);
  } finally {
    if (connection) connection.release();
  }
});

// ✅ Check Gmail status
router.get('/status', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
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
  } catch (error) {
     console.error('Gmail status error:', error);
     res.status(500).json({ message: 'Failed to check Gmail status', error: error.message });
  } finally {
     if (connection) connection.release();
  }
});

// ✅ Disconnect Gmail
router.delete('/disconnect', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.execute(
      'DELETE FROM gmail_tokens WHERE user_id = ?',
      [req.user.user_id]
    );
    res.json({ message: 'Gmail disconnected' });
  } catch (error) {
     console.error('Gmail disconnect error:', error);
     res.status(500).json({ message: 'Failed to disconnect Gmail', error: error.message });
  } finally {
     if (connection) connection.release();
  }
});

// --- GMAIL SCANNING ROUTES ---

// ✅ Automated Scan
router.post('/scan', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT gmail_tokens FROM user WHERE user_id = ?',
      [userId]
    );
    if (rows.length === 0 || !rows[0].gmail_tokens) {
      return res.status(404).json({ message: 'Gmail connection not found.' });
    }
    const tokensString = rows[0].gmail_tokens;         // 1. Get the string, name it 'tokensString'
    const tokensObject = JSON.parse(tokensString);
    
    const pythonResponse = await nodeFetch('http://localhost:8000/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentials_dict: tokensObject })
    });
    if (!pythonResponse.ok) throw new Error(await pythonResponse.text());
    
    const extractedData = await pythonResponse.json();
    res.json(extractedData);
  } catch (error) {
    console.error('Gmail scan route error:', error.message);
    res.status(500).json({ message: 'Failed to scan Gmail', error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// ✅ Manual Search
router.post('/search', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const { query } = req.body;
  if (!query) return res.status(400).json({ message: 'A search query is required.' });

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT gmail_tokens FROM user WHERE user_id = ?',
      [userId]
    );
    if (rows.length === 0 || !rows[0].gmail_tokens) {
      return res.status(404).json({ message: 'Gmail connection not found.' });
    }
    const tokensString = rows[0].gmail_tokens;         // 1. Get the string, name it 'tokensString'
    const tokensObject = JSON.parse(tokensString);
    
    const pythonResponse = await nodeFetch('http://localhost:8000/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentials_dict: tokensObject, query: query })
    });
    if (!pythonResponse.ok) throw new Error(await pythonResponse.text());

    const extractedData = await pythonResponse.json();
    res.json(extractedData);
  } catch (error)
 {
    console.error('Gmail search route error:', error.message);
    res.status(500).json({ message: 'Failed to search Gmail', error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;