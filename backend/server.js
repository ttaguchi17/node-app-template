require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors'); // 1. IMPORT CORS

const app = express();
const port = process.env.PORT || 3000;

// --- MIDDLEWARE ---
app.use(cors()); // 2. USE CORS
app.use(express.json()); // Middleware to parse JSON bodies
// Note: We no longer serve static files from 'public'
// --- END MIDDLEWARE ---

/////////////////////////////////////////////////
// HELPER FUNCTIONS AND AUTHENTICATION MIDDLEWARE
/////////////////////////////////////////////////

async function createConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1] : authHeader;

  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid token.' });

    try {
      const connection = await createConnection();
      const [rows] = await connection.execute(
        'SELECT email FROM `user` WHERE email = ?',
        [decoded.email]
      );
      await connection.end();

      if (rows.length === 0)
        return res.status(403).json({ message: 'Account not found or deactivated.' });

      req.user = decoded;
      next();
    } catch (dbError) {
      console.error(dbError);
      res.status(500).json({ message: 'Database error during authentication.' });
    }
  });
}
/////////////////////////////////////////////////
// END HELPER FUNCTIONS
/////////////////////////////////////////////////

//////////////////////////////////////
// API ROUTES
//////////////////////////////////////

// Route: Create Account
app.post('/api/create-account', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  try {
    const connection = await createConnection();
    const hashedPassword = await bcrypt.hash(password, 10);
    await connection.execute(
      'INSERT INTO `user` (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );
    await connection.end();
    res.status(201).json({ message: 'Account created successfully!' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'An account with this email already exists.' });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Error creating account.' });
    }
  }
});

// Route: Logon
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  try {
    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT * FROM `user` WHERE email = ?', [email]);
    await connection.end();

    if (rows.length === 0)
      return res.status(401).json({ message: 'Invalid email or password.' });

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid email or password.' });

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging in.' });
  }
});

// Route: Get Trips for Logged-in User
// --- THIS IS THE ONLY 'GET /api/trips' ROUTE ---
app.get('/api/trips', authenticateToken, async (req, res) => {
    try{
        const userEmail = req.user.email;
        const connection = await createConnection();

        const [trips] = await connection.execute(
            `SELECT t.* FROM trip t
              JOIN trip_membership tm ON t.trip_id = tm.trip_id
              JOIN user u ON tm.user_id = u.user_id
              WHERE u.email = ?`,
              [userEmail]
        );

        await connection.end(); 
        res.status(200).json(trips);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving trips.' });
    }
});

// Route: Create a new Trip
app.post('/api/trips', authenticateToken, async (req, res) => {
  const { name, start_date, end_date } = req.body;
  const userEmail = req.user.email;

  if (!name) {
    return res.status(400).json({ message: 'Trip name is required.' });
  }

  const connection = await createConnection();
  try {
    await connection.beginTransaction();
    const [tripResult] = await connection.execute(
        'INSERT INTO trip (name, start_date, end_date) VALUES (?, ?, ?)',
        [name, start_date, end_date] 
    );
    const newTripId = tripResult.insertId; 
    const [[user]] = await connection.execute(
        'SELECT user_id FROM user WHERE email = ?',
        [userEmail]
    );
    if (!user) {
        throw new Error('User not found for token email.');
    }
    await connection.execute(
        'INSERT INTO trip_membership (user_id, trip_id, role) VALUES (?, ?, ?)',
        [user.user_id, newTripId, 'organizer']
    );
    await connection.commit();

    // --- THIS IS THE CORRECTED LINE ---
    res.status(201).json({ trip_id: newTripId, name, start_date, end_date });
    // --- END OF FIX ---

    } catch (error) {
        await connection.rollback();
        console.error('Error creating trip:', error);
        res.status(500).json({ message: 'Error creating trip.' });
    } finally {
        await connection.end();
    }
  });
// Route: Get all events for a trip
app.get('/api/trips/:tripId/events', authenticateToken, async (req, res) => {
  const { tripId } = req.params;

  try {
    const connection = await createConnection();
    const [events] = await connection.execute(
      'SELECT * FROM itinerary_event WHERE trip_id = ? ORDER BY start_time ASC',
      [tripId]
    );
    await connection.end();
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events.' });
  }
});

// Route: Add an event to a trip (Corrected Version)
app.post('/api/trips/:tripId/events', authenticateToken, async (req,res) => {
    const { tripId } = req.params;
    // Get all possible fields from the body
    const { title, type, start_time, end_time, location, details } = req.body;

    if (!title || !start_time) {
        return res.status(400).json({message: 'Event title and start time are required.'});
    }

    const connection = await createConnection();
    try {
        // --- THIS IS THE FIX ---
        
        // We use the standard VALUES syntax,
        // using '|| null' to safely handle any fields that 
        // were not provided (e.g., end_time, location).
        
        const [result] = await connection.execute(
            'INSERT INTO itinerary_event (trip_id, title, type, start_time, end_time, location, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              tripId,
              title,
              type || 'Other',    // Default to 'Other' if not provided
              start_time,
              end_time || null,   // Send null if empty or undefined
              location || null, // Send null if empty or undefined
              details || null   // Send null if empty or undefined
            ]
        );
        
        // --- END OF FIX ---
        
        // Send back the data we just inserted
        res.status(201).json({
          event_id: result.insertId,
          trip_id: parseInt(tripId),
          title,
          type: type || 'Other',
          start_time,
          end_time: end_time || null,
          location: location || null,
          details: details || null
        });

    } catch (error) {
        console.error('Error adding event:', error);
        // This will catch if the tripId itself doesn't exist
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(404).json({ message: `Trip with ID ${tripId} not found.` });
        }
        res.status(500).json({ message: 'Error adding event.' });
    } finally {
        await connection.end();
    }
});
//////////////////////////////////////
// END API ROUTES
//////////////////////////////////////

// Start the server
app.listen(port, () => {
  console.log(`✅ Backend API server running at http://localhost:${port}`);
})