import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import InventoryMovement from '../models/InventoryMovement.js';
import { createRazorpayOrder } from '../services/paymentService.js';
import { sendOrderConfirmationEmail } from '../services/emailService.js';

export const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, couponCode, paymentProvider = 'razorpay' } = req.body;

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode) {
      return res.status(400).json({ success: false, message: 'Please provide a complete shipping address.' });
    }

    // Retrieve user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your shopping cart is empty.' });
    }

    // Server-side validation of stock and prices
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.product.name}" is no longer available.`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, in cart: ${item.quantity}.`
        });
      }

      // Backend calculated unit price (never trust frontend!)
      const unitPrice = product.discountPrice !== null && product.discountPrice !== undefined
        ? product.discountPrice
        : product.price;

      subtotal += unitPrice * item.quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        price: unitPrice,
        quantity: item.quantity,
        image: product.images[0] || ''
      });
    }

    // Coupon discount calculation
    let discount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      appliedCoupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });
      if (appliedCoupon) {
        const validation = appliedCoupon.isValid(subtotal);
        if (validation.valid) {
          discount = appliedCoupon.calculateDiscount(subtotal);
        } else {
          return res.status(400).json({ success: false, message: validation.message });
        }
      } else {
        return res.status(400).json({ success: false, message: 'Invalid coupon code.' });
      }
    }

    // Shipping cost
    const shippingCost = (subtotal - discount) >= 999 || subtotal === 0 ? 0 : 99;
    const total = Math.max(0, subtotal - discount + shippingCost);

    // Generate unique order number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${timestamp}-${random}`;

    // Create pending order
    const order = new Order({
      orderNumber,
      customer: req.user._id,
      items: orderItems,
      shippingAddress,
      subtotal,
      discount,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      shippingCost,
      total,
      paymentProvider,
      paymentStatus: 'pending',
      orderStatus: paymentProvider === 'cod' ? 'confirmed' : 'pending_payment',
      trackingDetails: {
        carrier: 'ShopSmart Express',
        statusTimeline: [
          { status: paymentProvider === 'cod' ? 'confirmed' : 'pending_payment', note: 'Order initialized' }
        ]
      }
    });

    let razorpayOrderData = null;

    if (paymentProvider === 'razorpay') {
      razorpayOrderData = await createRazorpayOrder({
        amountInINR: total,
        receipt: orderNumber,
        notes: {
          orderNumber,
          userId: req.user._id.toString()
        }
      });
      order.razorpayOrderId = razorpayOrderData.id;
    }

    await order.save();

    // If COD, handle atomic stock decrement right away and clear cart
    if (paymentProvider === 'cod') {
      for (const item of orderItems) {
        const prod = await Product.findById(item.product);
        const prev = prod.stock;
        prod.stock = Math.max(0, prod.stock - item.quantity);
        await prod.save();

        await InventoryMovement.create({
          product: prod._id,
          type: 'order',
          quantity: -item.quantity,
          reason: `COD Order #${order.orderNumber}`,
          referenceOrder: order._id,
          previousStock: prev,
          newStock: prod.stock,
          createdBy: req.user._id
        });
      }

      if (appliedCoupon) {
        appliedCoupon.usedCount += 1;
        await appliedCoupon.save();
      }

      // Clear user cart
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

      // Send confirmation email
      sendOrderConfirmationEmail(order, req.user.email);
    }

    res.status(201).json({
      success: true,
      order,
      razorpayOrder: razorpayOrderData
    });
  } catch (err) {
    next(err);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ customer: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ customer: req.user._id })
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      orders
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Role check: customer can only view own order
    if (req.user.role !== 'admin' && order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order.' });
    }

    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role !== 'admin' && order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this order.' });
    }

    if (!['pending_payment', 'confirmed'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already ${order.orderStatus}.`
      });
    }

    order.orderStatus = 'cancelled';
    order.trackingDetails.statusTimeline.push({
      status: 'cancelled',
      note: `Cancelled by ${req.user.role === 'admin' ? 'administrator' : 'customer'}`
    });

    // If stock was decremented (e.g. COD or completed payment), restore stock
    if (order.paymentStatus === 'completed' || order.paymentProvider === 'cod') {
      for (const item of order.items) {
        const prod = await Product.findById(item.product);
        if (prod) {
          const prev = prod.stock;
          prod.stock += item.quantity;
          await prod.save();

          await InventoryMovement.create({
            product: prod._id,
            type: 'return',
            quantity: item.quantity,
            reason: `Cancelled Order #${order.orderNumber}`,
            referenceOrder: order._id,
            previousStock: prev,
            newStock: prod.stock,
            createdBy: req.user._id
          });
        }
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (err) {
    next(err);
  }
};

export default {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder
};
