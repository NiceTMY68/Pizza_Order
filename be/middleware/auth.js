const jwt = require('jsonwebtoken');
const Supervisor = require('../models/Supervisor');

/**
 * Middleware xác thực người dùng (supervisor)
 * Kiểm tra JWT token từ header Authorization và xác minh tính hợp lệ
 * Nếu hợp lệ, gắn thông tin supervisor vào req.supervisor để các route sau sử dụng
 * 
 * @param {Object} req - Request object từ Express
 * @param {Object} res - Response object từ Express
 * @param {Function} next - Callback để chuyển sang middleware tiếp theo
 */
const authenticate = async (req, res, next) => {
  try {
    // Lấy header Authorization từ request
    const authHeader = req.headers.authorization;
    
    // Kiểm tra xem có header Authorization và có định dạng "Bearer <token>" không
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }

    // Lấy token từ header (bỏ qua phần "Bearer ")
    const token = authHeader.substring(7);
    // Giải mã và xác minh token sử dụng JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    // Tìm supervisor trong database dựa trên ID từ token, không lấy password
    const supervisor = await Supervisor.findById(decoded.id).select('-password');
    
    // Kiểm tra supervisor có tồn tại không
    if (!supervisor) {
      return res.status(401).json({
        success: false,
        message: 'Supervisor not found'
      });
    }

    // Kiểm tra tài khoản có đang hoạt động không
    if (!supervisor.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is disabled'
      });
    }

    // Gắn thông tin supervisor vào request để các route sau có thể sử dụng
    req.supervisor = supervisor;
    // Chuyển sang middleware/route tiếp theo
    next();
  } catch (error) {
    // Xử lý các loại lỗi khác nhau
    if (error.name === 'JsonWebTokenError') {
      // Token không hợp lệ (sai format, không đúng secret)
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      // Token đã hết hạn
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again'
      });
    }
    
    // Các lỗi khác (lỗi server)
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

module.exports = { authenticate };
