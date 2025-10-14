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
        const token = req.query.state ? Buffer.from(req.query.state, 'base64').toString() : null;
        let userId;

        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.user.id;
          } catch (err) {
            if (err.name !== 'TokenExpiredError') {
              throw err; // Re-throw other JWT errors
            }
            // If token is expired, we proceed as if there was no token.
          }
        }

        const existingGoogleAccount = await GoogleAccount.findOne({ googleId: profile.id });

        if (existingGoogleAccount) {
          existingGoogleAccount.accessToken = accessToken;
          existingGoogleAccount.refreshToken = refreshToken;
          await existingGoogleAccount.save();
          const user = await User.findById(existingGoogleAccount.user);
          return done(null, user);
        }

        let user;
        if (userId) {
          user = await User.findById(userId);
        } else {
          user = await User.findOne({ email: profile.emails[0].value });
          if (!user) {
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
