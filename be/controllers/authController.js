const jwt = require('jsonwebtoken');
const Supervisor = require('../models/Supervisor');

/**
 * Tạo JWT token cho supervisor
 * @param {String} id - ID của supervisor
 * @returns {String} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key-change-in-production', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

/**
 * Controller xử lý đăng nhập supervisor
 * Kiểm tra username và password, nếu hợp lệ thì tạo và trả về JWT token
 */
const login = async (req, res) => {
  try {
    // Lấy username và password từ request body
    const { username, password } = req.body;
    // Tìm supervisor trong database (chuyển username về lowercase để so sánh)
    const supervisor = await Supervisor.findOne({ username: username.toLowerCase() });

    // Kiểm tra supervisor có tồn tại không
    if (!supervisor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Kiểm tra tài khoản có đang hoạt động không
    if (!supervisor.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is disabled'
      });
    }

    // So sánh password với password đã hash trong database
    const isMatch = await supervisor.comparePassword(password);

    // Nếu password không khớp
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Tạo JWT token cho supervisor
    const token = generateToken(supervisor._id);

    // Trả về token và thông tin supervisor (không bao gồm password)
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

/**
 * Controller lấy thông tin supervisor hiện tại
 * Sử dụng thông tin từ req.supervisor (đã được xác thực bởi middleware authenticate)
 */
const getMe = async (req, res) => {
  try {
    // Tìm supervisor trong database, không lấy password
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

/**
 * Controller xử lý đăng xuất
 * Vì sử dụng JWT stateless, logout chỉ cần trả về success
 * Client sẽ tự xóa token ở phía frontend
 */
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
