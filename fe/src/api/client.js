import axios from 'axios';

// Tạo axios instance với cấu hình mặc định
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để tự động thêm JWT token vào mọi request
// Token được lấy từ localStorage và thêm vào header Authorization
apiClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage
    const token = localStorage.getItem('token');
    // Nếu có token, thêm vào header Authorization với format "Bearer <token>"
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý response và lỗi
// Tự động redirect về trang login nếu nhận được lỗi 401 (Unauthorized)
apiClient.interceptors.response.use(
  // Nếu thành công, chỉ trả về data (bỏ qua response wrapper)
  (response) => response.data,
  (error) => {
    // Nếu nhận được lỗi 401, có nghĩa là token không hợp lệ hoặc đã hết hạn
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      // Xóa token và thông tin supervisor khỏi localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('supervisor');
      
      // Nếu đang không ở trang login, redirect về trang login
      if (token && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    // Trả về error data hoặc error object
    return Promise.reject(error.response?.data || error);
  }
);

export default apiClient;
