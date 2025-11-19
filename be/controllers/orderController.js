const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');

const checkOrderPermission = (order, supervisorId) => {
  return order.supervisorId.toString() === supervisorId.toString();
};

const isOrderStatusBlocked = (order, blockedStatuses) => {
  return blockedStatuses.includes(order.status);
};

const populateOrder = (order) => {
  return Order.findById(order._id)
    .populate('tableId', 'tableNumber floor type')
    .populate('supervisorId', 'name username')
    .populate('items.menuItemId', 'name category price');
};

const getAllOrders = async (req, res) => {
  try {
    const { tableId, supervisorId, status } = req.query;
    const query = {};
    
    if (tableId) query.tableId = tableId;
    if (supervisorId) query.supervisorId = supervisorId;
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('tableId', 'tableNumber floor type')
      .populate('supervisorId', 'name username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('tableId', 'tableNumber floor type')
      .populate('supervisorId', 'name username')
      .populate('items.menuItemId', 'name category price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

const createOrder = async (req, res) => {
  try {
    if (!req.supervisor || !req.supervisor._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { tableId, notes } = req.body;
    
    if (!tableId) {
      return res.status(400).json({
        success: false,
        message: 'Table ID is required'
      });
    }

    const table = await Table.findById(tableId);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    if (table.status === 'reserved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create order for reserved table. Please change table status first.'
      });
    }

    if (table.currentOrderId) {
      const existingOrder = await Order.findById(table.currentOrderId);
      if (existingOrder && existingOrder.status !== 'paid' && existingOrder.status !== 'cancelled') {
        return res.status(400).json({
          success: false,
          message: table.status === 'available' ? 'Table has an unpaid order' : 'Table is occupied with an active order',
          data: existingOrder
        });
      }
    }

    let order;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const orderNumber = await Order.generateOrderNumber();
        const orderData = {
          orderNumber,
          tableId,
          supervisorId: req.supervisor._id,
          notes: notes || '',
          items: [],
          status: 'draft'
        };

        order = await Order.create(orderData);
        break;
      } catch (createError) {
        if (createError.code === 11000 && createError.keyPattern && createError.keyPattern.orderNumber) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw createError;
          }
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        } else {
          throw createError;
        }
      }
    }

    if (table.status === 'available') {
      await Table.findByIdAndUpdate(tableId, {
        status: 'occupied',
        currentOrderId: order._id
      });
    } else if (table.status === 'occupied' && !table.currentOrderId) {
      await Table.findByIdAndUpdate(tableId, {
        currentOrderId: order._id
      });
    }

    let populatedOrder;
    try {
      populatedOrder = await populateOrder(order);
    } catch (populateError) {
      populatedOrder = order;
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { notes, status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!checkOrderPermission(order, req.supervisor._id)) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    if (isOrderStatusBlocked(order, ['paid', 'cancelled'])) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update paid or cancelled order'
      });
    }

    const updateData = {};
    if (notes !== undefined) updateData.notes = notes;
    if (status) {
      const validStatuses = ['draft', 'sent_to_kitchen', 'cooking', 'completed', 'cancelled'];
      if (validStatuses.includes(status)) {
        updateData.status = status;
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('tableId', 'tableNumber floor type')
      .populate('supervisorId', 'name username');

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!checkOrderPermission(order, req.supervisor._id)) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    if (order.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel paid order'
      });
    }

    const table = await Table.findById(order.tableId);
    if (table && table.currentOrderId && table.currentOrderId.toString() === order._id.toString()) {
      const updateData = { currentOrderId: null };
      if (table.status === 'occupied') {
        updateData.status = 'available';
      }
      await Table.findByIdAndUpdate(order.tableId, updateData);
    }

    await Order.findByIdAndDelete(order._id);

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
      data: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

const getOrdersByTable = async (req, res) => {
  try {
    const orders = await Order.find({ 
      tableId: req.params.tableId,
      status: { $nin: ['paid', 'cancelled'] }
    })
      .populate('supervisorId', 'name username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

const addOrderItem = async (req, res) => {
  try {
    const { menuItemId, quantity, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!checkOrderPermission(order, req.supervisor._id)) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    if (isOrderStatusBlocked(order, ['paid', 'cancelled'])) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add items to paid or cancelled order'
      });
    }

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    if (!menuItem.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Menu item is not available'
      });
    }

    const unitPrice = menuItem.price;
    const totalPrice = unitPrice * quantity;

    order.items.push({
      menuItemId,
      name: menuItem.name,
      quantity,
      unitPrice,
      totalPrice,
      note: note || ''
    });

    order.calculateTotal();
    await order.save();

    const updatedOrder = await populateOrder(order);

    res.status(200).json({
      success: true,
      message: 'Item added successfully',
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add item',
      error: error.message
    });
  }
};

const updateOrderItem = async (req, res) => {
  try {
    const { quantity, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!checkOrderPermission(order, req.supervisor._id)) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    if (isOrderStatusBlocked(order, ['paid', 'cancelled'])) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update items in paid or cancelled order'
      });
    }

    const item = order.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in order'
      });
    }

    if (quantity !== undefined) {
      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be greater than 0'
        });
      }
      item.quantity = quantity;
      item.totalPrice = item.unitPrice * quantity;
    }

    if (note !== undefined) item.note = note;

    order.calculateTotal();
    await order.save();

    const updatedOrder = await populateOrder(order);

    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update item',
      error: error.message
    });
  }
};

const cleanupEmptyOrder = async (orderId, tableId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order || !order.items || order.items.length === 0) {
      const table = await Table.findById(tableId);
      if (table && table.currentOrderId && table.currentOrderId.toString() === orderId.toString()) {
        const updateData = { currentOrderId: null };
        if (table.status === 'occupied') {
          updateData.status = 'available';
        }
        await Table.findByIdAndUpdate(tableId, updateData);
      }
      if (order) {
        await Order.findByIdAndDelete(orderId);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error cleaning up empty order:', error);
    return false;
  }
};

const deleteOrderItem = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!checkOrderPermission(order, req.supervisor._id)) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    if (isOrderStatusBlocked(order, ['paid', 'cancelled'])) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete items from paid or cancelled order'
      });
    }

    const item = order.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in order'
      });
    }

    const itemIndex = order.items.findIndex(item => item._id.toString() === req.params.itemId);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in order'
      });
    }

    order.items.splice(itemIndex, 1);
    order.calculateTotal();
    await order.save();

    const savedOrder = await Order.findById(order._id);
    
    const wasCleanedUp = await cleanupEmptyOrder(order._id, order.tableId);
    
    if (wasCleanedUp) {
      return res.status(200).json({
        success: true,
        message: 'Item deleted successfully. Order removed as it has no items.',
        data: null
      });
    }

    const updatedOrder = await populateOrder(savedOrder);

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully',
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete item',
      error: error.message
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrdersByTable,
  addOrderItem,
  updateOrderItem,
  deleteOrderItem
};
