// backend/routes/gmail.js
const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const axios = require('axios');

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    // Allow OPTIONS requests to pass for CORS preflight
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

async function updateUserGmailTokens(email, tokens) {
    // This finds the user by email and stores the tokens
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.execute(
          'UPDATE user SET gmail_tokens = ? WHERE email = ?',
          [tokens ? JSON.stringify(tokens) : null, email]
        );
    } catch (error) {
        console.error('Failed to update user tokens in DB:', error);
        throw new Error('Database error while saving tokens.');
    } finally {
        if (connection) connection.release();
    }
}

// --- OAuth Setup ---

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
];

// --- Gmail Routes ---

// Check Gmail connection status
router.get('/status', authenticateToken, async (req, res) => {
    try {
        // 1. Get user email from the token
        const userEmail = req.user.email;
        if (!userEmail) {
            return res.status(403).json({ error: 'Invalid token, email not found.' });
        }

        // 2. Query the database for the user's row
        const connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT gmail_tokens FROM user WHERE email = ?',
            [userEmail]
        );
        connection.release();

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User account not found.' });
        }

        const tokensString = rows[0].gmail_tokens; // Get tokens from the DB result

        // 3. Check if tokens exist
        if (!tokensString) {
            return res.json({ connected: false, email: null, needs_reauth: false });
        }

        const tokens = JSON.parse(tokensString);
        oauth2Client.setCredentials(tokens);
        
        try {
            // 4. Verify the tokens are still valid by pinging Google
            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
            const profile = await gmail.users.getProfile({ userId: 'me' });
            
            // 5. Success!
            return res.json({
                connected: true,
                email: profile.data.emailAddress,
                needs_reauth: false
            });
        } catch (error) {
            // 6. Token is invalid or expired
            if (error.code === 401) {
                return res.json({ connected: false, email: null, needs_reauth: true });
            }
            throw error;
        }
    } catch (error) {
        console.error('Gmail status check error:', error);
        res.status(500).json({ error: 'Failed to check Gmail connection status' });
    }
});

// Generate Gmail OAuth URL
router.get('/connect', authenticateToken, (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'
    });
    res.json({ url: authUrl });
});

// Handle Gmail OAuth callback
router.get('/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        const token = state; 

        if (!token) {
            throw new Error('No state token provided');
        }

        const user = jwt.verify(token, process.env.JWT_SECRET);
        if (!user || !user.email) {
            throw new Error('Invalid state token');
        }

        const { tokens } = await oauth2Client.getToken(code);
        
        await updateUserGmailTokens(user.email, tokens);
        
        res.send(`
            <script>
                window.opener.postMessage({ type: 'GMAIL_CONNECTED' }, '*');
                window.close();
            </script>
        `);
    } catch (error) {
        console.error('Gmail OAuth callback error:', error);
        res.send(`
            <script>
                window.opener.postMessage({ type: 'GMAIL_ERROR' }, '*');
                window.close();
            </script>
        `);
    }
});

// Scan Gmail for bookings
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
    
    const pythonResponse = await axios.post('http://localhost:8000/scan', {
      credentials_dict: credentials_for_python
    });
    
    const allBookingsFromPython = pythonResponse.data;
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
    console.error('Gmail scan route error:', error.message);
    res.status(500).json({ message: 'Failed to scan Gmail', error: error.message });
  } finally {
    if (connection) connection.release();
  }
});router.post('/search', authenticateToken, async (req, res) => {
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
    
    const pythonResponse = await axios.post('http://localhost:8000/search', {
      credentials_dict: credentials_for_python,
      query: query
    });

    const allBookingsFromPython = pythonResponse.data;
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
    console.error('Gmail search route error:', error.message);
    res.status(500).json({ message: 'Failed to search Gmail', error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// Disconnect Gmail
router.delete('/disconnect', authenticateToken, async (req, res) => {
  let connection;
  try {
    const userEmail = req.user.email;
    connection = await pool.getConnection();
    await connection.execute(
      'UPDATE user SET gmail_tokens = NULL WHERE email = ?',
      [userEmail]
    );
    res.json({ message: 'Gmail disconnected successfully' });
  } catch (error) {
    console.error('Gmail disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Gmail' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;