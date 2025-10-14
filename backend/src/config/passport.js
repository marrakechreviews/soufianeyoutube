const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const GoogleAccount = require('../models/GoogleAccount');
const jwt = require('jsonwebtoken');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const state = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
        let userId;

        // Scenario 1: Existing user is connecting a new Google account
        if (state.token) {
          const decoded = jwt.verify(state.token, process.env.JWT_SECRET);
          userId = decoded.user.id;
        }

        const existingGoogleAccount = await GoogleAccount.findOne({ googleId: profile.id });

        if (existingGoogleAccount) {
          // If this Google account is already linked to someone, update tokens.
          existingGoogleAccount.accessToken = accessToken;
          existingGoogleAccount.refreshToken = refreshToken;
          await existingGoogleAccount.save();
          // We need a user object for the JWT, so let's find the parent user.
          const user = await User.findById(existingGoogleAccount.user);
          return done(null, user);
        }

        // If it's a new Google account, we need to handle both scenarios
        let user;
        if (userId) {
          // User is logged in, link this new Google Account to them.
          user = await User.findById(userId);
        } else {
          // Scenario 2: A brand new user is signing up with Google.
          // Check if a user with this email already exists (e.g., signed up with password).
          user = await User.findOne({ email: profile.emails[0].value });
          if (!user) {
            // If not, create a new application user.
            user = new User({
              name: profile.displayName,
              email: profile.emails[0].value,
            });
            await user.save();
          }
        }

        const newGoogleAccount = new GoogleAccount({
          user: user._id,
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          accessToken,
          refreshToken,
        });

        await newGoogleAccount.save();
        // Pass the main user object to the callback for JWT creation.
        done(null, user);
      } catch (err) {
        console.error('Passport strategy error:', err);
        done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => done(err, user));
});
