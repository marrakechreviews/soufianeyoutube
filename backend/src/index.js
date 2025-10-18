require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const connectDB = require('./config/db');
const passport = require('passport');

// Passport config
require('./config/passport');

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001", // The frontend server URL
    methods: ["GET", "POST"]
  }
});

// Start video processing worker after io is initialized
require('./workers/videoWorker')(io);

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
app.use('/api/videos', require('./routes/videos'));

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
