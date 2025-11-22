require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

// URI kết nối MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://long_db_user:%40Bundaumamtom20k@cluster0.fvdcbtz.mongodb.net/pizza_order?retryWrites=true&w=majority';

/**
 * Script để tạo admin đầu tiên
 * Chạy: npm run seed:admin hoặc node be/scripts/seedAdmin.js
 */
const seedAdmin = async () => {
  try {
    // Kết nối database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Kiểm tra xem đã có admin chưa
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin already exists!');
      console.log('Username: admin');
      process.exit(0);
    }

    // Tạo admin mặc định
    const admin = await Admin.create({
      name: 'Administrator',
      username: 'admin',
      email: 'admin@pizzaorder.com',
      password: 'admin123', // Password sẽ được hash tự động
      isActive: true
    });

    console.log('✅ Admin created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Email:', admin.email);
    console.log('\n⚠️  Please change the default password after first login!');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Chạy script
seedAdmin();

