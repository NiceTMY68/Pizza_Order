const jwt = require('jsonwebtoken');
const Supervisor = require('../models/Supervisor');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    const supervisor = await Supervisor.findById(decoded.id).select('-password');
    
    if (!supervisor) {
      return res.status(401).json({
        success: false,
        message: 'Supervisor not found'
      });
    }

    if (!supervisor.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is disabled'
      });
    }

    req.supervisor = supervisor;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

module.exports = { authenticate };
