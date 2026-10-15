import Razorpay from 'razorpay';
import crypto from 'crypto';

const isRazorpayConfigured = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return keyId && keySecret && !keyId.includes('dev') && !keySecret.includes('dev');
};

let razorpayInstance = null;
if (isRazorpayConfigured()) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

/**
 * Create a Razorpay Order
 * @param {Object} options
 * @param {number} options.amountInINR - Amount in Rupees
 * @param {string} options.receipt - Unique internal receipt / order id
 * @param {Object} options.notes - Metadata
 */
export const createRazorpayOrder = async ({ amountInINR, receipt, notes = {} }) => {
  // Convert INR to Paise (integer)
  const amountInPaise = Math.round(amountInINR * 100);

  if (!isRazorpayConfigured() || !razorpayInstance) {
    // Development / Sandbox simulation mode
    const mockOrderId = `order_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return {
      id: mockOrderId,
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      isSimulation: true,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_shopsmart_dev'
    };
  }

  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: receipt.slice(0, 40), // Razorpay receipt max 40 chars
    notes: {
      ...notes,
      platform: 'ShopSmart AI'
    }
  };

  const order = await razorpayInstance.orders.create(options);
  return {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    isSimulation: false,
    keyId: process.env.RAZORPAY_KEY_ID
  };
};

/**
 * Verify Razorpay Payment Signature
 * @param {Object} options
 * @param {string} options.orderId
 * @param {string} options.paymentId
 * @param {string} options.signature
 */
export const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  // Check for simulation mode verification
  if (orderId && orderId.startsWith('order_sim_')) {
    if (signature === `sim_sig_${orderId}_${paymentId}` || signature === 'simulated_valid_signature') {
      return true;
    }
    // Also accept matching hash if simulated
    const secret = process.env.RAZORPAY_KEY_SECRET || 'shopsmart_secret_key_123456';
    const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
    return signature === expected;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === signature;
};

/**
 * Verify Razorpay Webhook Signature
 * @param {string|Buffer} rawBody
 * @param {string} signature
 * @param {string} secret
 */
export const verifyWebhookSignature = (rawBody, signature, secret) => {
  if (!secret || !signature) return false;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return expectedSignature === signature;
};

export default {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  isRazorpayConfigured
};
