const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');

const {
  uploadAndGenerate,
  getMyItineraries,
  getItineraryById,
  deleteItinerary,
  generateShareLink,
  revokeShareLink,
  getSharedItinerary,
} = require('../controllers/itineraryController');

// --- Multer config (Memory for AWS S3) ---
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG and PNG files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// --- Public route (no auth needed) ---
router.get('/share/:token', getSharedItinerary);

// --- Private routes (JWT required) ---
router.post('/upload', protect, upload.single('document'), uploadAndGenerate);
router.get('/', protect, getMyItineraries);
router.get('/:id', protect, getItineraryById);
router.delete('/:id', protect, deleteItinerary);
router.post('/:id/share', protect, generateShareLink);
router.delete('/:id/share', protect, revokeShareLink);

module.exports = router;