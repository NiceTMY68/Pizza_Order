const jwt = require('jsonwebtoken');
const Supervisor = require('../models/Supervisor');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key-change-in-production', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const supervisor = await Supervisor.findOne({ username: username.toLowerCase() });

    if (!supervisor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!supervisor.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is disabled'
      });
    }

    const isMatch = await supervisor.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(supervisor._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        supervisor: {
          id: supervisor._id,
          name: supervisor.name,
          username: supervisor.username
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

const getMe = async (req, res) => {
  try {
    const supervisor = await Supervisor.findById(req.supervisor._id).select('-password');
    res.status(200).json({
      success: true,
      data: supervisor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get supervisor information',
      error: error.message
    });
  }
};

const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
};

module.exports = {
  login,
  getMe,
  logout
};
