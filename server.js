require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

//////////////////////////////////////
// ROUTES TO SERVE HTML FILES
//////////////////////////////////////
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'logon.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});
//////////////////////////////////////
// END ROUTES TO SERVE HTML FILES
//////////////////////////////////////

/////////////////////////////////////////////////
// HELPER FUNCTIONS AND AUTHENTICATION MIDDLEWARE
/////////////////////////////////////////////////

// Helper function to create a MySQL connection
async function createConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

// Authorization Middleware: Verify JWT Token and Check User in Database
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  // support "Bearer <token>" or raw "<token>"
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
// END HELPER FUNCTIONS AND AUTHENTICATION MIDDLEWARE
/////////////////////////////////////////////////

//////////////////////////////////////
// ROUTES TO HANDLE API REQUESTS
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

// Route: Get All Email Addresses
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT email FROM `user`');
    await connection.end();

    const emailList = rows.map(row => row.email);
    res.status(200).json({ emails: emailList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving email addresses.' });
  }
});

// Route: Get Trips for Logged-in User
app.get('/api/trips', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const connection = await createConnection();

    // Look up user_id by email (assumes your `user` table has a user_id PK)
    const [[user]] = await connection.execute(
      'SELECT user_id FROM `user` WHERE email = ?',
      [userEmail]
    );
    if (!user) {
      await connection.end();
      return res.status(403).json({ message: 'User not found.' });
    }

    const [trips] = await connection.execute(
      `SELECT t.* FROM trip t
       JOIN trip_membership tm ON t.trip_id = tm.trip_id
       WHERE tm.user_id = ?`,
      [user.user_id]
    );

    await connection.end();
    res.status(200).json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving trips.' });
  }
});

app.get('/api/trips', authenticateToken,async (req, res) => {
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

//////////////////////////////////////
// END ROUTES TO HANDLE API REQUESTS
//////////////////////////////////////

// Start the server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}/dashboard`);
});
