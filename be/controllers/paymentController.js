const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Table = require('../models/Table');
const crypto = require('crypto');
const https = require('https');

const populateOrder = (order) => {
  return Order.findById(order._id)
    .populate('tableId', 'tableNumber floor type')
    .populate('supervisorId', 'name username')
    .populate('items.menuItemId', 'name category price');
};

const getPaymentSummaryFromKitchenStatus = (order) => {
  const items = order.items || [];
  const pendingCount = items.filter((item) => item.kitchenStatus === 'pending').length;
  const sentCount = items.filter((item) => item.kitchenStatus === 'sent').length;
  const cookingCount = items.filter((item) => item.kitchenStatus === 'cooking').length;
  const readyItems = items.filter((item) => item.kitchenStatus === 'ready');

  const subtotal = readyItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  let discountAmount = 0;
  if (order.discountType === 'percent') {
    const percent = Math.max(0, Math.min(100, Number(order.discountValue) || 0));
    discountAmount = Math.round((subtotal * percent / 100) * 100) / 100;
  } else if (order.discountType === 'amount') {
    discountAmount = Math.max(0, Math.min(subtotal, Number(order.discountValue) || 0));
  }
  const total = Math.max(0, subtotal - discountAmount);

  return {
    pendingCount,
    sentCount,
    cookingCount,
    readyCount: readyItems.length,
    subtotal,
    discountAmount,
    total
  };
};

const MOMO_DEFAULT_USD_TO_VND_RATE = 26334.99;
const getMomoAmountMultiplier = () => {
  // Ưu tiên cấu hình MOMO_AMOUNT_MULTIPLIER; nếu chưa có thì fallback tỷ giá USD->VND cố định.
  const configured = process.env.MOMO_AMOUNT_MULTIPLIER;
  const value = Number(configured || MOMO_DEFAULT_USD_TO_VND_RATE);
  return Number.isFinite(value) && value > 0 ? value : NaN;
};

const isValidHttpsUrl = (value) => {
  if (!value || typeof value !== 'string') return false;
  if (value.includes('<') || value.includes('>')) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

const hmacSha256Hex = (secret, raw) => {
  return crypto.createHmac('sha256', secret).update(raw).digest('hex');
};

const postJson = (urlString, body, timeoutMs = 30000) => {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const payload = JSON.stringify(body);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        port: url.port || 443,
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: timeoutMs
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({ statusCode: res.statusCode, data: parsed });
          } catch (e) {
            reject(new Error('Invalid JSON response from MoMo'));
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('MoMo request timeout'));
    });
    req.on('error', (err) => reject(err));
    req.write(payload);
    req.end();
  });
};

const buildMomoCreateRawSignature = ({
  accessKey,
  amount,
  extraData,
  ipnUrl,
  orderId,
  orderInfo,
  partnerCode,
  redirectUrl,
  requestId,
  requestType
}) => {
  return `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
};

const buildMomoIpnRawSignature = ({
  amount,
  extraData,
  message,
  orderId,
  orderInfo,
  orderType,
  partnerCode,
  payType,
  requestId,
  responseTime,
  resultCode,
  transId
}) => {
  return `partnerCode=${partnerCode}&orderId=${orderId}&requestId=${requestId}&amount=${amount}&orderInfo=${orderInfo}&orderType=${orderType}&transId=${transId}&resultCode=${resultCode}&message=${message}&payType=${payType}&responseTime=${responseTime}&extraData=${extraData}`;
};

const processPayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.supervisorId.toString() !== req.supervisor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    if (order.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order already paid'
      });
    }

    if (!order.items || order.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order has no items'
      });
    }

    const paymentSummary = getPaymentSummaryFromKitchenStatus(order);
    if (paymentSummary.pendingCount > 0 || paymentSummary.sentCount > 0 || paymentSummary.cookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot process payment while some items are not completed in kitchen'
      });
    }
    if (paymentSummary.readyCount === 0 || paymentSummary.total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No payable items. Only ready items can be charged'
      });
    }

    order.subtotal = paymentSummary.subtotal;
    order.discountAmount = paymentSummary.discountAmount;
    order.total = paymentSummary.total;
    const invoiceNumber = await Payment.generateInvoiceNumber();

    const payment = await Payment.create({
      orderId: order._id,
      invoiceNumber,
      supervisorId: req.supervisor._id,
      paymentMethod,
      status: 'paid',
      amount: paymentSummary.total,
      discountType: order.discountType,
      discountValue: order.discountValue,
      discountAmount: paymentSummary.discountAmount,
      paidAt: new Date()
    });

    order.status = 'paid';
    order.paymentMethod = paymentMethod;
    order.paidAt = new Date();
    await order.save();

    const table = await Table.findById(order.tableId);
    if (table && table.currentOrderId && table.currentOrderId.toString() === order._id.toString()) {
      const updateData = { currentOrderId: null };
      if (table.status === 'occupied') {
        updateData.status = 'available';
      }
      await Table.findByIdAndUpdate(order.tableId, updateData);
    }

    const updatedOrder = await populateOrder(order);

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        order: updatedOrder,
        payment: {
          invoiceNumber: payment.invoiceNumber,
          paymentMethod: payment.paymentMethod,
          amount: payment.amount,
          discountType: payment.discountType,
          discountValue: payment.discountValue,
          discountAmount: payment.discountAmount,
          paidAt: payment.paidAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: error.message
    });
  }
};

const createMomoQrPayment = async (req, res) => {
  try {
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const redirectUrl = process.env.MOMO_REDIRECT_URL;
    const ipnUrl = process.env.MOMO_IPN_URL;
    const endpoint =
      process.env.MOMO_CREATE_ENDPOINT ||
      'https://test-payment.momo.vn/v2/gateway/api/create';
    const requestType = process.env.MOMO_REQUEST_TYPE || 'captureWallet';
    const multiplier = getMomoAmountMultiplier();

    if (!partnerCode || !accessKey || !secretKey || !redirectUrl || !ipnUrl) {
      return res.status(500).json({
        success: false,
        message:
          'MoMo configuration missing (MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY, MOMO_REDIRECT_URL, MOMO_IPN_URL)'
      });
    }
    if (!isValidHttpsUrl(redirectUrl) || !isValidHttpsUrl(ipnUrl)) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid MOMO_REDIRECT_URL or MOMO_IPN_URL. Use real HTTPS URLs and do not keep placeholder values.'
      });
    }

    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      return res.status(500).json({
        success: false,
        message: 'Invalid MOMO amount multiplier/rate'
      });
    }

    const order = await Order.findById(req.params.id).populate(
      'tableId',
      'tableNumber floor type'
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.supervisorId.toString() !== req.supervisor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    if (order.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order already paid'
      });
    }

    if (!order.items || order.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order has no items'
      });
    }

    const paymentSummary = getPaymentSummaryFromKitchenStatus(order);
    if (paymentSummary.pendingCount > 0 || paymentSummary.sentCount > 0 || paymentSummary.cookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create MoMo payment while some items are not completed in kitchen'
      });
    }
    if (paymentSummary.readyCount === 0 || paymentSummary.total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No payable items. Only ready items can be charged'
      });
    }

    const amountInternal = paymentSummary.total;
    const amountProvider = Math.round(amountInternal * multiplier);
    if (!Number.isFinite(amountProvider) || amountProvider <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount for MoMo'
      });
    }

    const momoOrderId =
      'PO' + Date.now().toString() + crypto.randomBytes(8).toString('hex');
    const momoRequestId = crypto.randomUUID
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString('hex');

    const extraData = Buffer.from(
      JSON.stringify({
        orderDbId: order._id.toString(),
        supervisorId: req.supervisor._id.toString()
      })
    ).toString('base64');

    const orderInfoParts = ['Pizza Order', order.orderNumber];
    if (order.tableId?.tableNumber !== undefined && order.tableId?.type) {
      orderInfoParts.push(
        order.tableId.type === 'pizza_bar'
          ? 'Pizza Bar'
          : `Table ${order.tableId.tableNumber}`
      );
    }
    const orderInfo = orderInfoParts.join(' - ');

    const rawSignature = buildMomoCreateRawSignature({
      accessKey,
      amount: String(amountProvider),
      extraData,
      ipnUrl,
      orderId: momoOrderId,
      orderInfo,
      partnerCode,
      redirectUrl,
      requestId: momoRequestId,
      requestType
    });
    const signature = hmacSha256Hex(secretKey, rawSignature);

    const momoPayload = {
      partnerCode,
      accessKey,
      requestId: momoRequestId,
      amount: String(amountProvider),
      orderId: momoOrderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi'
    };

    let payment = await Payment.findOne({ orderId: order._id });
    if (payment && payment.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order already paid'
      });
    }

    const momoResp = await postJson(endpoint, momoPayload, 30000);
    const respData = momoResp.data || {};

    if (momoResp.statusCode < 200 || momoResp.statusCode >= 300) {
      const status = momoResp.statusCode;
      return res.status(status >= 500 ? 502 : 400).json({
        success: false,
        message:
          respData.message ||
          `MoMo create payment failed (HTTP ${status})`,
        data: respData
      });
    }

    if (respData.resultCode !== 0) {
      return res.status(400).json({
        success: false,
        message: respData.message || 'MoMo create payment failed',
        data: respData
      });
    }

    const invoiceNumber = payment?.invoiceNumber || (await Payment.generateInvoiceNumber());
    if (!payment) {
      payment = await Payment.create({
        orderId: order._id,
        invoiceNumber,
        supervisorId: req.supervisor._id,
        paymentMethod: 'momo',
        status: 'pending',
        amount: amountInternal,
        providerAmount: amountProvider,
        discountType: order.discountType,
        discountValue: order.discountValue,
        discountAmount: paymentSummary.discountAmount,
        paidAt: null,
        momo: {
          partnerCode,
          orderId: momoOrderId,
          requestId: momoRequestId,
          payUrl: respData.payUrl || null,
          deeplink: respData.deeplink || null,
          qrCodeUrl: respData.qrCodeUrl || null,
          responseTime: respData.responseTime || null,
          extraData: respData.extraData || extraData,
          signature: null
        }
      });
    } else {
      payment.supervisorId = req.supervisor._id;
      payment.paymentMethod = 'momo';
      payment.status = 'pending';
      payment.amount = amountInternal;
      payment.providerAmount = amountProvider;
      payment.discountType = order.discountType;
      payment.discountValue = order.discountValue;
      payment.discountAmount = paymentSummary.discountAmount;
      payment.paidAt = null;
      payment.momo = {
        partnerCode,
        orderId: momoOrderId,
        requestId: momoRequestId,
        transId: null,
        resultCode: null,
        message: null,
        payUrl: respData.payUrl || null,
        deeplink: respData.deeplink || null,
        qrCodeUrl: respData.qrCodeUrl || null,
        responseTime: respData.responseTime || null,
        extraData: respData.extraData || extraData,
        signature: null
      };
      await payment.save();
    }

    res.status(200).json({
      success: true,
      message: 'MoMo payment created',
      data: {
        orderId: momoOrderId,
        requestId: momoRequestId,
        amount: amountProvider,
        payUrl: respData.payUrl || null,
        deeplink: respData.deeplink || null,
        qrCodeUrl: respData.qrCodeUrl || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create MoMo payment',
      error: error.message
    });
  }
};

const momoIpn = async (req, res) => {
  try {
    const secretKey = process.env.MOMO_SECRET_KEY;
    const partnerCodeEnv = process.env.MOMO_PARTNER_CODE;
    if (!secretKey || !partnerCodeEnv) {
      return res.status(500).json({ resultCode: 1, message: 'Config missing' });
    }

    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature
    } = req.body || {};

    if (!partnerCode || !orderId || !requestId || !amount || signature === undefined) {
      return res.status(400).json({ resultCode: 1, message: 'Invalid IPN payload' });
    }

    if (partnerCode !== partnerCodeEnv) {
      return res.status(400).json({ resultCode: 1, message: 'Invalid partnerCode' });
    }

    const raw = buildMomoIpnRawSignature({
      amount: String(amount || ''),
      extraData: String(extraData || ''),
      message: String(message || ''),
      orderId: String(orderId || ''),
      orderInfo: String(orderInfo || ''),
      orderType: String(orderType || ''),
      partnerCode: String(partnerCode || ''),
      payType: String(payType || ''),
      requestId: String(requestId || ''),
      responseTime: String(responseTime || ''),
      resultCode: String(resultCode ?? ''),
      transId: String(transId ?? '')
    });

    const expected = hmacSha256Hex(secretKey, raw);
    if (expected !== signature) {
      return res.status(400).json({ resultCode: 1, message: 'Invalid signature' });
    }

    const payment = await Payment.findOne({ paymentMethod: 'momo', 'momo.orderId': orderId });
    if (!payment) {
      return res.status(200).json({ resultCode: 0, message: 'OK' });
    }

    if (payment.status === 'paid') {
      return res.status(200).json({ resultCode: 0, message: 'OK' });
    }

    if (payment.providerAmount !== null && String(payment.providerAmount) !== String(amount)) {
      payment.status = 'failed';
      payment.momo = { ...(payment.momo || {}), resultCode, message, transId, signature };
      await payment.save();
      return res.status(400).json({ resultCode: 1, message: 'Amount mismatch' });
    }

    payment.momo = {
      ...(payment.momo || {}),
      requestId,
      transId: transId ?? null,
      resultCode: resultCode ?? null,
      message: message ?? null,
      responseTime: responseTime ?? null,
      extraData: extraData ?? null,
      signature
    };

    if (Number(resultCode) === 0) {
      const order = await Order.findById(payment.orderId);
      if (!order) {
        payment.status = 'failed';
        await payment.save();
        return res.status(200).json({ resultCode: 0, message: 'OK' });
      }

      const paymentSummary = getPaymentSummaryFromKitchenStatus(order);
      if (paymentSummary.pendingCount > 0 || paymentSummary.sentCount > 0 || paymentSummary.cookingCount > 0) {
        payment.status = 'failed';
        await payment.save();
        return res.status(400).json({ resultCode: 1, message: 'Order items not completed' });
      }
      if (paymentSummary.readyCount === 0 || paymentSummary.total <= 0) {
        payment.status = 'failed';
        await payment.save();
        return res.status(400).json({ resultCode: 1, message: 'No payable items' });
      }

      const multiplier = getMomoAmountMultiplier();
      const expectedAmount = Math.round(paymentSummary.total * multiplier);
      if (String(expectedAmount) !== String(amount)) {
        payment.status = 'failed';
        await payment.save();
        return res.status(400).json({ resultCode: 1, message: 'Order total mismatch' });
      }

      order.subtotal = paymentSummary.subtotal;
      order.discountAmount = paymentSummary.discountAmount;
      order.total = paymentSummary.total;
      payment.status = 'paid';
      payment.paymentMethod = 'momo';
      payment.paidAt = new Date();
      payment.amount = paymentSummary.total;
      payment.discountAmount = paymentSummary.discountAmount;
      await payment.save();

      order.status = 'paid';
      order.paymentMethod = 'momo';
      order.paidAt = new Date();
      await order.save();

      const table = await Table.findById(order.tableId);
      if (table && table.currentOrderId && table.currentOrderId.toString() === order._id.toString()) {
        const updateData = { currentOrderId: null };
        if (table.status === 'occupied') {
          updateData.status = 'available';
        }
        await Table.findByIdAndUpdate(order.tableId, updateData);
      }
    } else {
      payment.status = 'failed';
      await payment.save();
    }

    res.status(200).json({ resultCode: 0, message: 'OK' });
  } catch (error) {
    res.status(500).json({ resultCode: 1, message: error.message });
  }
};

const getMomoPaymentStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.supervisorId.toString() !== req.supervisor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    const payment = await Payment.findOne({ orderId: order._id, paymentMethod: 'momo' })
      .select('status paidAt momo providerAmount amount invoiceNumber')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        orderStatus: order.status,
        orderPaidAt: order.paidAt,
        payment: payment || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch MoMo payment status',
      error: error.message
    });
  }
};

const getInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('tableId', 'tableNumber floor type')
      .populate('supervisorId', 'name username')
      .populate('items.menuItemId', 'name category price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const payment = await Payment.findOne({ orderId: order._id });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Order not paid'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        invoice: {
          invoiceNumber: payment.invoiceNumber,
          orderNumber: order.orderNumber,
          table: order.tableId,
          supervisor: order.supervisorId,
          items: order.items,
          subtotal: order.subtotal,
          total: order.total,
          discount: {
            type: payment.discountType,
            value: payment.discountValue,
            amount: payment.discountAmount
          },
          paymentMethod: payment.paymentMethod,
          paidAt: payment.paidAt,
          createdAt: order.createdAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message
    });
  }
};

module.exports = {
  processPayment,
  createMomoQrPayment,
  momoIpn,
  getMomoPaymentStatus,
  getInvoice
};
