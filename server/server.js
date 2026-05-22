require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');

// --- Route imports (we'll create these soon) ---
const authRoutes = require('./routes/authRoutes');
const itineraryRoutes = require('./routes/itineraryRoutes');

// --- Error handler (we'll create this soon) ---
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- Security & utility middleware ---
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: false,
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Static folder for uploads ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/itinerary', itineraryRoutes);

// --- Health check route ---
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Orbitra API is running 🚀' });
});

// --- Global error handler (must be last) ---
app.use(errorHandler);

// --- Connect to MongoDB then start server ---
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });