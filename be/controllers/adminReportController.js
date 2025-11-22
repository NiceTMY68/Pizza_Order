const Order = require('../models/Order');
const Payment = require('../models/Payment');
const MenuItem = require('../models/MenuItem');
const Supervisor = require('../models/Supervisor');
const Table = require('../models/Table');

/**
 * Báo cáo doanh thu với trends và comparison
 */
const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Calculate previous period for comparison
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - daysDiff - 1);
    const previousEnd = new Date(start);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousEnd.setHours(23, 59, 59, 999);

    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } };
        break;
      case 'month':
        dateFormat = { $dateToString: { format: '%Y-%m', date: '$paidAt' } };
        break;
      case 'year':
        dateFormat = { $dateToString: { format: '%Y', date: '$paidAt' } };
        break;
      default:
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } };
    }

    const revenueByDate = await Payment.aggregate([
      {
        $match: {
          paidAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: dateFormat,
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
      },
      { $sort: { _id: 1 } }
    ]);

    const totalStats = await Payment.aggregate([
      {
        $match: {
          paidAt: { $gte: start, $lte: end }
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
          count: { $sum: 1 },
          avgOrderValue: { $avg: '$amount' }
        }
      }
    ]);

    // Previous period stats
    const previousStats = await Payment.aggregate([
      {
        $match: {
          paidAt: { $gte: previousStart, $lte: previousEnd }
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

    const current = totalStats[0] || { totalRevenue: 0, count: 0, avgOrderValue: 0 };
    const previous = previousStats[0] || { totalRevenue: 0, count: 0 };
    const revenueChange = previous.totalRevenue > 0
      ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue * 100)
      : 0;
    const ordersChange = previous.count > 0
      ? ((current.count - previous.count) / previous.count * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        byDate: revenueByDate,
        total: current,
        comparison: {
          revenueChange: parseFloat(revenueChange.toFixed(2)),
          ordersChange: parseFloat(ordersChange.toFixed(2)),
          previousRevenue: previous.totalRevenue,
          previousOrders: previous.count
        },
        dateRange: { start, end },
        previousRange: { start: previousStart, end: previousEnd },
        groupBy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate revenue report',
      error: error.message
    });
  }
};

/**
 * Báo cáo món ăn với profitability analysis
 */
const getMenuItemReport = async (req, res) => {
  try {
    const { startDate, endDate, category, limit = 20 } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Filter by paidAt date (when order was actually paid) instead of createdAt
    const matchQuery = {
      paidAt: { 
        $exists: true,
        $ne: null,
        $gte: start, 
        $lte: end 
      },
      status: { $in: ['paid', 'completed'] }
    };

    const itemsReport = await Order.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItemId',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          orderCount: { $addToSet: '$_id' },
          avgQuantity: { $avg: '$items.quantity' }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          avgQuantity: 1,
          orderCount: { $size: '$orderCount' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Populate menu item details
    const menuItemIds = itemsReport.map(item => item._id);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });
    const menuItemsMap = {};
    menuItems.forEach(item => {
      menuItemsMap[item._id.toString()] = item;
    });

    const enrichedReport = itemsReport.map(item => {
      const menuItem = menuItemsMap[item._id.toString()];
      const avgPrice = item.totalQuantity > 0 ? item.totalRevenue / item.totalQuantity : 0;
      return {
        ...item,
        category: menuItem?.category || 'unknown',
        price: menuItem?.price || 0,
        isAvailable: menuItem?.isAvailable || false,
        avgPrice: parseFloat(avgPrice.toFixed(2)),
        revenueShare: 0 // Will be calculated on frontend
      };
    });

    // Calculate revenue share
    const totalRevenue = enrichedReport.reduce((sum, item) => sum + item.totalRevenue, 0);
    enrichedReport.forEach(item => {
      item.revenueShare = totalRevenue > 0 ? parseFloat(((item.totalRevenue / totalRevenue) * 100).toFixed(2)) : 0;
    });

    res.status(200).json({
      success: true,
      data: {
        items: enrichedReport,
        summary: {
          totalItems: enrichedReport.length,
          totalRevenue,
          avgRevenuePerItem: totalRevenue > 0 ? parseFloat((totalRevenue / enrichedReport.length).toFixed(2)) : 0
        },
        dateRange: { start, end }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate menu item report',
      error: error.message
    });
  }
};

/**
 * Báo cáo supervisor với performance metrics
 */
const getSupervisorReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const supervisorStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$supervisorId',
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          paidOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          avgOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Populate supervisor details
    const supervisorIds = supervisorStats.map(stat => stat._id);
    const supervisors = await Supervisor.find({ _id: { $in: supervisorIds } });
    const supervisorsMap = {};
    supervisors.forEach(sup => {
      supervisorsMap[sup._id.toString()] = sup;
    });

    const enrichedStats = supervisorStats.map(stat => {
      const conversionRate = stat.orderCount > 0
        ? parseFloat(((stat.paidOrders / stat.orderCount) * 100).toFixed(2))
        : 0;
      const cancellationRate = stat.orderCount > 0
        ? parseFloat(((stat.cancelledOrders / stat.orderCount) * 100).toFixed(2))
        : 0;

      return {
        supervisor: {
          id: stat._id,
          name: supervisorsMap[stat._id.toString()]?.name || 'Unknown',
          username: supervisorsMap[stat._id.toString()]?.username || 'unknown'
        },
        orderCount: stat.orderCount,
        totalRevenue: stat.totalRevenue,
        paidOrders: stat.paidOrders,
        cancelledOrders: stat.cancelledOrders,
        avgOrderValue: parseFloat(stat.avgOrderValue.toFixed(2)),
        conversionRate,
        cancellationRate
      };
    });

    res.status(200).json({
      success: true,
      data: {
        supervisors: enrichedStats,
        dateRange: { start, end }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate supervisor report',
      error: error.message
    });
  }
};

/**
 * Operational metrics - AOV, frequency, table turnover
 */
const getOperationalMetrics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Average Order Value
    const aovStats = await Payment.aggregate([
      {
        $match: {
          paidAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$amount' },
          minOrderValue: { $min: '$amount' },
          maxOrderValue: { $max: '$amount' }
        }
      }
    ]);

    // Order frequency by day of week
    const dayOfWeekStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['paid', 'completed'] }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Hourly distribution
    const hourlyStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['paid', 'completed'] }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Table turnover
    const tableStats = await Table.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'tableId',
          as: 'orders'
        }
      },
      {
        $project: {
          tableNumber: 1,
          orderCount: { $size: '$orders' },
          totalRevenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$orders',
                    as: 'order',
                    cond: { $in: ['$$order.status', ['paid', 'completed']] }
                  }
                },
                as: 'order',
                in: '$$order.total'
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          avgOrdersPerTable: { $avg: '$orderCount' },
          totalTables: { $sum: 1 }
        }
      }
    ]);

    const aov = aovStats[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      minOrderValue: 0,
      maxOrderValue: 0
    };

    res.status(200).json({
      success: true,
      data: {
        averageOrderValue: {
          avg: parseFloat(aov.avgOrderValue.toFixed(2)),
          min: aov.minOrderValue,
          max: aov.maxOrderValue,
          totalOrders: aov.totalOrders,
          totalRevenue: aov.totalRevenue
        },
        dayOfWeekDistribution: dayOfWeekStats.map(stat => ({
          day: stat._id,
          dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][stat._id - 1],
          orderCount: stat.count,
          revenue: stat.totalRevenue
        })),
        hourlyDistribution: hourlyStats.map(stat => ({
          hour: stat._id,
          orderCount: stat.count,
          revenue: stat.totalRevenue
        })),
        tableMetrics: tableStats[0] || {
          avgOrdersPerTable: 0,
          totalTables: 0
        },
        dateRange: { start, end }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate operational metrics',
      error: error.message
    });
  }
};

/**
 * Financial health - margins, trends, payment method analysis
 */
const getFinancialHealth = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Payment method trends
    const paymentMethodStats = await Payment.aggregate([
      {
        $match: {
          paidAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          totalRevenue: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Order status breakdown
    const orderStatusStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);

    // Cancellation rate
    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });
    const cancelledOrders = await Order.countDocuments({
      createdAt: { $gte: start, $lte: end },
      status: 'cancelled'
    });
    const cancellationRate = totalOrders > 0
      ? parseFloat(((cancelledOrders / totalOrders) * 100).toFixed(2))
      : 0;

    // Conversion rate (draft to paid)
    const paidOrders = await Order.countDocuments({
      createdAt: { $gte: start, $lte: end },
      status: 'paid'
    });
    const conversionRate = totalOrders > 0
      ? parseFloat(((paidOrders / totalOrders) * 100).toFixed(2))
      : 0;

    res.status(200).json({
      success: true,
      data: {
        paymentMethods: paymentMethodStats.map(stat => ({
          method: stat._id,
          totalRevenue: stat.totalRevenue,
          count: stat.count,
          percentage: 0, // Will be calculated on frontend
          avgAmount: parseFloat(stat.avgAmount.toFixed(2))
        })),
        orderStatus: orderStatusStats,
        kpis: {
          cancellationRate,
          conversionRate,
          totalOrders,
          paidOrders,
          cancelledOrders
        },
        dateRange: { start, end }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial health report',
      error: error.message
    });
  }
};

module.exports = {
  getRevenueReport,
  getMenuItemReport,
  getSupervisorReport,
  getOperationalMetrics,
  getFinancialHealth
};
