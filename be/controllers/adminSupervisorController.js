const Supervisor = require('../models/Supervisor');

/**
 * Lấy danh sách tất cả supervisors
 */
const getAllSupervisors = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const supervisors = await Supervisor.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: supervisors.length,
      data: supervisors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supervisors',
      error: error.message
    });
  }
};

/**
 * Lấy thông tin một supervisor
 */
const getSupervisorById = async (req, res) => {
  try {
    const supervisor = await Supervisor.findById(req.params.id).select('-password');

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: 'Supervisor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: supervisor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supervisor',
      error: error.message
    });
  }
};

/**
 * Tạo supervisor mới
 */
const createSupervisor = async (req, res) => {
  try {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, username, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const existingSupervisor = await Supervisor.findOne({ username: username.toLowerCase() });
    if (existingSupervisor) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    const supervisor = await Supervisor.create({
      name,
      username: username.toLowerCase(),
      password
    });

    res.status(201).json({
      success: true,
      message: 'Supervisor created successfully',
      data: {
        id: supervisor._id,
        name: supervisor.name,
        username: supervisor.username,
        isActive: supervisor.isActive
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create supervisor',
      error: error.message
    });
  }
};

/**
 * Cập nhật supervisor
 */
const updateSupervisor = async (req, res) => {
  try {
    const { name, isActive, password } = req.body;
    const supervisor = await Supervisor.findById(req.params.id);

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: 'Supervisor not found'
      });
    }

    if (name) supervisor.name = name;
    if (isActive !== undefined) supervisor.isActive = isActive;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters'
        });
      }
      supervisor.password = password;
    }

    await supervisor.save();

    res.status(200).json({
      success: true,
      message: 'Supervisor updated successfully',
      data: {
        id: supervisor._id,
        name: supervisor.name,
        username: supervisor.username,
        isActive: supervisor.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update supervisor',
      error: error.message
    });
  }
};

/**
 * Xóa supervisor
 */
const deleteSupervisor = async (req, res) => {
  try {
    const supervisor = await Supervisor.findById(req.params.id);

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: 'Supervisor not found'
      });
    }

    await Supervisor.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Supervisor deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete supervisor',
      error: error.message
    });
  }
};

module.exports = {
  getAllSupervisors,
  getSupervisorById,
  createSupervisor,
  updateSupervisor,
  deleteSupervisor
};

