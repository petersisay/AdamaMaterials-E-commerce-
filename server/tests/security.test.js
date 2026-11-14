process.env.NODE_ENV = 'test';
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env.example') }); // Use example defaults

const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const crypto = require('crypto');
const app = require('../src/app');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');
const Payout = require('../src/models/Payout');
const Delivery = require('../src/models/Delivery');
const Notification = require('../src/models/Notification');
const Category = require('../src/models/Category');
const MaterialType = require('../src/models/MaterialType');
const Cart = require('../src/models/Cart');
const { MongoMemoryServer } = require('mongodb-memory-server');

let server, serverUrl, mongoServer;

const startServer = () =>
  new Promise((resolve) => {
    server = app.listen(0, () => {
      serverUrl = `http://localhost:${server.address().port}/api/v1`;
      resolve();
    });
  });

const closeAll = async () => {
  if (server) server.close();
  await mongoose.connection.close();
  if (mongoServer) await mongoServer.stop();
};

const api = async (method, path, body, cookie, extraHeaders = {}) => {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }), ...extraHeaders },
    ...(body && { body: JSON.stringify(body) }),
  };
  const res = await fetch(`${serverUrl}${path}`, opts);
  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data, headers: res.headers };
};

const login = async (email, password = 'Password123') => {
  const res = await api('POST', '/auth/login', { email, password });
  assert.strictEqual(res.status, 200, `Login failed for ${email}: ${JSON.stringify(res.data)}`);
  return res.headers.get('set-cookie')?.split(';')[0] || '';
};

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Full Integration Test Suite', () => {
  // Cookies
  let adminCookie, buyerCookie, buyer2Cookie, sellerCookie, seller2Cookie;
  let staffFinanceCookie, staffLogisticsCookie;

  // IDs
  let categoryId, materialTypeId;
  let seller1Id, seller2Id, buyerId;
  let product1Id, product2Id; // product1 = seller1, product2 = seller2
  let orderId, paymentId, deliveryId;
  let payout1Id, payout2Id;

  test.before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Clear all collections
    await Promise.all([
      User.deleteMany({}), Product.deleteMany({}), Order.deleteMany({}),
      Payment.deleteMany({}), Payout.deleteMany({}), Delivery.deleteMany({}),
      Cart.deleteMany({}), Category.deleteMany({}), MaterialType.deleteMany({}),
    ]);

    await startServer();

    // Seed reference data
    const cat = await Category.create({ name: 'Test Category', description: 'Test' });
    categoryId = cat._id.toString();
    const mat = await MaterialType.create({ name: 'Test Material', description: 'Test' });
    materialTypeId = mat._id.toString();

    // Create users
    const admin = await User.create({ name: 'Test Admin', email: 'admin@test.com', password: 'Password123', role: 'ADMIN', isActive: true });
    const buyer = await User.create({ name: 'Test Buyer', email: 'buyer@test.com', password: 'Password123', role: 'BUYER', isActive: true });
    const buyer2 = await User.create({ name: 'Buyer Two', email: 'buyer2@test.com', password: 'Password123', role: 'BUYER', isActive: true });
    const seller = await User.create({ name: 'Test Seller 1', email: 'seller1@test.com', password: 'Password123', role: 'SELLER', isSellerApproved: true, isActive: true });
    const seller2 = await User.create({ name: 'Test Seller 2', email: 'seller2@test.com', password: 'Password123', role: 'SELLER', isSellerApproved: true, isActive: true });
    const staffFin = await User.create({ name: 'Staff Finance', email: 'stafff@test.com', password: 'Password123', role: 'STAFF', staffPermissions: ['VIEW_ORDERS', 'VERIFY_PAYMENTS', 'VIEW_SELLER_PAYOUTS', 'PROCESS_PAYOUTS'], isActive: true });
    const staffLog = await User.create({ name: 'Staff Logistics', email: 'staffl@test.com', password: 'Password123', role: 'STAFF', staffPermissions: ['MANAGE_DELIVERIES', 'SET_DELIVERY_FEES', 'VIEW_ORDERS'], isActive: true });

    buyerId = buyer._id.toString();
    seller1Id = seller._id.toString();
    seller2Id = seller2._id.toString();

    // Login all users
    adminCookie        = await login('admin@test.com');
    buyerCookie        = await login('buyer@test.com');
    buyer2Cookie       = await login('buyer2@test.com');
    sellerCookie       = await login('seller1@test.com');
    seller2Cookie      = await login('seller2@test.com');
    staffFinanceCookie = await login('stafff@test.com');
    staffLogisticsCookie = await login('staffl@test.com');

    // Create two products by two different sellers
    const p1 = await Product.create({
      name: 'Copper Wire Scrap', description: 'Reusable copper', price: 500, quantity: 10,
      category: categoryId, materialType: materialTypeId, condition: 'Good',
      seller: seller._id, approvalStatus: 'APPROVED', status: 'ACTIVE',
      images: ['http://localhost:5000/uploads/test1.jpg'],
    });
    const p2 = await Product.create({
      name: 'Plastic Sheets', description: 'Recyclable plastic', price: 300, quantity: 5,
      category: categoryId, materialType: materialTypeId, condition: 'Fair',
      seller: seller2._id, approvalStatus: 'APPROVED', status: 'ACTIVE',
      images: ['http://localhost:5000/uploads/test2.jpg'],
    });
    product1Id = p1._id.toString();
    product2Id = p2._id.toString();
  });

  test.after(closeAll);

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 1: Ownership & Authorization
  // ────────────────────────────────────────────────────────────────────────────

  test('Auth: Unauthenticated request is rejected', async () => {
    const res = await api('GET', '/admin/dashboard-stats');
    assert.strictEqual(res.status, 401);
  });

  test('Auth: Buyer cannot access admin dashboard', async () => {
    const res = await api('GET', '/admin/dashboard-stats', null, buyerCookie);
    assert.strictEqual(res.status, 403);
  });

  test('Auth: Staff cannot access admin-only audit logs', async () => {
    const res = await api('GET', '/admin/audit-logs', null, staffFinanceCookie);
    assert.strictEqual(res.status, 403);
  });

  test('Auth: Staff with wrong permission cannot verify payments', async () => {
    // staffLogisticsCookie has MANAGE_DELIVERIES but NOT VERIFY_PAYMENTS
    const res = await api('POST', '/payments/verify-manual', { paymentId: 'fake', status: 'PAID' }, staffLogisticsCookie);
    assert.strictEqual(res.status, 403, 'Staff without VERIFY_PAYMENTS must be blocked');
  });

  test('Auth: Staff with wrong permission cannot set delivery fees', async () => {
    // staffFinanceCookie does not have SET_DELIVERY_FEES
    const res = await api('POST', '/deliveries/set-fee', { deliveryId: 'fake', fee: 100 }, staffFinanceCookie);
    assert.strictEqual(res.status, 403, 'Staff without SET_DELIVERY_FEES must be blocked');
  });

  test('Auth: Admin can access admin dashboard', async () => {
    const res = await api('GET', '/admin/dashboard-stats', null, adminCookie);
    assert.strictEqual(res.status, 200);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 2: Product Approval & Catalog Visibility
  // ────────────────────────────────────────────────────────────────────────────

  test('Products: Draft products are hidden from public catalog', async () => {
    const createRes = await api('POST', '/products', {
      name: 'Draft Product', description: 'Should not appear publicly', price: 100,
      quantity: 1, category: categoryId, materialType: materialTypeId, condition: 'Good',
      images: ['http://localhost:5000/uploads/draft.jpg'],
    }, sellerCookie);
    assert.strictEqual(createRes.status, 201);
    const draftId = createRes.data.product._id;

    const catalog = await api('GET', '/products');
    const found = catalog.data.products?.some(p => p._id === draftId);
    assert.strictEqual(found, false, 'Draft product must not appear in public catalog');
  });

  test('Products: Seller cannot approve their own product', async () => {
    const createRes = await api('POST', '/products', {
      name: 'Self-Approve Test', description: 'Attempt', price: 50,
      quantity: 1, category: categoryId, materialType: materialTypeId, condition: 'Good',
      images: ['http://localhost:5000/uploads/self.jpg'],
    }, sellerCookie);
    const pid = createRes.data.product._id;
    await api('POST', `/products/${pid}/submit`, null, sellerCookie);

    const res = await api('POST', '/admin/products/review', { productId: pid, status: 'APPROVED' }, sellerCookie);
    assert.strictEqual(res.status, 403);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 3: Checkout — Inventory & Multi-Seller Order
  // ────────────────────────────────────────────────────────────────────────────

  test('Checkout: Non-CHAPA payment methods (MOCK, BANK_TRANSFER, TELEBIRR, INVALID) are rejected', async () => {
    // Clear any leftover cart items
    await api('POST', '/cart/clear', null, buyerCookie);
    await api('POST', '/cart/add', { productId: product1Id, quantity: 1 }, buyerCookie);

    for (const invalidMethod of ['INVALID_GATEWAY', 'MOCK', 'BANK_TRANSFER', 'TELEBIRR']) {
      const res = await api('POST', '/orders/checkout', {
        paymentMethod: invalidMethod,
        deliveryAddress: { streetAddress: '1 Test St', city: 'Adama', subCity: 'Test', phoneNumber: '0911000000', latitude: 8.541, longitude: 39.271 },
      }, buyerCookie);
      assert.strictEqual(res.status, 400, `Payment method ${invalidMethod} must be rejected`);
      assert.ok(res.data.message.toLowerCase().includes('invalid payment method'), `Message should mention invalid method for ${invalidMethod}`);
    }
  });

  test('Checkout: Creates multi-seller order with per-seller payouts using CHAPA', async () => {
    // Clear cart and add items from two different sellers
    await api('POST', '/cart/clear', null, buyerCookie);
    await api('POST', '/cart/add', { productId: product1Id, quantity: 2 }, buyerCookie);
    await api('POST', '/cart/add', { productId: product2Id, quantity: 1 }, buyerCookie);

    const res = await api('POST', '/orders/checkout', {
      paymentMethod: 'CHAPA',
      deliveryAddress: { streetAddress: '1 Test St', city: 'Adama', subCity: 'Bole', phoneNumber: '0911000000', latitude: 8.541, longitude: 39.271 },
    }, buyerCookie);

    assert.strictEqual(res.status, 201, `Checkout failed: ${JSON.stringify(res.data)}`);
    assert.ok(res.data.order, 'Order must be in response');
    orderId = res.data.order._id;

    // Verify per-seller payouts were created
    const payouts = await Payout.find({ order: orderId });
    assert.strictEqual(payouts.length, 2, 'Two payouts must be created — one per seller');

    const sellerIds = payouts.map(p => p.seller.toString());
    assert.ok(sellerIds.includes(seller1Id), 'Payout for seller1 must exist');
    assert.ok(sellerIds.includes(seller2Id), 'Payout for seller2 must exist');

    // All payouts must start as PENDING (not ELIGIBLE yet)
    payouts.forEach(p => {
      assert.strictEqual(p.status, 'PENDING', 'Payout must be PENDING at checkout');
    });

    payout1Id = payouts.find(p => p.seller.toString() === seller1Id)?._id.toString();
    payout2Id = payouts.find(p => p.seller.toString() === seller2Id)?._id.toString();
  });

  test('Checkout: Stock is decremented after checkout', async () => {
    const p1 = await Product.findById(product1Id);
    const p2 = await Product.findById(product2Id);
    assert.strictEqual(p1.quantity, 8, 'product1 stock must decrease by 2');
    assert.strictEqual(p2.quantity, 4, 'product2 stock must decrease by 1');
  });

  test('Checkout: Buyer cannot exceed available stock', async () => {
    await api('POST', '/cart/clear', null, buyer2Cookie);
    // Try to buy more than available (product2 has 4 left)
    await api('POST', '/cart/add', { productId: product2Id, quantity: 5 }, buyer2Cookie);
    const res = await api('POST', '/orders/checkout', {
      paymentMethod: 'CHAPA',
      deliveryAddress: { streetAddress: '2 Test Ave', city: 'Adama', subCity: 'Test', phoneNumber: '0911000000', latitude: 8.541, longitude: 39.271 },
    }, buyer2Cookie);
    assert.strictEqual(res.status, 400, 'Overselling must be prevented');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 4: Ownership Authorization on Orders
  // ────────────────────────────────────────────────────────────────────────────

  test('Orders: Buyer cannot view another buyer\'s order', async () => {
    const res = await api('GET', `/orders/${orderId}`, null, buyer2Cookie);
    assert.strictEqual(res.status, 403);
  });

  test('Orders: Seller can view order containing their product', async () => {
    const res = await api('GET', `/orders/${orderId}`, null, sellerCookie);
    assert.strictEqual(res.status, 200);
  });

  test('Orders: Staff can view any order', async () => {
    const res = await api('GET', `/orders/${orderId}`, null, staffFinanceCookie);
    assert.strictEqual(res.status, 200);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 5: Payment Processing
  // ────────────────────────────────────────────────────────────────────────────

  test('Payment: Mock webhook processes payment and confirms order', async () => {
    // Find the payment record
    const payment = await Payment.findOne({ order: orderId });
    assert.ok(payment, 'Payment record must exist');
    paymentId = payment._id.toString();

    const res = await api('POST', `/payments/webhook/mock`, {
      tx_ref: payment.transactionId,
      status: 'success',
    });
    assert.strictEqual(res.status, 200, `Webhook failed: ${JSON.stringify(res.data)}`);

    const updated = await Payment.findById(paymentId);
    assert.strictEqual(updated.status, 'PAID', 'Payment must be marked PAID after webhook');

    const order = await Order.findById(orderId);
    assert.strictEqual(order.orderStatus, 'CONFIRMED', 'Order must be CONFIRMED after payment');
  });

  test('Payment: Webhook is idempotent (duplicate call is ignored)', async () => {
    const payment = await Payment.findById(paymentId);
    const res = await api('POST', `/payments/webhook/mock`, {
      tx_ref: payment.transactionId,
      status: 'success',
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.message?.includes('Already processed'), 'Duplicate webhook must be idempotent');
  });

  test('Payment: Payouts remain PENDING (not eligible) before delivery', async () => {
    const payouts = await Payout.find({ order: orderId });
    payouts.forEach(p => {
      assert.strictEqual(p.status, 'PENDING', 'Payouts must stay PENDING until delivery');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 6: Delivery Workflow
  // ────────────────────────────────────────────────────────────────────────────

  test('Delivery: Record is created after payment confirmation', async () => {
    const delivery = await Delivery.findOne({ order: orderId });
    assert.ok(delivery, 'Delivery record must be auto-created after payment');
    deliveryId = delivery._id.toString();
  });

  test('Delivery: Staff with SET_DELIVERY_FEES can set delivery fee', async () => {
    const res = await api('POST', '/deliveries/set-fee', {
      deliveryId,
      fee: 150,
    }, staffLogisticsCookie);
    assert.strictEqual(res.status, 200, `Set fee failed: ${JSON.stringify(res.data)}`);

    const order = await Order.findById(orderId);
    assert.strictEqual(order.deliveryFee, 150, 'Delivery fee must update order');
  });

  test('Delivery: Staff updates status to DELIVERED — payouts become ELIGIBLE', async () => {
    // Assign delivery first
    await api('POST', '/deliveries/assign', {
      deliveryId,
      staffId: (await User.findOne({ email: 'staffl@test.com' }))._id.toString(),
    }, staffLogisticsCookie);

    const res = await api('PUT', '/deliveries/status', {
      deliveryId,
      status: 'DELIVERED',
      note: 'Delivered to customer',
    }, staffLogisticsCookie);
    assert.strictEqual(res.status, 200, `Update delivery status failed: ${JSON.stringify(res.data)}`);

    // Both payouts must now be ELIGIBLE
    const payouts = await Payout.find({ order: orderId });
    payouts.forEach(p => {
      assert.strictEqual(p.status, 'ELIGIBLE', 'Payout must become ELIGIBLE after delivery');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 7: Payout Processing
  // ────────────────────────────────────────────────────────────────────────────

  test('Payout: Seller can see their own payouts', async () => {
    const res = await api('GET', '/payouts/my/listings', null, sellerCookie);
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.payouts?.length > 0, 'Seller must see their payouts');
  });

  test('Payout: Seller cannot process another seller\'s payout', async () => {
    const res = await api('POST', '/payouts/process', {
      payoutId: payout2Id,
      transactionRef: 'BANK-REF-123',
    }, sellerCookie);
    assert.strictEqual(res.status, 403, 'Sellers must not process payouts');
  });

  test('Payout: Staff can process ELIGIBLE payout', async () => {
    const res = await api('POST', '/payouts/process', {
      payoutId: payout1Id,
      transactionRef: 'BANK-REF-TEST-001',
    }, staffFinanceCookie);
    assert.strictEqual(res.status, 200, `Process payout failed: ${JSON.stringify(res.data)}`);

    const payout = await Payout.findById(payout1Id);
    assert.strictEqual(payout.status, 'PAID', 'Payout must be PAID after processing');
  });

  test('Payout: Cannot process already-PAID payout (invalid state transition)', async () => {
    const res = await api('POST', '/payouts/process', {
      payoutId: payout1Id,
      transactionRef: 'BANK-REF-DUPLICATE',
    }, staffFinanceCookie);
    assert.strictEqual(res.status, 400, 'Duplicate payout processing must be rejected');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 8: Order State Machine — Invalid Transitions
  // ────────────────────────────────────────────────────────────────────────────

  test('State machine: Cannot change status of a DELIVERED order to PENDING_PAYMENT', async () => {
    const order = await Order.findById(orderId);
    // Order should be DELIVERED by now
    assert.strictEqual(order.orderStatus, 'DELIVERED');

    const res = await api('PUT', `/orders/${orderId}/status`, {
      status: 'PENDING_PAYMENT',
      note: 'Trying to regress state',
    }, adminCookie);
    assert.strictEqual(res.status, 400, 'Invalid state regression must be rejected');
  });

  test('State machine: Cannot cancel a DELIVERED order', async () => {
    const res = await api('PUT', `/orders/${orderId}/status`, {
      status: 'CANCELLED',
    }, adminCookie);
    assert.strictEqual(res.status, 400, 'Cannot cancel delivered order');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 9: Webhook Security
  // ────────────────────────────────────────────────────────────────────────────

  test('Webhook: Missing tx_ref returns 400', async () => {
    const res = await api('POST', '/payments/webhook/chapa', { status: 'success' });
    assert.strictEqual(res.status, 400);
  });

  test('Webhook: Unknown transaction returns 404', async () => {
    const res = await api('POST', '/payments/webhook/mock', {
      tx_ref: 'TX-MOCK-NONEXISTENT-000',
      status: 'success',
    });
    assert.strictEqual(res.status, 404);
  });

  test('Webhook: Reject missing signature when CHAPA_WEBHOOK_SECRET is configured', async () => {
    const originalSecret = process.env.CHAPA_WEBHOOK_SECRET;
    process.env.CHAPA_WEBHOOK_SECRET = 'test_webhook_secret_key_123';
    try {
      const res = await api('POST', '/payments/webhook/chapa', {
        tx_ref: 'TX-MOCK-SAMPLE-REF',
        status: 'success',
      });
      assert.strictEqual(res.status, 401, 'Must reject unsigned webhook when secret is set');
    } finally {
      process.env.CHAPA_WEBHOOK_SECRET = originalSecret;
    }
  });

  test('Webhook: Reject invalid HMAC-SHA256 signature', async () => {
    const originalSecret = process.env.CHAPA_WEBHOOK_SECRET;
    process.env.CHAPA_WEBHOOK_SECRET = 'test_webhook_secret_key_123';
    try {
      const res = await api(
        'POST',
        '/payments/webhook/chapa',
        { tx_ref: 'TX-MOCK-SAMPLE-REF', status: 'success' },
        null,
        { 'x-chapa-signature': 'deadbeef0123456789abcdefdeadbeef0123456789abcdefdeadbeef01234567' }
      );
      assert.strictEqual(res.status, 401, 'Must reject invalid signature');
    } finally {
      process.env.CHAPA_WEBHOOK_SECRET = originalSecret;
    }
  });

  test('Webhook: Production refuses payment fulfillment when CHAPA_WEBHOOK_SECRET is missing', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.CHAPA_WEBHOOK_SECRET;
    process.env.NODE_ENV = 'production';
    delete process.env.CHAPA_WEBHOOK_SECRET;
    try {
      const paymentController = require('../src/controllers/paymentController');
      let statusSent = 0;
      let bodySent = {};
      const req = {
        params: { provider: 'chapa' },
        body: { tx_ref: 'TX-CHAPA-PROD-TEST', status: 'success' },
        headers: {},
      };
      const res = {
        status(code) {
          statusSent = code;
          return this;
        },
        json(data) {
          bodySent = data;
          return this;
        },
      };
      await paymentController.handleWebhook(req, res, () => {});
      assert.strictEqual(statusSent, 500, 'Must refuse Chapa webhook when secret is missing in production');
      assert.ok(bodySent.message?.includes('Webhook signature secret is not configured in production'));
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.CHAPA_WEBHOOK_SECRET = originalSecret;
    }
  });

  test('Webhook: Mock provider is rejected in production mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const paymentController = require('../src/controllers/paymentController');
      let statusSent = 0;
      let bodySent = {};
      const req = {
        params: { provider: 'mock' },
        body: { tx_ref: 'TX-MOCK-PROD-TEST', status: 'success' },
        headers: {},
      };
      const res = {
        status(code) {
          statusSent = code;
          return this;
        },
        json(data) {
          bodySent = data;
          return this;
        },
      };
      await paymentController.handleWebhook(req, res, () => {});
      assert.strictEqual(statusSent, 403, 'Must reject mock provider in production with 403');
      assert.ok(bodySent.message?.includes('Mock provider disabled in production'));
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  test('Webhook: Late failed webhook cannot downgrade already paid/delivered order', async () => {
    const payment = await Payment.findById(paymentId);
    assert.strictEqual(payment.status, 'PAID');
    const orderBefore = await Order.findById(orderId);
    assert.strictEqual(orderBefore.paymentStatus, 'PAID');

    // Send a late/failed webhook with same tx_ref
    const res = await api('POST', '/payments/webhook/mock', {
      tx_ref: payment.transactionId,
      status: 'failed',
    });
    assert.strictEqual(res.status, 200);

    const orderAfter = await Order.findById(orderId);
    assert.strictEqual(orderAfter.orderStatus, orderBefore.orderStatus, 'Order status must not downgrade');
    assert.strictEqual(orderAfter.paymentStatus, 'PAID', 'Payment status must not downgrade from PAID');
  });

  test('Recovery: Payment becomes PAID but Order update fails, repeated webhook recovers incomplete Order without duplicate delivery, notifications, inventory, or payouts', async () => {
    const testOrder = await Order.create({
      buyer: buyerId,
      items: [{
        product: product1Id,
        name: 'Test Scrap Rebar',
        price: 500,
        quantity: 2,
        seller: seller1Id,
      }],
      subtotal: 1000,
      deliveryFee: 150,
      total: 1150,
      paymentMethod: 'CHAPA',
      orderStatus: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
      deliveryStatus: 'PENDING',
      deliveryAddress: {
        streetAddress: 'Kebele 04',
        subCity: 'Bole Subcity',
        city: 'Adama',
        phoneNumber: '+251911000000',
      },
      trackingNumber: 'TRK-RECOVER-TEST-001',
    });

    const testTxRef = `TX-RECOVER-TEST-${Date.now()}`;
    const testPayment = await Payment.create({
      order: testOrder._id,
      provider: 'CHAPA',
      transactionId: testTxRef,
      amount: 1150,
      status: 'PAID', // Incomplete state: Payment marked PAID, but Order was NOT updated
    });

    assert.strictEqual(testPayment.status, 'PAID');
    assert.strictEqual(testOrder.orderStatus, 'PENDING_PAYMENT');
    assert.strictEqual(testOrder.paymentStatus, 'PENDING');

    const productBefore = await Product.findById(product1Id);
    const initialQty = productBefore.quantity;
    const initialPayouts = await Payout.countDocuments({ order: testOrder._id });

    // 1. Chapa retries webhook delivery
    const res1 = await api('POST', '/payments/webhook/mock', {
      tx_ref: testTxRef,
      status: 'success',
    });
    assert.strictEqual(res1.status, 200);

    // 2. Verify Order was safely recovered
    const recoveredOrder = await Order.findById(testOrder._id);
    assert.strictEqual(recoveredOrder.paymentStatus, 'PAID', 'Order paymentStatus must be recovered to PAID');
    assert.strictEqual(recoveredOrder.orderStatus, 'CONFIRMED', 'Order orderStatus must be recovered to CONFIRMED');

    // 3. Verify Delivery record created exactly once
    const deliveriesCount = await Delivery.countDocuments({ order: testOrder._id });
    assert.strictEqual(deliveriesCount, 1, 'Delivery record must exist exactly once');

    // 4. Verify Notification created exactly once
    const notifCount = await Notification.countDocuments({ user: buyerId, relatedId: testOrder._id, type: 'PAYMENT' });
    assert.strictEqual(notifCount, 1, 'Payment notification must exist exactly once');

    // 5. Verify inventory was NOT decremented again during webhook
    const productAfter = await Product.findById(product1Id);
    assert.strictEqual(productAfter.quantity, initialQty, 'Inventory must not be decremented during webhook recovery');

    // 6. Verify payouts were NOT duplicated
    const finalPayouts = await Payout.countDocuments({ order: testOrder._id });
    assert.strictEqual(finalPayouts, initialPayouts, 'Payout records must not be duplicated during recovery');

    // 7. Repeated delivery: send webhook AGAIN to verify full idempotency
    const res2 = await api('POST', '/payments/webhook/mock', {
      tx_ref: testTxRef,
      status: 'success',
    });
    assert.strictEqual(res2.status, 200);
    assert.ok(res2.data.message?.includes('Already processed and fulfilled'));

    const deliveriesCount2 = await Delivery.countDocuments({ order: testOrder._id });
    assert.strictEqual(deliveriesCount2, 1, 'Repeated webhook must NOT create duplicate delivery records');

    const notifCount2 = await Notification.countDocuments({ user: buyerId, relatedId: testOrder._id, type: 'PAYMENT' });
    assert.strictEqual(notifCount2, 1, 'Repeated webhook must NOT create duplicate notifications');
  });

  test('Concurrency: Concurrent valid webhooks cannot cause duplicate fulfillment', async () => {
    const testOrder = await Order.create({
      buyer: buyerId,
      items: [{ product: product1Id, name: 'Item', price: 200, quantity: 1, seller: seller1Id }],
      subtotal: 200,
      deliveryFee: 50,
      total: 250,
      paymentMethod: 'CHAPA',
      orderStatus: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
      deliveryStatus: 'PENDING',
      deliveryAddress: { streetAddress: 'Kebele 01', subCity: 'Bole', city: 'Adama', phoneNumber: '+251911000000' },
      trackingNumber: 'TRK-CONCURRENT-001',
    });

    const testTxRef = `TX-CONCURRENT-${Date.now()}`;
    await Payment.create({
      order: testOrder._id,
      provider: 'CHAPA',
      transactionId: testTxRef,
      amount: 250,
      status: 'PENDING',
    });

    // Fire 2 concurrent webhook requests simultaneously
    const [res1, res2] = await Promise.all([
      api('POST', '/payments/webhook/mock', { tx_ref: testTxRef, status: 'success' }),
      api('POST', '/payments/webhook/mock', { tx_ref: testTxRef, status: 'success' }),
    ]);

    assert.strictEqual(res1.status, 200);
    assert.strictEqual(res2.status, 200);

    const deliveryCount = await Delivery.countDocuments({ order: testOrder._id });
    assert.strictEqual(deliveryCount, 1, 'Concurrent webhooks must create exactly 1 delivery record');

    const notifCount = await Notification.countDocuments({ user: buyerId, relatedId: testOrder._id, type: 'PAYMENT' });
    assert.strictEqual(notifCount, 1, 'Concurrent webhooks must create exactly 1 notification');

    const finalOrder = await Order.findById(testOrder._id);
    assert.strictEqual(finalOrder.paymentStatus, 'PAID');
    assert.strictEqual(finalOrder.orderStatus, 'CONFIRMED');
  });

  test('Database Index: One order cannot receive multiple Delivery documents (unique index)', async () => {
    await Delivery.init(); // ensure unique index is built in MongoDB
    const testOrder = await Order.create({
      buyer: buyerId,
      items: [{ product: product1Id, name: 'Item', price: 100, quantity: 1, seller: seller1Id }],
      subtotal: 100, deliveryFee: 0, total: 100, paymentMethod: 'CHAPA',
      orderStatus: 'PENDING_PAYMENT', paymentStatus: 'PENDING', deliveryStatus: 'PENDING',
      deliveryAddress: { streetAddress: 'Adama', subCity: 'Bole', city: 'Adama', phoneNumber: '0911000000' },
      trackingNumber: `TRK-INDEX-DEL-${Date.now()}`,
    });

    await Delivery.create({ order: testOrder._id, status: 'PENDING', fee: 0 });

    // Attempting to create a duplicate delivery for the same order must be rejected by MongoDB unique index
    await assert.rejects(
      async () => {
        await Delivery.create({ order: testOrder._id, status: 'PENDING', fee: 0 });
      },
      (err) => err.code === 11000,
      'MongoDB must reject duplicate delivery record with code 11000'
    );
  });

  test('Database Index: One user/order/type combination cannot receive duplicate PAYMENT notifications (partial unique index)', async () => {
    await Notification.init(); // ensure partial unique index is built in MongoDB
    const testOrder = await Order.create({
      buyer: buyerId,
      items: [{ product: product1Id, name: 'Item', price: 100, quantity: 1, seller: seller1Id }],
      subtotal: 100, deliveryFee: 0, total: 100, paymentMethod: 'CHAPA',
      orderStatus: 'PENDING_PAYMENT', paymentStatus: 'PENDING', deliveryStatus: 'PENDING',
      deliveryAddress: { streetAddress: 'Adama', subCity: 'Bole', city: 'Adama', phoneNumber: '0911000000' },
      trackingNumber: `TRK-INDEX-NOTIF-${Date.now()}`,
    });

    await Notification.create({
      user: buyerId,
      title: 'Payment Confirmed',
      message: 'Your payment was received.',
      type: 'PAYMENT',
      relatedId: testOrder._id,
    });

    // Attempting to create duplicate PAYMENT notification for the same user and order must be rejected
    await assert.rejects(
      async () => {
        await Notification.create({
          user: buyerId,
          title: 'Duplicate Payment Confirmed',
          message: 'Your payment was received again.',
          type: 'PAYMENT',
          relatedId: testOrder._id,
        });
      },
      (err) => err.code === 11000,
      'MongoDB must reject duplicate PAYMENT notification with code 11000'
    );
  });

  test('Database Index: Non-payment notification types remain unaffected by the partial unique index', async () => {
    await Notification.init();
    const testOrder = await Order.create({
      buyer: buyerId,
      items: [{ product: product1Id, name: 'Item', price: 100, quantity: 1, seller: seller1Id }],
      subtotal: 100, deliveryFee: 0, total: 100, paymentMethod: 'CHAPA',
      orderStatus: 'PENDING_PAYMENT', paymentStatus: 'PENDING', deliveryStatus: 'PENDING',
      deliveryAddress: { streetAddress: 'Adama', subCity: 'Bole', city: 'Adama', phoneNumber: '0911000000' },
      trackingNumber: `TRK-NON-PAY-NOTIF-${Date.now()}`,
    });

    // Create first ORDER notification
    const n1 = await Notification.create({
      user: buyerId,
      title: 'Order Placed',
      message: 'Your order was placed.',
      type: 'ORDER',
      relatedId: testOrder._id,
    });

    // Create second ORDER notification for the same user and order (e.g. Order Shipped)
    const n2 = await Notification.create({
      user: buyerId,
      title: 'Order Shipped',
      message: 'Your order is on the way.',
      type: 'ORDER',
      relatedId: testOrder._id,
    });

    assert.ok(n1._id);
    assert.ok(n2._id);
    const count = await Notification.countDocuments({ user: buyerId, relatedId: testOrder._id, type: 'ORDER' });
    assert.strictEqual(count, 2, 'Non-payment notifications must allow multiple entries per order');
  });

  test('Safe Upsert: Duplicate-key conflicts are handled safely after verifying existing record', async () => {
    await Delivery.init();
    await Notification.init();
    const testOrder = await Order.create({
      buyer: buyerId,
      items: [{ product: product1Id, name: 'Item', price: 150, quantity: 1, seller: seller1Id }],
      subtotal: 150, deliveryFee: 0, total: 150, paymentMethod: 'CHAPA',
      orderStatus: 'PENDING_PAYMENT', paymentStatus: 'PENDING', deliveryStatus: 'PENDING',
      deliveryAddress: { streetAddress: 'Adama', subCity: 'Bole', city: 'Adama', phoneNumber: '0911000000' },
      trackingNumber: `TRK-SAFE-UPSERT-${Date.now()}`,
    });

    // Pre-create delivery and notification
    await Delivery.create({ order: testOrder._id, status: 'PENDING', fee: 0 });
    await Notification.create({
      user: buyerId,
      title: 'Payment Success via Webhook',
      message: 'Paid',
      type: 'PAYMENT',
      relatedId: testOrder._id,
    });

    // Mock Delivery.findOneAndUpdate to simulate an E11000 collision on the upsert
    const originalDeliveryFindOneAndUpdate = Delivery.findOneAndUpdate;
    let deliveryCollisionSimulated = false;
    Delivery.findOneAndUpdate = async function (...args) {
      deliveryCollisionSimulated = true;
      const err = new Error('E11000 duplicate key error');
      err.code = 11000;
      throw err;
    };

    try {
      const testTxRef = `TX-SAFE-UPSERT-${Date.now()}`;
      await Payment.create({
        order: testOrder._id,
        provider: 'CHAPA',
        transactionId: testTxRef,
        amount: 150,
        status: 'PENDING',
      });

      const res = await api('POST', '/payments/webhook/mock', {
        tx_ref: testTxRef,
        status: 'success',
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(deliveryCollisionSimulated, true, 'Delivery E11000 collision was simulated');
      const deliveryCount = await Delivery.countDocuments({ order: testOrder._id });
      assert.strictEqual(deliveryCount, 1, 'Delivery must still exist exactly once');
    } finally {
      Delivery.findOneAndUpdate = originalDeliveryFindOneAndUpdate;
    }
  });

  test('Safe Upsert: Unexpected database errors still propagate correctly', async () => {
    const originalDeliveryFindOneAndUpdate = Delivery.findOneAndUpdate;
    Delivery.findOneAndUpdate = async function (...args) {
      const err = new Error('Connection lost to replica set');
      err.code = 10000; // non-11000 error
      throw err;
    };

    try {
      const testOrder = await Order.create({
        buyer: buyerId,
        items: [{ product: product1Id, name: 'Item', price: 150, quantity: 1, seller: seller1Id }],
        subtotal: 150, deliveryFee: 0, total: 150, paymentMethod: 'CHAPA',
        orderStatus: 'PENDING_PAYMENT', paymentStatus: 'PENDING', deliveryStatus: 'PENDING',
        deliveryAddress: { streetAddress: 'Adama', subCity: 'Bole', city: 'Adama', phoneNumber: '0911000000' },
        trackingNumber: `TRK-DB-ERR-${Date.now()}`,
      });
      const testTxRef = `TX-DB-ERR-${Date.now()}`;
      await Payment.create({
        order: testOrder._id,
        provider: 'CHAPA',
        transactionId: testTxRef,
        amount: 150,
        status: 'PENDING',
      });

      const res = await api('POST', '/payments/webhook/mock', {
        tx_ref: testTxRef,
        status: 'success',
      });

      // Unexpected error must cause failure, not silent success
      assert.strictEqual(res.status, 500, 'Unexpected database error must propagate and return HTTP 500');
    } finally {
      Delivery.findOneAndUpdate = originalDeliveryFindOneAndUpdate;
    }
  });

  test('Validation: Verification response rejects missing or mismatched transaction reference', async () => {
    const paymentController = require('../src/controllers/paymentController');
    const PaymentService = require('../src/services/PaymentService');
    const originalVerify = PaymentService.verify;

    try {
      const order = await Order.create({
        buyer: buyerId,
        items: [{ product: product1Id, name: 'Item', price: 500, quantity: 1, seller: seller1Id }],
        subtotal: 500, deliveryFee: 0, total: 500, paymentMethod: 'CHAPA',
        orderStatus: 'PENDING_PAYMENT', paymentStatus: 'PENDING', deliveryStatus: 'PENDING',
        deliveryAddress: { streetAddress: 'Adama', subCity: 'Bole', city: 'Adama', phoneNumber: '0911000000' },
        trackingNumber: 'TRK-VAL-01',
      });
      await Payment.create({
        order: order._id, provider: 'CHAPA', transactionId: 'TX-TEST-VALIDATE-01', amount: 500, status: 'PENDING',
      });

      const invokeWebhook = (reqObj) =>
        new Promise((resolve, reject) => {
          let code = 200;
          let body = {};
          const mockRes = {
            status(c) {
              code = c;
              return this;
            },
            json(b) {
              body = b;
              resolve({ status: code, body });
              return this;
            },
          };
          paymentController.handleWebhook(reqObj, mockRes, (err) => {
            if (err) reject(err);
            else resolve({ status: code, body });
          });
        });

      const req = {
        params: { provider: 'chapa' },
        body: { tx_ref: 'TX-TEST-VALIDATE-01', status: 'success' },
        headers: {},
      };

      process.env.CHAPA_SECRET_KEY = 'test_key';

      // 1. Missing transactionId in verification response
      PaymentService.verify = async () => ({
        status: 'PAID',
        transactionId: null, // missing
        currency: 'ETB',
        amount: 500,
      });

      const res1 = await invokeWebhook(req);
      assert.strictEqual(res1.status, 400, 'Must reject when verification transaction reference is missing');

      // 2. Mismatched transactionId in verification response
      PaymentService.verify = async () => ({
        status: 'PAID',
        transactionId: 'TX-DIFFERENT-REF', // mismatched
        currency: 'ETB',
        amount: 500,
      });
      const res2 = await invokeWebhook(req);
      assert.strictEqual(res2.status, 400, 'Must reject when verification transaction reference mismatches');
    } finally {
      PaymentService.verify = originalVerify;
      delete process.env.CHAPA_SECRET_KEY;
    }
  });

  test('Validation: Verification response rejects missing or mismatched currency', async () => {
    const paymentController = require('../src/controllers/paymentController');
    const PaymentService = require('../src/services/PaymentService');
    const originalVerify = PaymentService.verify;

    try {
      const order = await Order.create({
        buyer: buyerId,
        items: [{ product: product1Id, name: 'Item', price: 500, quantity: 1, seller: seller1Id }],
        subtotal: 500, deliveryFee: 0, total: 500, paymentMethod: 'CHAPA',
        orderStatus: 'PENDING_PAYMENT', paymentStatus: 'PENDING', deliveryStatus: 'PENDING',
        deliveryAddress: { streetAddress: 'Adama', subCity: 'Bole', city: 'Adama', phoneNumber: '0911000000' },
        trackingNumber: 'TRK-VAL-02',
      });
      await Payment.create({
        order: order._id, provider: 'CHAPA', transactionId: 'TX-TEST-CURRENCY-01', amount: 500, status: 'PENDING',
      });

      const invokeWebhook = (reqObj) =>
        new Promise((resolve, reject) => {
          let code = 200;
          let body = {};
          const mockRes = {
            status(c) {
              code = c;
              return this;
            },
            json(b) {
              body = b;
              resolve({ status: code, body });
              return this;
            },
          };
          paymentController.handleWebhook(reqObj, mockRes, (err) => {
            if (err) reject(err);
            else resolve({ status: code, body });
          });
        });

      const req = {
        params: { provider: 'chapa' },
        body: { tx_ref: 'TX-TEST-CURRENCY-01', status: 'success' },
        headers: {},
      };
      process.env.CHAPA_SECRET_KEY = 'test_key';

      // 1. Missing currency
      PaymentService.verify = async () => ({
        status: 'PAID',
        transactionId: 'TX-TEST-CURRENCY-01',
        currency: null,
        amount: 500,
      });
      const res1 = await invokeWebhook(req);
      assert.strictEqual(res1.status, 400, 'Must reject when currency is missing');

      // 2. Mismatched currency
      PaymentService.verify = async () => ({
        status: 'PAID',
        transactionId: 'TX-TEST-CURRENCY-01',
        currency: 'USD',
        amount: 500,
      });
      const res2 = await invokeWebhook(req);
      assert.strictEqual(res2.status, 400, 'Must reject when currency is not ETB');
    } finally {
      PaymentService.verify = originalVerify;
      delete process.env.CHAPA_SECRET_KEY;
    }
  });

  test('Validation: Verification response rejects invalid, missing, or non-finite amounts', async () => {
    const paymentController = require('../src/controllers/paymentController');
    const PaymentService = require('../src/services/PaymentService');
    const originalVerify = PaymentService.verify;

    try {
      const order = await Order.create({
        buyer: buyerId,
        items: [{ product: product1Id, name: 'Item', price: 500, quantity: 1, seller: seller1Id }],
        subtotal: 500, deliveryFee: 0, total: 500, paymentMethod: 'CHAPA',
        orderStatus: 'PENDING_PAYMENT', paymentStatus: 'PENDING', deliveryStatus: 'PENDING',
        deliveryAddress: { streetAddress: 'Adama', subCity: 'Bole', city: 'Adama', phoneNumber: '0911000000' },
        trackingNumber: 'TRK-VAL-03',
      });
      await Payment.create({
        order: order._id, provider: 'CHAPA', transactionId: 'TX-TEST-AMOUNT-01', amount: 500, status: 'PENDING',
      });

      const invokeWebhook = (reqObj) =>
        new Promise((resolve, reject) => {
          let code = 200;
          let body = {};
          const mockRes = {
            status(c) {
              code = c;
              return this;
            },
            json(b) {
              body = b;
              resolve({ status: code, body });
              return this;
            },
          };
          paymentController.handleWebhook(reqObj, mockRes, (err) => {
            if (err) reject(err);
            else resolve({ status: code, body });
          });
        });

      const req = {
        params: { provider: 'chapa' },
        body: { tx_ref: 'TX-TEST-AMOUNT-01', status: 'success' },
        headers: {},
      };
      process.env.CHAPA_SECRET_KEY = 'test_key';

      // 1. Missing amount
      PaymentService.verify = async () => ({
        status: 'PAID',
        transactionId: 'TX-TEST-AMOUNT-01',
        currency: 'ETB',
        amount: null,
      });
      const res1 = await invokeWebhook(req);
      assert.strictEqual(res1.status, 400, 'Must reject null amount');

      // 2. Non-finite amount (Infinity)
      PaymentService.verify = async () => ({
        status: 'PAID',
        transactionId: 'TX-TEST-AMOUNT-01',
        currency: 'ETB',
        amount: Infinity,
      });
      const res2 = await invokeWebhook(req);
      assert.strictEqual(res2.status, 400, 'Must reject Infinity amount');

      // 3. Amount mismatch
      PaymentService.verify = async () => ({
        status: 'PAID',
        transactionId: 'TX-TEST-AMOUNT-01',
        currency: 'ETB',
        amount: 100,
      });
      const res3 = await invokeWebhook(req);
      assert.strictEqual(res3.status, 400, 'Must reject mismatched amount');
    } finally {
      PaymentService.verify = originalVerify;
      delete process.env.CHAPA_SECRET_KEY;
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 10: Commission Rate Calculation
  // ────────────────────────────────────────────────────────────────────────────

  test('Commission: Per-seller payout amount correctly deducts commission', async () => {
    const payouts = await Payout.find({ order: orderId });

    for (const p of payouts) {
      const expectedCommission = parseFloat((p.amount * p.commissionRate).toFixed(10));
      const expectedPayout = p.amount - expectedCommission;
      assert.ok(
        Math.abs(p.payoutAmount - expectedPayout) < 0.01,
        `Payout amount mismatch: got ${p.payoutAmount}, expected ~${expectedPayout}`
      );
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 11: Legacy Security Tests (retained)
  // ────────────────────────────────────────────────────────────────────────────

  test('Legacy Rule 3: Buyers cannot access admin analytics', async () => {
    const res = await api('GET', '/admin/dashboard-stats', null, buyerCookie);
    assert.strictEqual(res.status, 403);
  });

  test('Legacy Rule 4: Staff cannot access admin audit logs', async () => {
    const res = await api('GET', '/admin/audit-logs', null, staffFinanceCookie);
    assert.strictEqual(res.status, 403);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 12: Role Permissions (Buyer vs Seller vs Admin vs Staff)
  // ────────────────────────────────────────────────────────────────────────────

  test('Role Permission: Seller cannot add items to cart or checkout (HTTP 403)', async () => {
    const cartRes = await api('POST', '/cart/add', { productId: product1Id, quantity: 1 }, sellerCookie);
    assert.strictEqual(cartRes.status, 403, 'Seller must not be allowed to add items to cart');

    const checkoutRes = await api('POST', '/orders/checkout', {
      paymentMethod: 'CHAPA',
      deliveryAddress: { streetAddress: '1 Seller St', city: 'Adama', subCity: 'Bole', phoneNumber: '0911000000', latitude: 8.541, longitude: 39.271 },
    }, sellerCookie);
    assert.strictEqual(checkoutRes.status, 403, 'Seller must not be allowed to checkout');
  });

  test('Role Permission: Admin cannot add items to cart or checkout (HTTP 403)', async () => {
    const cartRes = await api('POST', '/cart/add', { productId: product1Id, quantity: 1 }, adminCookie);
    assert.strictEqual(cartRes.status, 403, 'Admin must not be allowed to add items to cart');

    const checkoutRes = await api('POST', '/orders/checkout', {
      paymentMethod: 'CHAPA',
      deliveryAddress: { streetAddress: '1 Admin St', city: 'Adama', subCity: 'Bole', phoneNumber: '0911000000', latitude: 8.541, longitude: 39.271 },
    }, adminCookie);
    assert.strictEqual(checkoutRes.status, 403, 'Admin must not be allowed to checkout');
  });

  test('Role Permission: Buyer cannot create seller product listings (HTTP 403)', async () => {
    const res = await api('POST', '/products', {
      name: 'Unauthorized Listing', description: 'Attempted by Buyer', price: 100,
      quantity: 1, category: categoryId, materialType: materialTypeId, condition: 'Good',
      images: ['http://localhost:5000/uploads/unauthorized.jpg'],
    }, buyerCookie);
    assert.strictEqual(res.status, 403, 'Buyer must be forbidden from creating seller listings');
  });
});
