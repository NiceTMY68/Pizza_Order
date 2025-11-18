const express = require('express');
const router = express.Router();
const {
  getAllMenuItems,
  getDrinks,
  getPizzas,
  getPastas,
  getMenuItemById
} = require('../controllers/menuController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getAllMenuItems);
router.get('/drinks', getDrinks);
router.get('/pizzas', getPizzas);
router.get('/pastas', getPastas);
router.get('/items/:id', getMenuItemById);

module.exports = router;
