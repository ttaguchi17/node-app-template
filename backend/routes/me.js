// backend/routes/me.js
const express = require('express');
const router = express.Router();

// If you have an auth middleware that sets req.user, try to use it.
// If you want to require auth, uncomment the next line and ensure path is correct:
// const auth = require('../middleware/auth');

// Simple in-memory stub (replace with DB in real app)
let stubUser = {
  name: 'Guest Traveler',
  email: 'guest@voyago.app',
  location: '',
  memberSince: '',
  bio: '',
  photo: null
};

// Use auth middleware if you want to protect these endpoints:
// router.use(auth);

router.get('/', (req, res) => {
  // If using auth middleware, prefer req.user; otherwise use stub or persisted user
  const user = req.user || stubUser;
  res.json(user);
});

router.put('/', express.json(), (req, res) => {
  // In a real app you'd validate and persist to DB here, using req.user.id etc.
  // For now we merge fields into stubUser and return it
  const body = req.body || {};
  // protect certain fields if required, e.g., don't allow role changes here
  const allowed = ['name', 'email', 'location', 'memberSince', 'bio', 'photo'];
  allowed.forEach((k) => {
    if (body[k] !== undefined) stubUser[k] = body[k];
  });

  // If you have req.user and a DB update, do it here and return saved record
  return res.json(stubUser);
});

module.exports = router;
