import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { verifyPaymentSignature } from '../services/paymentService.js';

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopsmart_ai';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('ShopSmart AI API Test Suite', () => {
  let customerToken = '';
  let adminToken = '';
  let sampleProduct = null;

  // 1. Health check
  test('GET /api/health should return 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  // 2. Authentication
  test('POST /api/auth/login with valid customer credentials should return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer@shopsmart.ai', password: 'Customer@123456' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('customer');
    customerToken = res.body.token;
  });

  test('POST /api/auth/login with admin credentials should return admin role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@shopsmart.ai', password: 'Admin@123456' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('admin');
    adminToken = res.body.token;
  });

  test('POST /api/auth/register should prevent self-registering as admin', async () => {
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hacker User',
        email: uniqueEmail,
        password: 'Password@123',
        role: 'admin' // Attempting to escalate role
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.user.role).toBe('customer'); // Forced to customer!
    // Clean up
    await User.findByIdAndDelete(res.body.user.id);
  });

  // 3. Product Catalog & Search
  test('GET /api/products should return seeded products list', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products.length).toBeGreaterThan(0);
    sampleProduct = res.body.products[0];
  });

  test('GET /api/products?search=headphones should find matching audio products', async () => {
    const res = await request(app).get('/api/products?search=headphones');
    expect(res.statusCode).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
    expect(res.body.products[0].name.toLowerCase()).toContain('headphones');
  });

  test('GET /api/products?maxPrice=3000 should respect max budget filter', async () => {
    const res = await request(app).get('/api/products?maxPrice=3000');
    expect(res.statusCode).toBe(200);
    res.body.products.forEach(p => {
      expect(p.price).toBeLessThanOrEqual(3000);
    });
  });

  // 4. Cart Operations & Stock Validation
  test('POST /api/cart/items should add product to customer cart', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: sampleProduct._id, quantity: 1 });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.cart.items.length).toBeGreaterThan(0);
  });

  test('POST /api/cart/items should reject quantities exceeding stock', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: sampleProduct._id, quantity: 99999 });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // 5. AI Assistant Endpoint
  test('POST /api/ai/chat should return intelligent recommendation strictly from DB', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .send({ message: 'Find wireless headphones under 3000' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reply).toBeDefined();
    expect(res.body.products.length).toBeGreaterThan(0);
    expect(res.body.products[0].price).toBeLessThanOrEqual(3000);
  });

  // 6. Admin Access Protection
  test('GET /api/admin/dashboard should reject unauthenticated requests', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/admin/dashboard should reject customer role with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('GET /api/admin/dashboard should succeed with admin role', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats.totalProducts).toBeGreaterThan(0);
  });

  // 7. Payment Signature Verification
  test('verifyPaymentSignature should validate simulated Razorpay signatures', () => {
    const valid = verifyPaymentSignature({
      orderId: 'order_sim_12345',
      paymentId: 'pay_sim_67890',
      signature: 'simulated_valid_signature'
    });
    expect(valid).toBe(true);

    const invalid = verifyPaymentSignature({
      orderId: 'order_sim_12345',
      paymentId: 'pay_sim_67890',
      signature: 'fake_tampered_signature'
    });
    expect(invalid).toBe(false);
  });
});
