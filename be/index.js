// Nạp biến môi trường từ file .env
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Khởi tạo ứng dụng Express
const app = express();
// Lấy port từ biến môi trường hoặc mặc định là 3000
const PORT = process.env.PORT || 3000;

// Kết nối đến MongoDB database
connectDB();

// Cấu hình CORS để cho phép các request từ frontend
// origin: true - cho phép tất cả các origin
// credentials: true - cho phép gửi cookies và authentication headers
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Middleware để parse JSON từ request body
app.use(express.json());
// Middleware để parse URL-encoded data từ request body
app.use(express.urlencoded({ extended: true }));

// Nạp và sử dụng tất cả các routes từ thư mục routes
// Tất cả routes sẽ có prefix /api
const routes = require('./routes');
app.use('/api', routes);

// Route mặc định để kiểm tra server có đang chạy không
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pizza Order API - Supervisor Backend',
    version: '1.0.0',
    status: 'running'
  });
});

// Middleware xử lý lỗi - phải đặt sau tất cả routes
app.use(errorHandler);

// Khởi động server và lắng nghe trên port đã cấu hình
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
