const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Itinerary = require('../models/Itinerary');
const { extractTextFromFile } = require('../services/extractionService');
const { generateItinerary } = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// Configure S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ----------------------------
// @route   POST /api/itinerary/upload
// @access  Private
// ----------------------------
const uploadAndGenerate = async (req, res) => {
  if (!req.file) {
    return sendError(res, 'Please upload a file');
  }

  // Create itinerary record with processing status
  const itinerary = await Itinerary.create({
    userId: req.user._id,
    title: 'Processing...',
    status: 'processing',
    sourceFiles: [
      {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      },
    ],
  });

  try {
    // Step 0: Upload file to AWS S3
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };
    await s3Client.send(new PutObjectCommand(uploadParams));
    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    // Update itinerary with S3 path
    itinerary.sourceFiles[0].path = s3Url;

    // Step 1: Extract text or image data from file buffer
    const extractedData = await extractTextFromFile(req.file);

    // Step 2: Send to AI and get structured itinerary
    const aiResult = await generateItinerary(extractedData);

    // Step 3: Update itinerary with AI results
    itinerary.title = aiResult.title || 'My Travel Itinerary';
    itinerary.destination = aiResult.destination || '';
    itinerary.startDate = aiResult.startDate || null;
    itinerary.endDate = aiResult.endDate || null;
    itinerary.duration = aiResult.duration || 1;
    itinerary.summary = aiResult.summary || {};
    itinerary.days = aiResult.days || [];
    itinerary.rawExtractedText =
      extractedData.type === 'text' ? extractedData.content : '';
    itinerary.status = 'completed';

    await itinerary.save();

    sendSuccess(res, { itinerary }, 201);
  } catch (err) {
    // Mark as failed but keep the record
    console.log('Full error', err);
    itinerary.status = 'failed';
    itinerary.title = 'Generation Failed';
    await itinerary.save();

    sendError(res, err.message || 'AI generation failed', 500);
  }
};

// ----------------------------
// @route   GET /api/itinerary
// @access  Private
// ----------------------------
const getMyItineraries = async (req, res) => {
  const itineraries = await Itinerary.find({ userId: req.user._id })
    .select('-rawExtractedText') // exclude heavy field
    .sort({ createdAt: -1 });   // newest first

  sendSuccess(res, { itineraries, count: itineraries.length });
};

// ----------------------------
// @route   GET /api/itinerary/:id
// @access  Private
// ----------------------------
const getItineraryById = async (req, res) => {
  const itinerary = await Itinerary.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!itinerary) {
    return sendError(res, 'Itinerary not found', 404);
  }

  sendSuccess(res, { itinerary });
};

// ----------------------------
// @route   DELETE /api/itinerary/:id
// @access  Private
// ----------------------------
const deleteItinerary = async (req, res) => {
  const itinerary = await Itinerary.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!itinerary) {
    return sendError(res, 'Itinerary not found', 404);
  }

  await itinerary.deleteOne();
  sendSuccess(res, { message: 'Itinerary deleted successfully' });
};

// ----------------------------
// @route   POST /api/itinerary/:id/share
// @access  Private
// ----------------------------
const generateShareLink = async (req, res) => {
  const itinerary = await Itinerary.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!itinerary) {
    return sendError(res, 'Itinerary not found', 404);
  }

  // Generate unique share token if not already shared
  if (!itinerary.shareToken) {
    itinerary.shareToken = uuidv4();
  }

  itinerary.isPublic = true;

  // Optional expiry — default 7 days
  const days = req.body.expiryDays || 7;
  itinerary.shareExpiry = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000
  );

  await itinerary.save();

  const shareUrl = `${process.env.CLIENT_URL}/share/${itinerary.shareToken}`;

  sendSuccess(res, {
    shareToken: itinerary.shareToken,
    shareUrl,
    expiresAt: itinerary.shareExpiry,
  });
};

// ----------------------------
// @route   DELETE /api/itinerary/:id/share
// @access  Private
// ----------------------------
const revokeShareLink = async (req, res) => {
  const itinerary = await Itinerary.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!itinerary) {
    return sendError(res, 'Itinerary not found', 404);
  }

  itinerary.shareToken = undefined;
  itinerary.isPublic = false;
  itinerary.shareExpiry = null;

  await itinerary.save();

  sendSuccess(res, { message: 'Share link revoked' });
};

// ----------------------------
// @route   GET /api/itinerary/share/:token
// @access  Public
// ----------------------------
const getSharedItinerary = async (req, res) => {
  const itinerary = await Itinerary.findOne({
    shareToken: req.params.token,
    isPublic: true,
  }).select('-rawExtractedText');

  if (!itinerary) {
    return sendError(res, 'Shared itinerary not found or link is invalid', 404);
  }

  // Check expiry
  if (itinerary.shareExpiry && new Date() > itinerary.shareExpiry) {
    return sendError(res, 'This share link has expired', 410);
  }

  sendSuccess(res, { itinerary });
};

module.exports = {
  uploadAndGenerate,
  getMyItineraries,
  getItineraryById,
  deleteItinerary,
  generateShareLink,
  revokeShareLink,
  getSharedItinerary,
};