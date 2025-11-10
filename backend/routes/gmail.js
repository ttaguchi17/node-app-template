const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

async function createConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4' 
  });
}

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
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

// OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Scopes for Gmail access
const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
];

// Check Gmail connection status
router.get('/auth/gmail/status', authenticateToken, async (req, res) => {
    try {
        const tokens = await req.user.gmail_tokens;
        if (!tokens) {
            return res.json({ connected: false, email: null, needs_reauth: false });
        }

        oauth2Client.setCredentials(tokens);
        
        try {
            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
            const profile = await gmail.users.getProfile({ userId: 'me' });
            
            return res.json({
                connected: true,
                email: profile.data.emailAddress,
                needs_reauth: false
            });
        } catch (error) {
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
router.get('/auth/gmail/connect', authenticateToken, (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'
    });
    res.json({ url: authUrl });
});

// Handle Gmail OAuth callback
router.get('/auth/gmail/callback', async (req, res) => { // <-- GOOD: No middleware
    try {
        const { code, state } = req.query; // <-- GOOD: Get code AND state
        const token = state; // The 'state' is our JWT

        if (!token) {
            throw new Error('No state token provided');
        }

        // 1. Verify the JWT from the state parameter
        const user = jwt.verify(token, process.env.JWT_SECRET);
        if (!user || !user.email) { // <-- Make sure your JWT contains the user ID
            throw new Error('Invalid state token');
        }

        // 2. Get the Google tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        // 3. Store tokens against the user ID from the token
        await updateUserGmailTokens(user.email, tokens);
        
        // 4. Send a postMessage to the main window and close the popup
        res.send(`
            <script>
                window.opener.postMessage({ type: 'GMAIL_CONNECTED' }, '*');
                window.close();
            </script>
        `);
    } catch (error) {
        console.error('Gmail callback error:', error);
        // Send an error message back to the main window
        res.send(`
            <script>
                window.opener.postMessage({ type: 'GMAIL_ERROR' }, '*');
                window.close();
            </script>
        `);
    }
});

// Disconnect Gmail
router.post('/auth/gmail/disconnect', authenticateToken, async (req, res) => {
    try {
        // Clear tokens from user record
        await updateUserGmailTokens(req.user.email, null);
        res.json({ success: true });
    } catch (error) {
        console.error('Gmail disconnect error:', error);
        res.status(500).json({ error: 'Failed to disconnect Gmail' });
    }
});

async function updateUserGmailTokens(email, tokens) {
    // This finds the user by email and stores the tokens
    let connection;
    try {
        connection = await createConnection();
        // Make sure your user table has a 'gmail_tokens' column (e.g., JSON or TEXT type)
        await connection.execute(
          'UPDATE user SET gmail_tokens = ? WHERE email = ?',
          [tokens ? JSON.stringify(tokens) : null, email]
        );
    } catch (error) {
        console.error('Failed to update user tokens in DB:', error);
        throw new Error('Database error while saving tokens.');
    } finally {
        if (connection) await connection.end();
    }
}

module.exports = router;
