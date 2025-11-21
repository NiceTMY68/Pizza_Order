/**
 * Middleware xác thực dữ liệu đăng nhập
 * Kiểm tra username và password có được cung cấp không
 */
const validateLogin = (req, res, next) => {
  const { username, password } = req.body;

  // Kiểm tra cả username và password đều phải có
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }

  next();
};

/**
 * Middleware xác thực dữ liệu order
 * Kiểm tra tableId có được cung cấp không
 */
const validateOrder = (req, res, next) => {
  const { tableId } = req.body;

  // Kiểm tra tableId phải có
  if (!tableId) {
    return res.status(400).json({
      success: false,
      message: 'Table ID is required'
    });
  }

  next();
};

/**
 * Middleware xác thực dữ liệu order item
 * Kiểm tra menuItemId và quantity có hợp lệ không
 */
const validateOrderItem = (req, res, next) => {
  const { menuItemId, quantity } = req.body;

  // Kiểm tra menuItemId phải có
  if (!menuItemId) {
    return res.status(400).json({
      success: false,
      message: 'Menu item ID is required'
    });
  }

  // Kiểm tra quantity phải có và lớn hơn 0
  if (!quantity || quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Quantity must be greater than 0'
    });
  }

  next();
};

/**
 * Middleware xác thực phương thức thanh toán
 * Kiểm tra paymentMethod có hợp lệ không (phải là cash, card, hoặc bank)
 */
const validatePayment = (req, res, next) => {
  const { paymentMethod } = req.body;

  // Kiểm tra paymentMethod phải có
  if (!paymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'Payment method is required'
    });
  }

  // Danh sách các phương thức thanh toán hợp lệ
  const validMethods = ['cash', 'card', 'bank'];
  // Kiểm tra paymentMethod có trong danh sách hợp lệ không
  if (!validMethods.includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment method'
    });
  }

  next();
};

module.exports = {
  validateLogin,
  validateOrder,
  validateOrderItem,
  validatePayment
};
