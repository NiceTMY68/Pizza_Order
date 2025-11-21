import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

// Tạo Context để quản lý trạng thái authentication
const AuthContext = createContext(null);

/**
 * AuthProvider component
 * Cung cấp context cho toàn bộ app để quản lý authentication
 * Tự động khôi phục session từ localStorage khi app khởi động
 */
export const AuthProvider = ({ children }) => {
  // State lưu thông tin user (supervisor) hiện tại
  const [user, setUser] = useState(null);
  // State để biết đang load session hay không
  const [loading, setLoading] = useState(true);

  // Effect chạy khi component mount để khôi phục session từ localStorage
  useEffect(() => {
    // Lấy token và thông tin supervisor từ localStorage
    const token = localStorage.getItem('token');
    const supervisorData = localStorage.getItem('supervisor');
    
    // Nếu có cả token và supervisor data, khôi phục session
    if (token && supervisorData) {
      try {
        // Parse JSON và set user
        setUser(JSON.parse(supervisorData));
      } catch (error) {
        // Nếu parse lỗi, xóa dữ liệu không hợp lệ
        localStorage.removeItem('token');
        localStorage.removeItem('supervisor');
      }
    }
    // Đánh dấu đã load xong
    setLoading(false);
  }, []);

  /**
   * Hàm đăng nhập
   * Gọi API login và lưu token + supervisor info vào localStorage
   * @param {String} username - Tên đăng nhập
   * @param {String} password - Mật khẩu
   * @returns {Object} { success: boolean, message?: string }
   */
  const login = async (username, password) => {
    try {
      // Gọi API login
      const response = await authAPI.login(username, password);
      // Nếu thành công, cập nhật user state
      if (response && response.success) {
        setUser(response.data.supervisor);
        return { success: true };
      }
      // Nếu không thành công, trả về message lỗi
      return { success: false, message: (response && response.message) || 'Login failed' };
    } catch (error) {
      // Xử lý lỗi và trả về message
      const errorMessage = error.message || (error.response && error.response.message) || 'Login failed';
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  /**
   * Hàm đăng xuất
   * Gọi API logout và xóa user state
   * Token và supervisor data sẽ được xóa bởi API interceptor
   */
  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  // Giá trị context bao gồm user, các hàm login/logout, và trạng thái
  const value = {
    user, // Thông tin supervisor hiện tại
    login, // Hàm đăng nhập
    logout, // Hàm đăng xuất
    isAuthenticated: !!user, // Boolean cho biết đã đăng nhập chưa
    loading, // Boolean cho biết đang load session không
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook để sử dụng AuthContext
 * Phải được gọi trong component con của AuthProvider
 * @returns {Object} Context value với user, login, logout, isAuthenticated, loading
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Nếu không có context, có nghĩa là component không nằm trong AuthProvider
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
