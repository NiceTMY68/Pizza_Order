/**
 * Middleware xử lý lỗi toàn cục
 * Bắt tất cả các lỗi được throw hoặc pass từ các route/middleware trước đó
 * Trả về response JSON với thông tin lỗi
 * 
 * @param {Error} err - Error object được throw
 * @param {Object} req - Request object từ Express
 * @param {Object} res - Response object từ Express
 * @param {Function} next - Callback function (không sử dụng trong error handler)
 */
const errorHandler = (err, req, res, next) => {
  // In stack trace ra console để debug
  console.error(err.stack);

  // Lấy status code từ error hoặc mặc định là 500 (Internal Server Error)
  const statusCode = err.statusCode || 500;
  // Lấy message từ error hoặc message mặc định
  const message = err.message || 'Internal Server Error';

  // Trả về response JSON với thông tin lỗi
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      // Chỉ hiển thị stack trace trong môi trường development
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;

