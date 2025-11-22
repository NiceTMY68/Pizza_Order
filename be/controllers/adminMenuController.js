const MenuItem = require('../models/MenuItem');

/**
 * Lấy danh sách tất cả menu items (admin có thể xem cả unavailable)
 */
const getAllMenuItems = async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = {};

    if (category) query.category = category;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu items',
      error: error.message
    });
  }
};

/**
 * Lấy thông tin một menu item
 */
const getMenuItemById = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu item',
      error: error.message
    });
  }
};

/**
 * Tạo menu item mới
 */
const createMenuItem = async (req, res) => {
  try {
    const { name, category, price, supportsHalfHalf, isAvailable, image } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, and price are required'
      });
    }

    if (!['drink', 'pizza', 'pasta'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. Must be drink, pizza, or pasta'
      });
    }

    if (price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than or equal to 0'
      });
    }

    const menuItem = await MenuItem.create({
      name,
      category: category.toLowerCase(),
      price,
      supportsHalfHalf: supportsHalfHalf || false,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      image: image || null
    });

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: menuItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create menu item',
      error: error.message
    });
  }
};

/**
 * Cập nhật menu item
 */
const updateMenuItem = async (req, res) => {
  try {
    const { name, category, price, supportsHalfHalf, isAvailable, image } = req.body;
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    if (name) menuItem.name = name;
    if (category) {
      if (!['drink', 'pizza', 'pasta'].includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category. Must be drink, pizza, or pasta'
        });
      }
      menuItem.category = category.toLowerCase();
    }
    if (price !== undefined) {
      if (price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be greater than or equal to 0'
        });
      }
      menuItem.price = price;
    }
    if (supportsHalfHalf !== undefined) menuItem.supportsHalfHalf = supportsHalfHalf;
    if (isAvailable !== undefined) menuItem.isAvailable = isAvailable;
    if (image !== undefined) menuItem.image = image;

    await menuItem.save();

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: menuItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update menu item',
      error: error.message
    });
  }
};

/**
 * Xóa menu item
 */
const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    await MenuItem.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete menu item',
      error: error.message
    });
  }
};

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};

