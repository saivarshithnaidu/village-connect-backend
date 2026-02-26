const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

/* ===============================
   REQUIRED ENV VARIABLES CHECK
================================= */
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing in environment variables");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is missing in environment variables");
  process.exit(1);
}

/* ===============================
   CORS CONFIGURATION
================================= */
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://village-connect-problem-solution.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.includes(origin)) {
      return callback(new Error('Not allowed by CORS'));
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===============================
   ROUTES
================================= */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/solutions', require('./routes/solutions'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/admin', require('./routes/admin'));

/* ===============================
   HEALTH CHECK
================================= */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Village Connect API is running 🚀'
  });
});

/* ===============================
   ROOT ROUTE
================================= */
app.get('/', (req, res) => {
  res.send('Village Connect Backend Running 🚀');
});

/* ===============================
   DATABASE CONNECTION + SERVER START
================================= */
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

startServer();
