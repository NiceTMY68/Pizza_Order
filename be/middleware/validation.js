const validateLogin = (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }

  next();
};

const validateOrder = (req, res, next) => {
  const { tableId } = req.body;

  if (!tableId) {
    return res.status(400).json({
      success: false,
      message: 'Table ID is required'
    });
  }

  next();
};

const validateOrderItem = (req, res, next) => {
  const { menuItemId, quantity } = req.body;

  if (!menuItemId) {
    return res.status(400).json({
      success: false,
      message: 'Menu item ID is required'
    });
  }

  if (!quantity || quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Quantity must be greater than 0'
    });
  }

  next();
};

const validatePayment = (req, res, next) => {
  const { paymentMethod } = req.body;

  if (!paymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'Payment method is required'
    });
  }

  const validMethods = ['cash', 'card', 'bank'];
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
