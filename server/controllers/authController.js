const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// --- Generate JWT token ---
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// ----------------------------
// @route   POST /api/auth/register
// @access  Public
// ----------------------------
const register = async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return sendError(res, 'Please provide name, email and password');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, 'Email already registered');
  }

  // Create user (password hashed via pre-save hook in model)
  const user = await User.create({ name, email, password });

  const token = generateToken(user._id);

  sendSuccess(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  }, 201);
};

// ----------------------------
// @route   POST /api/auth/login
// @access  Public
// ----------------------------
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 'Please provide email and password');
  }

  // Find user and explicitly include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return sendError(res, 'Invalid email or password', 401);
  }

  // Compare password using model method
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return sendError(res, 'Invalid email or password', 401);
  }

  const token = generateToken(user._id);

  sendSuccess(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
};

// ----------------------------
// @route   GET /api/auth/me
// @access  Private
// ----------------------------
const getMe = async (req, res) => {
  // req.user is set by protect middleware
  sendSuccess(res, {
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
  });
};

module.exports = { register, login, getMe };