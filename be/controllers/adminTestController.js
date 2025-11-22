const Payment = require('../models/Payment');

/**
 * Test endpoint to check payments data
 * GET /api/admin/test/payments
 */
const testPayments = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.paidAt = { $gte: start, $lte: end };
    }

    // Get all payments
    const allPayments = await Payment.find(query)
      .sort({ paidAt: -1 })
      .limit(50)
      .select('paidAt amount paymentMethod invoiceNumber')
      .lean();

    // Count total
    const totalCount = await Payment.countDocuments(query);
    const withPaidAt = await Payment.countDocuments({ ...query, paidAt: { $exists: true, $ne: null } });

    // Get date range info
    const firstPayment = await Payment.findOne().sort({ paidAt: 1 }).select('paidAt').lean();
    const lastPayment = await Payment.findOne().sort({ paidAt: -1 }).select('paidAt').lean();

    res.status(200).json({
      success: true,
      data: {
        totalPayments: totalCount,
        paymentsWithPaidAt: withPaidAt,
        samplePayments: allPayments.map(p => ({
          paidAt: p.paidAt,
          paidAtISO: p.paidAt ? p.paidAt.toISOString() : null,
          amount: p.amount,
          paymentMethod: p.paymentMethod,
          invoiceNumber: p.invoiceNumber
        })),
        dateRange: {
          first: firstPayment?.paidAt || null,
          last: lastPayment?.paidAt || null
        },
        query: query
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to test payments',
      error: error.message
    });
  }
};

module.exports = {
  testPayments
};

