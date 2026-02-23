const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');
require('./config/passport');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection with Stability Pooling
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 50,
  serverSelectionTimeoutMS: 5000,
})
  .then(() => console.log('MongoDB Connected to SahayaJeevan via Atlas (Pool: 50)'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Routes
app.use('/auth', require('./routes/auth'));
app.use('/mother', require('./routes/mother'));
app.use('/chat', require('./routes/chat'));
app.use('/sync', require('./routes/sync'));

// Root Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'MATRI Backend is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
