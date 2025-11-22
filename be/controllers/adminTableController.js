const Table = require('../models/Table');

/**
 * Lấy danh sách tất cả tables
 */
const getAllTables = async (req, res) => {
  try {
    const { floor, type, status, search } = req.query;
    const query = {};

    if (floor) query.floor = parseInt(floor);
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      query.tableNumber = { $regex: search, $options: 'i' };
    }

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

/**
 * Lấy thông tin một table
 */
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

/**
 * Tạo table mới
 */
const createTable = async (req, res) => {
  try {
    const { tableNumber, floor, type, status } = req.body;

    if (!tableNumber) {
      return res.status(400).json({
        success: false,
        message: 'Table number is required'
      });
    }

    if (type && !['table', 'takeaway', 'pizza_bar'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be table, takeaway, or pizza_bar'
      });
    }

    if (status && !['available', 'occupied', 'reserved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be available, occupied, or reserved'
      });
    }

    const existingTable = await Table.findOne({ tableNumber });
    if (existingTable) {
      return res.status(400).json({
        success: false,
        message: 'Table number already exists'
      });
    }

    const table = await Table.create({
      tableNumber,
      floor: floor || null,
      type: type || 'table',
      status: status || 'available'
    });

    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      data: table
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Table number already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create table',
      error: error.message
    });
  }
};

/**
 * Cập nhật table
 */
const updateTable = async (req, res) => {
  try {
    const { tableNumber, floor, type, status } = req.body;
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    if (tableNumber) {
      const existingTable = await Table.findOne({ tableNumber, _id: { $ne: req.params.id } });
      if (existingTable) {
        return res.status(400).json({
          success: false,
          message: 'Table number already exists'
        });
      }
      table.tableNumber = tableNumber;
    }
    if (floor !== undefined) table.floor = floor;
    if (type) {
      if (!['table', 'takeaway', 'pizza_bar'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid type. Must be table, takeaway, or pizza_bar'
        });
      }
      table.type = type;
    }
    if (status) {
      if (!['available', 'occupied', 'reserved'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be available, occupied, or reserved'
        });
      }
      table.status = status;
    }

    await table.save();

    res.status(200).json({
      success: true,
      message: 'Table updated successfully',
      data: table
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Table number already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update table',
      error: error.message
    });
  }
};

/**
 * Xóa table
 */
const deleteTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    if (table.status === 'occupied') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete occupied table'
      });
    }

    await Table.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Table deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete table',
      error: error.message
    });
  }
};

module.exports = {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable
};

