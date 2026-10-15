import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';
import InventoryMovement from '../models/InventoryMovement.js';
import { verifyPaymentSignature, verifyWebhookSignature } from '../services/paymentService.js';
import { sendOrderConfirmationEmail } from '../services/emailService.js';

export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification details.'
      });
    }

    const order = await Order.findById(orderId).populate('customer', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Idempotency: If already completed, return success safely
    if (order.paymentStatus === 'completed') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified and completed.',
        order
      });
    }

    // Cryptographic signature verification
    const isValid = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature
    });

    if (!isValid) {
      order.paymentStatus = 'failed';
      order.trackingDetails.statusTimeline.push({
        status: 'failed',
        note: 'Payment signature verification failed'
      });
      await order.save();

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Payment verification failed.'
      });
    }

    // Payment verified successfully: Update Order
    order.paymentStatus = 'completed';
    order.orderStatus = 'confirmed';
    order.razorpayOrderId = razorpayOrderId;
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.trackingDetails.statusTimeline.push({
      status: 'confirmed',
      note: `Payment verified successfully via Razorpay (ID: ${razorpayPaymentId})`
    });

    // Atomic stock decrement and InventoryMovement recording
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const prev = product.stock;
        product.stock = Math.max(0, product.stock - item.quantity);
        await product.save();

        await InventoryMovement.create({
          product: product._id,
          type: 'order',
          quantity: -item.quantity,
          reason: `Online Order #${order.orderNumber}`,
          referenceOrder: order._id,
          previousStock: prev,
          newStock: product.stock,
          createdBy: order.customer._id
        });
      }
    }

    // Update coupon usage if applicable
    if (order.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: order.couponCode },
        { $inc: { usedCount: 1 } }
      );
    }

    await order.save();

    // Clear user's cart
    await Cart.findOneAndUpdate({ user: order.customer._id }, { items: [] });

    // Send confirmation email
    if (order.customer && order.customer.email) {
      sendOrderConfirmationEmail(order, order.customer.email);
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed successfully.',
      order
    });
  } catch (err) {
    next(err);
  }
};

export const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (secret && signature) {
      const isValid = verifyWebhookSignature(req.rawBody || JSON.stringify(req.body), signature, secret);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured' && payload?.payment?.entity?.order_id) {
      const rzpOrderId = payload.payment.entity.order_id;
      const order = await Order.findOne({ razorpayOrderId: rzpOrderId });
      if (order && order.paymentStatus !== 'completed') {
        order.paymentStatus = 'completed';
        order.orderStatus = 'confirmed';
        order.razorpayPaymentId = payload.payment.entity.id;
        await order.save();
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error(`[Webhook Error]: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

export default {
  verifyRazorpayPayment,
  handleRazorpayWebhook
};
