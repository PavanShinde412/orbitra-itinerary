const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Itinerary = require('../models/Itinerary');
const { extractTextFromFile } = require('../services/extractionService');
const { generateItinerary } = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// ----------------------------
// @route   POST /api/itinerary/upload
// @access  Private
// ----------------------------
const uploadAndGenerate = async (req, res) => {
  if (!req.file) {
    return sendError(res, 'Please upload a file');
  }

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
    const extractedData = await extractTextFromFile(req.file);
    const aiResult = await generateItinerary(extractedData);

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

    fs.unlink(req.file.path, () => { });

    sendSuccess(res, { itinerary }, 201);
  } catch (err) {
    console.log('Full error', err);
    itinerary.status = 'failed';
    itinerary.title = 'Generation Failed';
    await itinerary.save();

    fs.unlink(req.file.path, () => { });

    sendError(res, err.message || 'AI generation failed', 500);
  }
};

// ----------------------------
// @route   GET /api/itinerary
// @access  Private
// ----------------------------
const getMyItineraries = async (req, res) => {
  const itineraries = await Itinerary.find({ userId: req.user._id })
    .select('-rawExtractedText')
    .sort({ createdAt: -1 });

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

  if (!itinerary.shareToken) {
    itinerary.shareToken = uuidv4();
  }

  itinerary.isPublic = true;

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