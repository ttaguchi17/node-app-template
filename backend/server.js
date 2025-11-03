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
    charset: 'utf8mb4' 
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

app.get('/api/trips/:tripId', authenticateToken, async (req, res) => {
    const { tripId } = req.params;
    const userEmail = req.user.email;

    try {
        const connection = await createConnection();

        // This query securely joins the trip, membership, and user tables
        // to ensure the logged-in user is a member of the requested trip.
        const [rows] = await connection.execute(
            `SELECT t.* FROM trip t
              JOIN trip_membership tm ON t.trip_id = tm.trip_id
              JOIN user u ON tm.user_id = u.user_id
              WHERE u.email = ? AND t.trip_id = ?`,
            [userEmail, tripId]
        );

        await connection.end();

        if (rows.length === 0) {
            // If no trip is found, it's either because it doesn't exist
            // or the user doesn't have permission to see it.
            return res.status(404).json({ message: 'Trip not found or access denied.' });
        }

        // Send the single trip object
        res.status(200).json(rows[0]);

    } catch (error) {
        console.error('Error fetching single trip:', error);
        res.status(500).json({ message: 'Error retrieving trip.' });
    }
});

// Route: Update a specific trip (PATCH)
app.patch('/api/trips/:tripId', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const userEmail = req.user.email;
  
  // 1. Get fields from the body. Note we now get 'location_input'.
  const { name, start_date, end_date, location_input } = req.body;

  const updateFields = [];
  const values = [];

  // Add standard fields if they were sent
  if (name !== undefined) {
    updateFields.push('name = ?');
    values.push(name);
  }
  if (start_date !== undefined) {
    updateFields.push('start_date = ?');
    values.push(start_date);
  }
  if (end_date !== undefined) {
    updateFields.push('end_date = ?');
    values.push(end_date);
  }

  // --- NEW GEOCODING LOGIC ---
  if (location_input !== undefined) {
    // 2. Always save the user's raw text (this is our NOT NULL column)
    updateFields.push('location_input = ?');
    values.push(location_input);

    try {
      // 3. Make an API call to Nominatim to find coordinates
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location_input)}&format=json&limit=1&addressdetails=1&accept-language=en`,
        { 
          headers: { 
            // IMPORTANT: You must provide a valid User-Agent.
            // Replace 'your-email@example.com' with your real email.
            'User-Agent': 'TravelApp/1.0 (your-email@example.com)' 
          } 
        }
      );

      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        if (geoData && geoData.length > 0) {
          const topResult = geoData[0];
          
          // 4. Add the API results to our database query
          updateFields.push('location_display_name = ?');
          values.push(topResult.display_name);

          updateFields.push('latitude = ?');
          values.push(parseFloat(topResult.lat));

          updateFields.push('longitude = ?');
          values.push(parseFloat(topResult.lon));
        }
      }
      // If geocoding fails (e.g., "asdfasdf"), we just save the user's
      // text input and let the other fields remain NULL.
    } catch (geoError) {
      console.error('Geocoding failed:', geoError);
      // We don't stop the update; we just log the geocoding error.
    }
  }
  // --- END GEOCODING LOGIC ---

  if (updateFields.length === 0) {
    return res.status(400).json({ message: 'No fields to update.' });
  }

  // Add the tripId and userEmail for the WHERE clause
  values.push(tripId);
  values.push(userEmail);

  const connection = await createConnection();
  try {
    // 5. This SQL query is now built dynamically with all our new fields
    const sql = `
      UPDATE trip t
      JOIN trip_membership tm ON t.trip_id = tm.trip_id
      JOIN user u ON tm.user_id = u.user_id
      SET ${updateFields.join(', ')}
      WHERE t.trip_id = ? AND u.email = ?
    `;

    const [result] = await connection.execute(sql, values);
    
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Trip not found or access denied.' });
    }

    // Send back the fields we intended to update
    res.status(200).json({ message: 'Trip updated successfully!', updatedFields: req.body });

  } catch (error) {
    await connection.end();
    console.error('Error updating trip:', error);
    res.status(500).json({ message: 'Error updating trip.' });
  }
});

app.delete('/api/trips/:tripId', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const userEmail = req.user.email;

  const connection = await createConnection();
  try {
    // First, verify the user is an 'organizer' of this trip to delete it
    const [membership] = await connection.execute(
      `SELECT tm.role FROM trip_membership tm
       JOIN user u ON tm.user_id = u.user_id
       WHERE u.email = ? AND tm.trip_id = ?`,
      [userEmail, tripId]
    );

    // We can change 'organizer' to 'member' if any member should be able to delete
    if (membership.length === 0 || membership[0].role !== 'organizer') {
      return res.status(403).json({ message: 'Access denied. Only the trip organizer can delete this trip.' });
    }

    // Start a transaction to delete all related data
    await connection.beginTransaction();

    // 1. Delete all events associated with the trip
    await connection.execute(
      'DELETE FROM itinerary_event WHERE trip_id = ?',
      [tripId]
    );

    // 2. Delete all memberships associated with the trip
    await connection.execute(
      'DELETE FROM trip_membership WHERE trip_id = ?',
      [tripId]
    );

    // 3. Delete the trip itself
    const [result] = await connection.execute(
      'DELETE FROM trip WHERE trip_id = ?',
      [tripId]
    );

    // 4. Commit all changes
    await connection.commit();
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    res.status(200).json({ message: 'Trip and all associated data deleted successfully.' });

  } catch (error) {
    await connection.rollback(); // Roll back all changes if any step fails
    await connection.end();
    console.error('Error deleting trip:', error);
    res.status(500).json({ message: 'Error deleting trip.' });
  }
});
// === END OF NEW ROUTE ===

// Route: Create a new Trip
app.post('/api/trips', authenticateToken, async (req, res) => {
  const userEmail = req.user.email;
  
  // 1. Get all our new fields from the body
  const { name, start_date, end_date, location_input } = req.body;

  // 2. Enforce our new NOT NULL rule
  if (!name) {
    return res.status(400).json({ message: 'Trip name is required.' });
  }
  if (!location_input) {
     return res.status(400).json({ message: 'Trip location is required.' });
  }
  
  // --- This is the new logic ---
  // We'll hold all our data to be inserted
  let insertData = {
    name: name,
    start_date: start_date || null,
    end_date: end_date || null,
    location_input: location_input, // Save the raw text
  };

  // 3. Try to geocode the location_input if it exists
  if (location_input) {
    try {
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location_input)}&format=json&limit=1&addressdetails=1&accept-language=en`,
        { 
          headers: { 
            // REMEMBER: Change this to your email
            'User-Agent': 'TravelApp/1.0 (your-email@example.com)' 
          } 
        }
      );

      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        if (geoData && geoData.length > 0) {
          const topResult = geoData[0];
          // Add the geocoded data to our insert object
          insertData.location_display_name = topResult.display_name;
          insertData.latitude = parseFloat(topResult.lat);
          insertData.longitude = parseFloat(topResult.lon);
        }
      }
    } catch (geoError) {
      console.error('Geocoding failed during trip creation:', geoError);
      // Don't stop, just proceed without geocoded data
    }
  }
  // --- End of new logic ---

  const connection = await createConnection();
  try {
    await connection.beginTransaction();

    // 4. Dynamically build the INSERT query
    const fields = Object.keys(insertData);
    const placeholders = fields.map(() => '?').join(', ');
    const values = Object.values(insertData);

    const sql = `INSERT INTO trip (${fields.join(', ')}) VALUES (${placeholders})`;
    
    const [tripResult] = await connection.execute(sql, values);
    const newTripId = tripResult.insertId; 
    
    // Get user ID
    const [[user]] = await connection.execute(
        'SELECT user_id FROM user WHERE email = ?',
        [userEmail]
    );
    if (!user) {
        throw new Error('User not found for token email.');
    }
    
    // Add user to the trip
    await connection.execute(
        'INSERT INTO trip_membership (user_id, trip_id, role) VALUES (?, ?, ?)',
        [user.user_id, newTripId, 'organizer']
    );
    
    await connection.commit();

    // 5. Send back the complete new trip object
    res.status(201).json({
      trip_id: newTripId,
      ...insertData 
    });

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
// Route: Add an event to a trip
app.post('/api/trips/:tripId/events', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  
  // 1. Get all fields, including our new location_input
  const { title, type, start_time, end_time, location_input, details } = req.body;

  // Title is required; start_time is optional now (can be null)
  if (!title) {
    return res.status(400).json({ message: 'Event title is required.' });
  }

  // 2. We'll hold all our data to be inserted
  let insertData = {
    trip_id: tripId,
    title: title,
    type: type || 'Other',
    start_time: start_time || null,
    end_time: end_time || null,
    details: details || null,
    location_input: location_input || null, // Save the raw text
  };

  // 3. Try to geocode the location_input if it exists
  if (location_input) {
    try {
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location_input)}&format=json&limit=1&addressdetails=1&accept-language=en`,
        { headers: { 'User-Agent': 'TravelApp/1.0 (your-email@example.com)' } } // Remember to change this email
      );

      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        if (geoData && geoData.length > 0 && geoData[0].address) {
          const topResult = geoData[0];
          const addr = topResult.address;
          
          // Build our "City, Country" name
          const city = addr.city || addr.town || addr.village;
          const country = addr.country;
          if (city && country) {
            insertData.location_display_name = `${city}, ${country}`;
          } else {
            insertData.location_display_name = city || country || location_input;
          }

          // Add coordinates
          insertData.latitude = parseFloat(topResult.lat);
          insertData.longitude = parseFloat(topResult.lon);
        }
      }
    } catch (geoError) {
      console.error('Geocoding failed during event creation:', geoError);
    }
  }
  // --- End of new logic ---

  const connection = await createConnection();
  try {
    // 4. Dynamically build the INSERT query
    const fields = Object.keys(insertData);
    const placeholders = fields.map(() => '?').join(', ');
    const values = Object.values(insertData);

    const sql = `INSERT INTO itinerary_event (${fields.join(', ')}) VALUES (${placeholders})`;
    
    const [result] = await connection.execute(sql, values);

    await connection.end();
    
    // 5. Send back the complete new event object
    res.status(201).json({
      event_id: result.insertId,
      ...insertData
    });

  } catch (error) {
    await connection.end();
    console.error('Error adding event:', error);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(404).json({ message: `Trip with ID ${tripId} not found.` });
    }
    res.status(500).json({ message: 'Error adding event.' });
  }
});

// Route: Update an event (PATCH)
app.patch('/api/trips/:tripId/events/:eventId', authenticateToken, async (req, res) => {
  const { tripId, eventId } = req.params;
  const userEmail = req.user.email;
  
  // 1. Get all possible fields from the body, including location_input
  const { title, type, start_time, end_time, location_input, details } = req.body;

  const updateFields = [];
  const values = [];

  // Dynamically build the SET part of the query
  if (title !== undefined) {
    updateFields.push('title = ?');
    values.push(title);
  }
  if (type !== undefined) {
    updateFields.push('type = ?');
    values.push(type);
  }
  if (start_time !== undefined) {
    updateFields.push('start_time = ?');
    values.push(start_time);
  }
  if (end_time !== undefined) {
    updateFields.push('end_time = ?');
    values.push(end_time);
  }
  if (details !== undefined) {
    updateFields.push('details = ?');
    values.push(details);
  }

  // --- NEW GEOCODING LOGIC ---
  if (location_input !== undefined) {
    // 2. Always save the user's raw text
    updateFields.push('location_input = ?');
    values.push(location_input);

    try {
      // 3. Make an API call to Nominatim to find coordinates
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location_input)}&format=json&limit=1&addressdetails=1&accept-language=en`,
        { headers: { 'User-Agent': 'TravelApp/1.0 (your-email@example.com)' } } // Remember to change this email
      );

      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        if (geoData && geoData.length > 0 && geoData[0].address) {
          const topResult = geoData[0];
          const addr = topResult.address;
          
          // Build our "City, Country" name
          const city = addr.city || addr.town || addr.village;
          const country = addr.country;
          let cleanName = location_input; // Default to user's input
          if (city && country) {
            cleanName = `${city}, ${country}`;
          } else {
            cleanName = city || country || location_input;
          }

          // 4. Add the API results to our database query
          updateFields.push('location_display_name = ?');
          values.push(cleanName);
          updateFields.push('latitude = ?');
          values.push(parseFloat(topResult.lat));
          updateFields.push('longitude = ?');
          values.push(parseFloat(topResult.lon));
        }
      }
    } catch (geoError) {
      console.error('Geocoding failed during event update:', geoError);
    }
  }
  // --- END GEOCODING LOGIC ---

  if (updateFields.length === 0) {
    return res.status(400).json({ message: 'No fields to update.' });
  }

  // Add eventId and tripId to the values array for the WHERE clause
  values.push(eventId);
  values.push(tripId);

  const connection = await createConnection();
  try {
    // First, verify the user is a member of this trip
    const [membership] = await connection.execute(
      `SELECT tm.role FROM trip_membership tm
       JOIN user u ON tm.user_id = u.user_id
       WHERE u.email = ? AND tm.trip_id = ?`,
      [userEmail, tripId]
    );

    if (membership.length === 0) {
      await connection.end();
      return res.status(403).json({ message: 'Access denied. You are not a member of this trip.' });
    }

    // User is a member, proceed with update
    const sql = `
      UPDATE itinerary_event
      SET ${updateFields.join(', ')}
      WHERE event_id = ? AND trip_id = ?
    `;

    const [result] = await connection.execute(sql, values);
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Event not found or access denied.' });
    }

    res.status(200).json({ message: 'Event updated successfully!', updatedFields: req.body });

  } catch (error) {
    await connection.end();
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Error updating event.' });
  }
});

// Route: Delete an event
app.delete('/api/trips/:tripId/events/:eventId', authenticateToken, async (req, res) => {
  const { tripId, eventId } = req.params;
  const userEmail = req.user.email;

  const connection = await createConnection();
  try {
    // First, verify the user is a member of this trip
    const [membership] = await connection.execute(
      `SELECT tm.role FROM trip_membership tm
       JOIN user u ON tm.user_id = u.user_id
       WHERE u.email = ? AND tm.trip_id = ?`,
      [userEmail, tripId]
    );

    if (membership.length === 0) {
      // If no membership, they can't delete
      await connection.end();
      return res.status(403).json({ message: 'Access denied. You are not a member of this trip.' });
    }

    // User is a member, proceed with deletion
    const [result] = await connection.execute(
      'DELETE FROM itinerary_event WHERE event_id = ? AND trip_id = ?',
      [eventId, tripId]
    );
    
    await connection.end();

    if (result.affectedRows === 0) {
      // This means no event was found with that ID
      return res.status(404).json({ message: 'Event not found.' });
    }

    res.status(200).json({ message: 'Event deleted successfully.' });

  } catch (error) {
    await connection.end();
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Error deleting event.' });
  }
});
//////////////////////////////////////
// END API ROUTES
//////////////////////////////////////

// Start the server
app.listen(port, () => {
  console.log(`✅ Backend API server running at http://localhost:${port}`);
})