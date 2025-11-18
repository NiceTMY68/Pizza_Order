const Table = require('../models/Table');

const getAllTables = async (req, res) => {
  try {
    const { floor, type, status } = req.query;
    const query = {};
    
    if (floor) query.floor = parseInt(floor);
    if (type) query.type = type;
    if (status) query.status = status;

    const tables = await Table.find(query)
      .populate('currentOrderId', 'orderNumber status total')
      .sort({ floor: 1, tableNumber: 1 });

    res.status(200).json({
      success: true,
      count: tables.length,
      data: tables
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tables',
      error: error.message
    });
  }
};

const getTablesByFloor = async (req, res) => {
  try {
    const floor = parseInt(req.params.floor);
    
    if (![1, 2].includes(floor)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid floor number. Only floor 1 and 2 are available'
      });
    }

    const tables = await Table.find({ floor })
      .populate('currentOrderId', 'orderNumber status total')
      .sort({ tableNumber: 1 });

    res.status(200).json({
      success: true,
      count: tables.length,
      data: tables
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tables',
      error: error.message
    });
  }
};

const getTakeAwaySlots = async (req, res) => {
  try {
    const takeAwaySlots = await Table.find({ type: 'takeaway' })
      .populate('currentOrderId', 'orderNumber status total')
      .sort({ tableNumber: 1 });

    res.status(200).json({
      success: true,
      count: takeAwaySlots.length,
      data: takeAwaySlots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch takeaway slots',
      error: error.message
    });
  }
};

const getTableById = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)
      .populate('currentOrderId');

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    res.status(200).json({
      success: true,
      data: table
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch table',
      error: error.message
    });
  }
};

const getTableStatus = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)
      .select('tableNumber status currentOrderId');

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        tableNumber: table.tableNumber,
        status: table.status,
        hasOrder: !!table.currentOrderId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch table status',
      error: error.message
    });
  }
};

const updateTableStatus = async (req, res) => {
  try {
    const { status, currentOrderId } = req.body;

    const validStatuses = ['available', 'occupied', 'reserved'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const table = await Table.findById(req.params.id).populate('currentOrderId');
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    if (status) {
      if (status === 'available') {
        if (table.currentOrderId) {
          const Order = require('../models/Order');
          const order = await Order.findById(table.currentOrderId);
          if (order && order.status !== 'paid' && order.status !== 'cancelled') {
            if (order.items && order.items.length > 0) {
              return res.status(400).json({
                success: false,
                message: 'Cannot set table to available. Table has an active order with items. Please complete or cancel the order first.'
              });
            } else {
              await Table.findByIdAndUpdate(req.params.id, {
                currentOrderId: null
              });
              await Order.findByIdAndDelete(order._id);
            }
          }
        }
      }

      if (status === 'occupied') {
        if (currentOrderId && table.currentOrderId && table.currentOrderId.toString() !== currentOrderId.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Cannot set table to occupied. Table already has a different order assigned.'
          });
        }
      }

      if (status === 'reserved') {
        if (table.currentOrderId) {
          const Order = require('../models/Order');
          const order = await Order.findById(table.currentOrderId);
          if (order && order.status !== 'paid' && order.status !== 'cancelled') {
            if (order.items && order.items.length > 0) {
              return res.status(400).json({
                success: false,
                message: 'Cannot set table to reserved. Table has an active order with items.'
              });
            } else {
              await Table.findByIdAndUpdate(req.params.id, {
                currentOrderId: null
              });
              await Order.findByIdAndDelete(order._id);
            }
          }
        }
      }
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (currentOrderId !== undefined) {
      updateData.currentOrderId = currentOrderId || null;
    }

    const updatedTable = await Table.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('currentOrderId', 'orderNumber status total');

    res.status(200).json({
      success: true,
      message: 'Table status updated successfully',
      data: updatedTable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update table status',
      error: error.message
    });
  }
};

module.exports = {
  getAllTables,
  getTablesByFloor,
  getTakeAwaySlots,
  getTableById,
  getTableStatus,
  updateTableStatus
};
