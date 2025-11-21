const Order = require('../models/Order');

/**
 * Hàm populate order với các thông tin liên quan
 * Lấy thông tin table, supervisor và menu items từ các collection khác
 * @param {Object} order - Order object
 * @returns {Promise<Object>} Order đã được populate
 */
const populateOrder = (order) => {
  return Order.findById(order._id)
    .populate('tableId', 'tableNumber floor type')
    .populate('supervisorId', 'name username')
    .populate('items.menuItemId', 'name category price');
};

/**
 * Cập nhật trạng thái order dựa trên trạng thái của các items
 * Nếu tất cả items đã hoàn thành (ready/declined), order sẽ là 'completed'
 * Nếu có items đang cooking, order sẽ là 'cooking'
 * @param {Object} order - Order object cần cập nhật
 */
const updateOrderStatusFromItems = (order) => {
  // Các trạng thái được coi là đang xử lý
  const activeStatuses = ['pending', 'sent', 'cooking'];
  // Kiểm tra xem có items nào đang ở trạng thái active không
  const hasActiveItems = order.items.some(item => activeStatuses.includes(item.kitchenStatus));

  // Nếu không còn items nào đang xử lý, đánh dấu order là completed
  if (!hasActiveItems) {
    order.status = 'completed';
  } 
  // Nếu order đang ở trạng thái sent_to_kitchen và có items đang cooking, chuyển sang cooking
  else if (order.status === 'sent_to_kitchen' && order.items.some(item => item.kitchenStatus === 'cooking')) {
    order.status = 'cooking';
  }
};

/**
 * Controller gửi các items pending của order đến bếp
 * Chỉ gửi các items có kitchenStatus là 'pending'
 * Cập nhật trạng thái items thành 'sent' và ghi lại thời gian gửi
 */
const sendToKitchen = async (req, res) => {
  try {
    // Tìm order theo ID từ params
    const order = await Order.findById(req.params.id);

    // Kiểm tra order có tồn tại không
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Kiểm tra quyền: chỉ supervisor tạo order mới được gửi đến bếp
    if (order.supervisorId.toString() !== req.supervisor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    // Kiểm tra order có items không
    if (!order.items || order.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order has no items'
      });
    }

    // Lọc ra các items có trạng thái pending (chưa gửi đến bếp)
    const pendingItems = order.items.filter(item => item.kitchenStatus === 'pending');

    // Kiểm tra có items pending không
    if (pendingItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All items have been sent to kitchen'
      });
    }

    // Cập nhật trạng thái các items pending thành 'sent' và ghi lại thời gian
    pendingItems.forEach(item => {
      item.kitchenStatus = 'sent';
      item.sentToKitchenAt = new Date();
    });

    // Nếu order đang ở trạng thái draft, chuyển sang sent_to_kitchen
    if (order.status === 'draft') {
      order.status = 'sent_to_kitchen';
    }

    // Lưu order vào database
    await order.save();
    // Populate order với thông tin liên quan
    const updatedOrder = await populateOrder(order);

    // Trả về order đã cập nhật
    res.status(200).json({
      success: true,
      message: `${pendingItems.length} item(s) sent to kitchen`,
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send items to kitchen',
      error: error.message
    });
  }
};

/**
 * Controller lấy trạng thái của order trong bếp
 * Phân loại items theo trạng thái kitchen và trả về summary
 */
const getKitchenStatus = async (req, res) => {
  try {
    // Tìm order và populate thông tin menu items
    const order = await Order.findById(req.params.id)
      .populate('items.menuItemId', 'name category');

    // Kiểm tra order có tồn tại không
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Phân loại items theo trạng thái kitchen
    const itemsByStatus = {
      pending: order.items.filter(item => item.kitchenStatus === 'pending'),
      sent: order.items.filter(item => item.kitchenStatus === 'sent'),
      cooking: order.items.filter(item => item.kitchenStatus === 'cooking'),
      ready: order.items.filter(item => item.kitchenStatus === 'ready')
    };

    // Trả về thông tin order và summary
    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        itemsByStatus,
        summary: {
          pending: itemsByStatus.pending.length,
          sent: itemsByStatus.sent.length,
          cooking: itemsByStatus.cooking.length,
          ready: itemsByStatus.ready.length,
          total: order.items.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch kitchen status',
      error: error.message
    });
  }
};

/**
 * Controller lấy tất cả items đang chờ xử lý trong bếp
 * Lấy từ các orders có trạng thái 'sent_to_kitchen' hoặc 'cooking'
 * Chỉ lấy items chưa ready và chưa declined
 * Sắp xếp theo thời gian gửi đến bếp (cũ nhất trước)
 */
const getPendingItems = async (req, res) => {
  try {
    // Tìm tất cả orders đang được xử lý trong bếp
    const orders = await Order.find({
      status: { $in: ['sent_to_kitchen', 'cooking'] }
    })
      .populate('tableId', 'tableNumber floor type')
      .populate('supervisorId', 'name')
      .populate('items.menuItemId', 'name category');

    // Tạo mảng chứa tất cả items đang chờ xử lý
    const pendingItems = [];
    // Duyệt qua từng order
    orders.forEach(order => {
      // Duyệt qua từng item trong order
      order.items.forEach(item => {
        // Chỉ lấy items chưa ready và chưa declined
        if (!['ready', 'declined'].includes(item.kitchenStatus)) {
          pendingItems.push({
            orderId: order._id,
            orderNumber: order.orderNumber,
            table: order.tableId,
            supervisor: order.supervisorId,
            item: {
              id: item._id,
              name: item.name,
              quantity: item.quantity,
              note: item.note,
              status: item.kitchenStatus,
              sentAt: item.sentToKitchenAt,
              menuItemId: item.menuItemId?._id || item.menuItemId,
              category: item.menuItemId?.category || null
            }
          });
        }
      });
    });

    // Sắp xếp items theo thời gian gửi đến bếp (cũ nhất trước)
    pendingItems.sort((a, b) => {
      const timeA = a.item.sentAt ? new Date(a.item.sentAt).getTime() : 0;
      const timeB = b.item.sentAt ? new Date(b.item.sentAt).getTime() : 0;
      return timeA - timeB;
    });

    // Trả về danh sách items đang chờ xử lý
    res.status(200).json({
      success: true,
      count: pendingItems.length,
      data: pendingItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending items',
      error: error.message
    });
  }
};

/**
 * Controller cập nhật trạng thái của một item trong bếp
 * Chỉ cho phép cập nhật thành 'ready' hoặc 'declined'
 * Tự động cập nhật trạng thái order dựa trên trạng thái items
 */
const updateItemStatus = async (req, res) => {
  try {
    // Lấy orderId và itemId từ params
    const { orderId, itemId } = req.params;
    // Lấy status từ request body
    const { status } = req.body || {};
    // Chỉ cho phép 2 trạng thái: ready hoặc declined
    const allowedStatuses = ['ready', 'declined'];

    // Kiểm tra status có hợp lệ không
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Tìm order trong database
    const order = await Order.findById(orderId);

    // Kiểm tra order có tồn tại không
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Tìm item trong order
    const item = order.items.id(itemId);

    // Kiểm tra item có tồn tại không
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Order item not found'
      });
    }

    // Nếu item đã ở trạng thái này rồi, không cần cập nhật
    if (item.kitchenStatus === status) {
      return res.status(200).json({
        success: true,
        message: `Item already marked as ${status}`
      });
    }

    // Cập nhật trạng thái item
    item.kitchenStatus = status;

    // Ghi lại thời gian tương ứng với trạng thái
    if (status === 'ready') {
      item.readyAt = new Date();
    } else if (status === 'declined') {
      item.declinedAt = new Date();
    }

    // Cập nhật trạng thái order dựa trên trạng thái items
    updateOrderStatusFromItems(order);
    // Lưu order vào database
    await order.save();

    // Trả về kết quả thành công
    res.status(200).json({
      success: true,
      message: `Item marked as ${status}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update item status',
      error: error.message
    });
  }
};

module.exports = {
  sendToKitchen,
  getKitchenStatus,
  getPendingItems,
  updateItemStatus
};
