const express = require('express');
const router = express.Router();
const passport = require('passport');
const { register, login, googleCallback } = require('../controllers/auth');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', login);

// @route   GET api/auth/google
// @desc    Authenticate with Google
// @access  Public
router.get('/google', (req, res, next) => {
  const token = req.query.token || req.header('x-auth-token');
  let state = {};

  if (token) {
    state.token = token;
  }

  const stateString = Buffer.from(JSON.stringify(state)).toString('base64');

  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube',
    ],
    state: stateString,
    accessType: 'offline',
    prompt: 'consent',
  })(req, res, next);
});

// @route   GET api/auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  googleCallback
);

module.exports = router;
