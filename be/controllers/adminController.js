const Order = require('../models/Order');
const Payment = require('../models/Payment');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Supervisor = require('../models/Supervisor');

/**
 * Dashboard - Thống kê tổng quan (Today, This Week, This Month)
 */
const getDashboard = async (req, res) => {
  try {
    const { period = 'today', startDate, endDate } = req.query; // today, week, month, or custom date range
    
    let start, end, previousStart, previousEnd;
    const now = new Date();
    
    // If custom date range is provided, use it
    if (startDate && endDate) {
      // Parse date strings - MongoDB stores dates in UTC, so we need to handle timezone correctly
      // If date string is in format YYYY-MM-DD, create date at midnight UTC
      start = new Date(startDate);
      if (startDate.includes('T')) {
        // ISO string with time
        start = new Date(startDate);
      } else {
        // Date only - create at start of day in local timezone, then use as-is (MongoDB will compare correctly)
        start = new Date(startDate + 'T00:00:00');
      }
      start.setHours(0, 0, 0, 0);
      
      end = new Date(endDate);
      if (endDate.includes('T')) {
        end = new Date(endDate);
      } else {
        end = new Date(endDate + 'T23:59:59');
      }
      end.setHours(23, 59, 59, 999);
      
      // Calculate previous period (same duration)
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - daysDiff - 1);
      previousEnd = new Date(start);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousEnd.setHours(23, 59, 59, 999);
    } else if (period === 'today') {
      // Use UTC to avoid timezone issues
      const today = new Date(now.toISOString().split('T')[0] + 'T00:00:00.000Z');
      start = new Date(today);
      end = new Date(today);
      end.setUTCHours(23, 59, 59, 999);
      
      previousStart = new Date(start);
      previousStart.setUTCDate(previousStart.getUTCDate() - 1);
      previousEnd = new Date(end);
      previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
    } else if (period === 'week') {
      const dayOfWeek = now.getDay();
      const weekStartLocal = new Date(now);
      weekStartLocal.setDate(now.getDate() - dayOfWeek);
      weekStartLocal.setHours(0, 0, 0, 0);
      start = new Date(Date.UTC(weekStartLocal.getFullYear(), weekStartLocal.getMonth(), weekStartLocal.getDate(), 0, 0, 0, 0));
      
      const weekEndLocal = new Date(now);
      weekEndLocal.setHours(23, 59, 59, 999);
      end = new Date(Date.UTC(weekEndLocal.getFullYear(), weekEndLocal.getMonth(), weekEndLocal.getDate(), 23, 59, 59, 999));
      
      previousStart = new Date(start);
      previousStart.setUTCDate(previousStart.getUTCDate() - 7);
      previousEnd = new Date(start);
      previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
      previousEnd.setUTCHours(23, 59, 59, 999);
    } else { // month
      const monthStartLocal = new Date(now.getFullYear(), now.getMonth(), 1);
      start = new Date(Date.UTC(monthStartLocal.getFullYear(), monthStartLocal.getMonth(), monthStartLocal.getDate(), 0, 0, 0, 0));
      
      const monthEndLocal = new Date(now);
      monthEndLocal.setHours(23, 59, 59, 999);
      end = new Date(Date.UTC(monthEndLocal.getFullYear(), monthEndLocal.getMonth(), monthEndLocal.getDate(), 23, 59, 59, 999));
      
      const prevMonthStartLocal = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousStart = new Date(Date.UTC(prevMonthStartLocal.getFullYear(), prevMonthStartLocal.getMonth(), prevMonthStartLocal.getDate(), 0, 0, 0, 0));
      
      const prevMonthEndLocal = new Date(now.getFullYear(), now.getMonth(), 0);
      previousEnd = new Date(Date.UTC(prevMonthEndLocal.getFullYear(), prevMonthEndLocal.getMonth(), prevMonthEndLocal.getDate(), 23, 59, 59, 999));
    }

    // Revenue statistics - Query all payments in date range
    // Ensure we're comparing dates correctly (MongoDB stores dates in UTC)
    const revenueStats = await Payment.aggregate([
      {
        $match: {
          paidAt: { 
            $exists: true,
            $ne: null,
            $gte: start, 
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          cashRevenue: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$amount', 0] }
          },
          cardRevenue: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'card'] }, '$amount', 0] }
          },
          bankRevenue: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'bank'] }, '$amount', 0] }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Debug: Get sample payments to verify query
    const samplePayments = await Payment.find({
      paidAt: { 
        $exists: true,
        $ne: null,
        $gte: start, 
        $lte: end
      }
    })
    .select('paidAt amount paymentMethod invoiceNumber')
    .sort({ paidAt: -1 })
    .limit(10)
    .lean();

    // Count all payments in range for verification
    const paymentCountInRange = await Payment.countDocuments({
      paidAt: { 
        $exists: true,
        $ne: null,
        $gte: start, 
        $lte: end
      }
    });

    console.log('Dashboard Query Debug:', {
      period,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
        startLocal: start.toString(),
        endLocal: end.toString()
      },
      queryResult: {
        revenueStatsFound: revenueStats.length,
        revenue: revenueStats[0]?.totalRevenue || 0,
        count: revenueStats[0]?.count || 0,
        paymentCountInRange
      },
      samplePayments: samplePayments.map(p => ({
        paidAt: p.paidAt?.toISOString(),
        paidAtLocal: p.paidAt?.toString(),
        amount: p.amount,
        method: p.paymentMethod,
        invoice: p.invoiceNumber
      })),
      databaseStats: {
        totalPayments: await Payment.countDocuments({}),
        paymentsWithPaidAt: await Payment.countDocuments({ paidAt: { $exists: true, $ne: null } })
      }
    });

    // Order statistics
    const orderStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Top selling items
    const topItems = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['paid', 'completed'] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItemId',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    // Table status
    const tableStatus = await Table.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Active tables count
    const activeTables = await Table.countDocuments({ status: 'occupied' });

    // Previous period revenue for comparison
    const previousRevenueStats = await Payment.aggregate([
      {
        $match: {
          paidAt: { 
            $exists: true,
            $ne: null,
            $gte: previousStart, 
            $lte: previousEnd 
          }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const previousRevenue = previousRevenueStats[0]?.totalRevenue || 0;
    const currentRevenue = revenueStats[0]?.totalRevenue || 0;
    const revenueChange = previousRevenue > 0 
      ? parseFloat(((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1))
      : (previousRevenue === 0 && currentRevenue > 0 ? 100 : 0);

    // Previous period orders for comparison
    const previousOrderStats = await Order.countDocuments({
      createdAt: { $gte: previousStart, $lte: previousEnd }
    });
    const currentOrders = orderStats.reduce((sum, stat) => sum + stat.count, 0);
    const ordersChange = previousOrderStats > 0
      ? parseFloat(((currentOrders - previousOrderStats) / previousOrderStats * 100).toFixed(1))
      : (previousOrderStats === 0 && currentOrders > 0 ? 100 : 0);

    // Recent orders (last 10)
    const recentOrders = await Order.find()
      .populate('tableId', 'tableNumber')
      .populate('supervisorId', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber tableId supervisorId status total createdAt');

    res.status(200).json({
      success: true,
      data: {
        period,
        revenue: revenueStats[0] || {
          totalRevenue: 0,
          cashRevenue: 0,
          cardRevenue: 0,
          bankRevenue: 0,
          count: 0
        },
        revenueChange: parseFloat(revenueChange),
        orders: {
          byStatus: orderStats,
          total: currentOrders
        },
        ordersChange: parseFloat(ordersChange),
        topItems,
        tables: {
          byStatus: tableStatus,
          active: activeTables || 0,
          total: await Table.countDocuments() || 0
        },
        recentOrders,
        dateRange: {
          start,
          end
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

module.exports = {
  getDashboard
};

