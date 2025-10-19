require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const passport = require('passport');

// Passport config
require('./config/passport');

// Connect Database
connectDB();

const app = express();
const port = process.env.PORT || 3000;

// Init Middleware
app.use(cors());
app.use(express.json({ extended: false }));

// Passport middleware
app.use(passport.initialize());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/youtube', require('./routes/youtube'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/upload', require('./routes/upload'));

app.listen(port, '127.0.0.1', () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
