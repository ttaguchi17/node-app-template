// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const rateLimit = require('express-rate-limit');
const validator = require('validator');

// --- Rate limiter to prevent brute-force attacks ---
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { message: 'Too many login attempts. Please try again later.' },
});

// --- Create Account ---
router.post('/create-account', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  if (!validator.isEmail(email))
    return res.status(400).json({ message: 'Invalid email format.' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO `user` (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );

    res.status(201).json({ 
      message: 'Account created successfully!',
      user_id: result.insertId 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'An account with this email already exists.' });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Error creating account.' });
    }
  }
});

// --- Login (with rate limiter) ---
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  if (!validator.isEmail(email))
    return res.status(400).json({ message: 'Invalid email format.' });

  try {
    const [rows] = await pool.execute(
      'SELECT user_id, email, password FROM `user` WHERE email = ?',
      [email]
    );

    if (rows.length === 0)
      return res.status(401).json({ message: 'Invalid email or password.' });

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: 'Invalid email or password.' });

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ message: 'Server configuration error.' });
    }

    const token = jwt.sign(
      { email: user.email, user_id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: '4h' } // Extended for convenience
    );

    // Update last_login
    await pool.execute('UPDATE `user` SET last_login = NOW() WHERE user_id = ?', [user.user_id]);

    res.status(200).json({
      token,
      user: { user_id: user.user_id, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging in.' });
  }
});

module.exports = router;
