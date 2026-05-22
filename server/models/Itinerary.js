const mongoose = require('mongoose');

// --- Sub-schema for each day's activity ---
const activitySchema = new mongoose.Schema(
  {
    time: { type: String },           // e.g. "09:00 AM"
    title: { type: String },          // e.g. "Check-in at hotel"
    description: { type: String },    // details
    location: { type: String },       // place name
    type: {
      type: String,
      enum: ['flight', 'hotel', 'activity', 'meal', 'transport', 'other'],
      default: 'other',
    },
  },
  { _id: false } // no separate _id for each activity
);

// --- Sub-schema for each day ---
const daySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },   // Day 1, Day 2...
    date: { type: String },                  // "2024-06-15"
    title: { type: String },                 // "Arrival in Paris"
    activities: [activitySchema],
    accommodation: { type: String },         // hotel name for that night
    notes: { type: String },                 // any tips or reminders
  },
  { _id: false }
);

// --- Sub-schema for uploaded source files ---
const sourceFileSchema = new mongoose.Schema(
  {
    originalName: { type: String },
    mimetype: { type: String },
    size: { type: Number },
    path: { type: String },          // local path or S3 URL
  },
  { _id: false }
);

// --- Main Itinerary schema ---
const itinerarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // fast lookup by user
    },
    title: {
      type: String,
      required: [true, 'Itinerary title is required'],
      trim: true,
    },
    destination: {
      type: String,
      trim: true,
    },
    startDate: { type: String },
    endDate: { type: String },
    duration: { type: Number },       // number of days

    // Raw text extracted from uploaded documents
    rawExtractedText: {
      type: String,
      select: false,                  // don't return this in list queries
    },

    // Structured AI-generated itinerary
    days: [daySchema],

    // Summary info extracted by AI
    summary: {
      airline: { type: String },
      flightNumber: { type: String },
      hotel: { type: String },
      totalTravelers: { type: Number },
      bookingReference: { type: String },
    },

    // Uploaded source documents
    sourceFiles: [sourceFileSchema],

    // Share functionality
    shareToken: {
      type: String,
      unique: true,
      sparse: true,                   // allows multiple null values
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareExpiry: {
      type: Date,
      default: null,
    },

    // Status of AI generation
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Itinerary', itinerarySchema);