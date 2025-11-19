// backend/routes/gmail.js
const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// --- ADD THIS TEST LOG AT THE TOP ---
console.log("\n" + "="*50);
console.log("   SUCCESSFULLY LOADED NEW gmail.js (v7)   ");
console.log("="*50 + "\n");
// ------------------------------------


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
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const gmailAddress = profile.data.emailAddress;
    const expiryDate = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);
    const expiryString = expiryDate.toISOString().slice(0, 19).replace('T', ' ');

    connection = await pool.getConnection();
    await connection.execute(
  `UPDATE user
   SET gmail_tokens = ?
   WHERE user_id = ?`,
  [
    JSON.stringify({
      email: gmailAddress,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      token_expiry: expiryString,
      scope: tokens.scope
    }),
    user.user_id
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
  'SELECT gmail_tokens FROM user WHERE user_id = ?',
  [req.user.user_id]
);
if (rows.length === 0 || !rows[0].gmail_tokens) {
  return res.json({ connected: false, email: null, needs_reauth: false });
}

const tokens = JSON.parse(rows[0].gmail_tokens);
const needsReauth = new Date(tokens.token_expiry) < new Date();

res.json({
  connected: true,
  email: tokens.email,
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
  'UPDATE user SET gmail_tokens = NULL WHERE user_id = ?',
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

  // --- LOGGING ---
  console.log(`\n[${new Date().toISOString()}] --- GMAIL /scan START (User: ${userId}) ---`);

  try {
    // 1. --- (Your existing code to get credentials and call Python) ---
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT gmail_tokens FROM user WHERE user_id = ?',
      [userId]
    );
    if (rows.length === 0 || !rows[0].gmail_tokens) {
      return res.status(404).json({ message: 'Gmail connection not found.' });
    }
    const tokensString = rows[0].gmail_tokens;
    const tokensObject = JSON.parse(tokensString); 
    const credentials_for_python = {
      ...tokensObject,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      token_uri: "https://oauth2.googleapis.com/token"
    };
    
    const pythonResponse = await nodeFetch('http://localhost:8000/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentials_dict: credentials_for_python })
    });

    if (!pythonResponse.ok) throw new Error(await pythonResponse.text());
    
    const allBookingsFromPython = await pythonResponse.json();
    // --- (End of your existing code) ---


    // --- LOGGING (Step 1: What did Python send us?) ---
    console.log(`[LOG] Step 1: Found ${allBookingsFromPython.length} total bookings in Gmail.`);
    // Log just the IDs to see if they're present
    console.log(`[LOG] Python Booking IDs: ${JSON.stringify(allBookingsFromPython.map(b => b.id))}`);
    // ---


    // 2. --- (Get existing IDs from our DB) ---
    const [existingRows] = await connection.execute(
      `SELECT JSON_UNQUOTE(JSON_EXTRACT(ie.details, '$.id')) AS emailId
       FROM itinerary_event ie
       JOIN trip_membership tm ON ie.trip_id = tm.trip_id
       WHERE tm.user_id = ? AND JSON_EXTRACT(ie.details, '$.id') IS NOT NULL`,
      [userId]
    );

    // 3. Create a "Set" of imported IDs for a super-fast lookup
    const importedIds = new Set(existingRows.map(row => row.emailId));

    // --- LOGGING (Step 2: What's already in our DB?) ---
    console.log(`[LOG] Step 2: Found ${importedIds.size} already-imported event IDs in DB.`);
    console.log(`[LOG] DB Imported IDs: ${JSON.stringify(Array.from(importedIds))}`);
    // ---

    // 4. Filter the list from Python
    const newBookings = allBookingsFromPython.filter(
      booking => {
        // We MUST check if booking.id exists, or this will crash
        if (!booking.id) {
          console.warn('[LOG] Filtering out a booking that has no ID from Python.');
          return false; // Filter it out
        }
        const isDuplicate = importedIds.has(booking.id);
        if (isDuplicate) {
          // --- LOGGING (Step 3: What are we filtering out?) ---
          console.log(`[LOG] Filtering out duplicate: ${booking.id}`);
          // ---
        }
        return !isDuplicate;
      }
    );

    // --- LOGGING (Step 4: What's the final result?) ---
    console.log(`[LOG] Step 4: Sending ${newBookings.length} new bookings to frontend.`);
    console.log(`[${new Date().toISOString()}] --- GMAIL /scan END ---`);
    // ---

    // 5. Send the *filtered* list to the frontend
    res.json(newBookings);

    } catch (error) {
    console.error('Gmail scan route error:', error);

    // Handle expired or revoked tokens explicitly
    if (String(error).includes('invalid_grant')) {
      try {
        if (connection) {
          await connection.execute('DELETE FROM gmail_tokens WHERE user_id = ?', [userId]);
        }
      } catch (cleanupErr) {
        console.error('Error cleaning up expired Gmail token:', cleanupErr);
      }

      return res.status(401).json({
        message: 'Your Gmail connection has expired or been revoked. Please reconnect your account.',
      });
    }

    // Generic fallback for any other failure
    res.status(500).json({
      message: 'Failed to scan Gmail',
      error: error.message || String(error),
    });
  } finally {
    if (connection) connection.release();
  }
});

// ✅ Manual Search
// ✅ Manual Search
router.post('/search', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const { query } = req.body;
  if (!query) return res.status(400).json({ message: 'A search query is required.' });

  let connection;
  
  // --- LOGGING ---
  console.log(`\n[${new Date().toISOString()}] --- GMAIL /search START (User: ${userId}) ---`);

  try {
    // 1. --- (Your existing code to call Python) ---
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT gmail_tokens FROM user WHERE user_id = ?',
      [userId]
    );
    if (rows.length === 0 || !rows[0].gmail_tokens) {
      return res.status(404).json({ message: 'Gmail connection not found.' });
    }
    const tokensString = rows[0].gmail_tokens;
    const tokensObject = JSON.parse(tokensString); 
    const credentials_for_python = {
      ...tokensObject,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      token_uri: "https://oauth2.googleapis.com/token"
    };
    
    const pythonResponse = await nodeFetch('http://localhost:8000/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentials_dict: credentials_for_python, query: query })
    });

    if (!pythonResponse.ok) throw new Error(await pythonResponse.text());

    const allBookingsFromPython = await pythonResponse.json();
    // --- (End of your existing code) ---
    
    // --- LOGGING ---
    console.log(`[LOG] Step 1: Found ${allBookingsFromPython.length} total bookings in Gmail.`);
    console.log(`[LOG] Python Booking IDs: ${JSON.stringify(allBookingsFromPython.map(b => b.id))}`);
    // ---

    // 2. --- (Get existing IDs from our DB) ---
    const [existingRows] = await connection.execute(
      `SELECT JSON_UNQUOTE(JSON_EXTRACT(ie.details, '$.id')) AS emailId
       FROM itinerary_event ie
       JOIN trip_membership tm ON ie.trip_id = tm.trip_id
       WHERE tm.user_id = ? AND JSON_EXTRACT(ie.details, '$.id') IS NOT NULL`,
      [userId]
    );

    // 3. Create a "Set" of imported IDs
    const importedIds = new Set(existingRows.map(row => row.emailId));

    // --- LOGGING ---
    console.log(`[LOG] Step 2: Found ${importedIds.size} already-imported event IDs in DB.`);
    console.log(`[LOG] DB Imported IDs: ${JSON.stringify(Array.from(importedIds))}`);
    // ---

    // 4. Filter the list from Python
    const newBookings = allBookingsFromPython.filter(
      booking => {
        if (!booking.id) {
          console.warn('[LOG] Filtering out a booking that has no ID from Python.');
          return false;
        }
        const isDuplicate = importedIds.has(booking.id);
        if (isDuplicate) {
          console.log(`[LOG] Filtering out duplicate: ${booking.id}`);
        }
        return !isDuplicate;
      }
    );

    // --- LOGGING ---
    console.log(`[LOG] Step 4: Sending ${newBookings.length} new bookings to frontend.`);
    console.log(`[${new Date().toISOString()}] --- GMAIL /search END ---`);
    // ---

    // 5. Send the *filtered* list to the frontend
    res.json(newBookings);

  } catch (error) {
    // <-- REPLACED / IMPROVED ERROR HANDLING STARTS HERE -->
    console.error('Gmail search route error:', error);

    // If the error string indicates an OAuth invalid_grant, clean up tokens and inform the client
    if (String(error).includes('invalid_grant')) {
      try {
        // attempt to remove tokens from both possible storage places
        if (connection) {
          // If you store tokens in a dedicated table
          try {
            await connection.execute('DELETE FROM gmail_tokens WHERE user_id = ?', [userId]);
          } catch (e) {
            // ignore individual failure; attempt the other cleanup
            console.warn('Could not DELETE from gmail_tokens table:', e.message || e);
          }

          // If you also store tokens as a column on user table (some code paths use this)
          try {
            await connection.execute('UPDATE `user` SET gmail_tokens = NULL WHERE user_id = ?', [userId]);
          } catch (e) {
            console.warn('Could not clear user.gmail_tokens column:', e.message || e);
          }
        }
      } catch (cleanupErr) {
        console.error('Error cleaning up expired Gmail token:', cleanupErr);
      }

      // Return 401 so frontend can show "please reconnect" UX
      return res.status(401).json({
        message: 'Your Gmail connection has expired or been revoked. Please reconnect your account.',
      });
    }

    // Generic fallback for any other failure
    res.status(500).json({ message: 'Failed to search Gmail', error: error.message || String(error) });
    // <-- REPLACED / IMPROVED ERROR HANDLING ENDS HERE -->
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;