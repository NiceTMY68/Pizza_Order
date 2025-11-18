const MenuItem = require('../models/MenuItem');

const getAllMenuItems = async (req, res) => {
  try {
    const { category, available } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (available !== undefined) query.isAvailable = available === 'true';

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

const getDrinks = async (req, res) => {
  try {
    const drinks = await MenuItem.find({ 
      category: 'drink',
      isAvailable: true 
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: drinks.length,
      data: drinks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drinks',
      error: error.message
    });
  }
};

const getPizzas = async (req, res) => {
  try {
    const pizzas = await MenuItem.find({ 
      category: 'pizza',
      isAvailable: true 
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: pizzas.length,
      data: pizzas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pizzas',
      error: error.message
    });
  }
};

const getPastas = async (req, res) => {
  try {
    const pastas = await MenuItem.find({ 
      category: 'pasta',
      isAvailable: true 
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: pastas.length,
      data: pastas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pastas',
      error: error.message
    });
  }
};

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

module.exports = {
  getAllMenuItems,
  getDrinks,
  getPizzas,
  getPastas,
  getMenuItemById
};
