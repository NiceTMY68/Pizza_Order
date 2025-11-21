const mongoose = require('mongoose');

// URI kết nối MongoDB - lấy từ biến môi trường hoặc sử dụng giá trị mặc định
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://long_db_user:%40Bundaumamtom20k@cluster0.fvdcbtz.mongodb.net/pizza_order?retryWrites=true&w=majority';

/**
 * Hàm kết nối đến MongoDB database
 * Sử dụng async/await để xử lý bất đồng bộ
 * Nếu kết nối thất bại, sẽ dừng toàn bộ ứng dụng
 */
const connectDB = async () => {
  try {
    // Kết nối đến MongoDB sử dụng URI đã cấu hình
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    // Nếu có lỗi, in ra console và thoát ứng dụng với mã lỗi 1
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
