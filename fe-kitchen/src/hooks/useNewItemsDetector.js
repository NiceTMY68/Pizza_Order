import { useEffect, useRef } from 'react';
import { playBellSound } from '../utils/sound';

/**
 * Hook phát hiện items mới và phát âm thanh thông báo
 * So sánh danh sách items hiện tại với danh sách trước đó
 * Nếu có items mới (không có trong danh sách trước), sẽ phát âm thanh chuông
 * 
 * @param {Array} currentItems - Danh sách items hiện tại
 * @param {Boolean} enabled - Bật/tắt thông báo âm thanh (mặc định: true)
 */
export const useNewItemsDetector = (currentItems, enabled = true) => {
  // Lưu danh sách items trước đó (sử dụng Set để so sánh nhanh)
  const previousItemsRef = useRef(new Set());
  // Flag để biết có phải lần load đầu tiên không (không phát sound lần đầu)
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    // Bỏ qua lần load đầu tiên - chỉ lưu items, không phát sound
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      // Lưu tất cả items hiện tại vào previousItemsRef
      if (currentItems && currentItems.length > 0) {
        currentItems.forEach(item => {
          // Tạo key duy nhất cho mỗi item: orderId-itemId
          const key = `${item.orderId}-${item.item.id}`;
          previousItemsRef.current.add(key);
        });
      }
      return;
    }

    // Nếu sound bị tắt, vẫn cập nhật previousItemsRef nhưng không phát sound
    if (!enabled) {
      const currentKeys = new Set();
      if (currentItems && currentItems.length > 0) {
        currentItems.forEach(item => {
          const key = `${item.orderId}-${item.item.id}`;
          currentKeys.add(key);
        });
      }
      previousItemsRef.current = currentKeys;
      return;
    }

    // Kiểm tra items mới
    if (currentItems && currentItems.length > 0) {
      const newItems = [];
      const currentKeys = new Set();

      // Duyệt qua tất cả items hiện tại
      currentItems.forEach(item => {
        const key = `${item.orderId}-${item.item.id}`;
        currentKeys.add(key);
        // Nếu item không có trong danh sách trước, đó là item mới
        if (!previousItemsRef.current.has(key)) {
          newItems.push(item);
        }
      });

      // Nếu có items mới, phát âm thanh chuông
      if (newItems.length > 0) {
        playBellSound();
      }

      // Cập nhật danh sách items trước đó
      previousItemsRef.current = currentKeys;
    } else {
      // Nếu không còn items, xóa danh sách
      previousItemsRef.current.clear();
    }
  }, [currentItems, enabled]); // Chạy lại khi currentItems hoặc enabled thay đổi
};

