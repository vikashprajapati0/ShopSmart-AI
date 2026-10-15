import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Coupon from '../models/Coupon.js';
import Conversation from '../models/Conversation.js';
import InventoryMovement from '../models/InventoryMovement.js';
import { uploadImageBuffer } from '../services/cloudinaryService.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const [salesStats, totalOrders, totalCustomers, totalProducts, pendingOrders, lowStockProducts] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            orderStatus: { $nin: ['cancelled', 'pending_payment'] }
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$total' },
            avgOrderValue: { $avg: '$total' }
          }
        }
      ]),
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({ orderStatus: { $in: ['pending_payment', 'confirmed', 'processing'] } }),
      Product.countDocuments({ stock: { $lte: 5 }, isActive: true })
    ]);

    const totalSales = salesStats[0]?.totalSales || 0;
    const avgOrderValue = Math.round(salesStats[0]?.avgOrderValue || 0);

    // Recent orders
    const recentOrders = await Order.find()
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      stats: {
        totalSales,
        totalOrders,
        totalCustomers,
        totalProducts,
        avgOrderValue,
        pendingOrders,
        lowStockProducts
      },
      recentOrders
    });
  } catch (err) {
    next(err);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [dailySales, orderStatusStats, categorySales, topProducts] = await Promise.all([
      // Daily revenue for last 30 days
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            orderStatus: { $nin: ['cancelled', 'pending_payment'] }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            sales: { $sum: '$total' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Order status distribution
      Order.aggregate([
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 }
          }
        }
      ]),

      // Category breakdown
      Product.aggregate([
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'cat'
          }
        },
        { $unwind: '$cat' },
        {
          $group: {
            _id: '$cat.name',
            productCount: { $sum: 1 },
            avgPrice: { $avg: '$price' }
          }
        }
      ]),

      // Best selling products from orders
      Order.aggregate([
        { $match: { orderStatus: { $nin: ['cancelled'] } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            unitsSold: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        },
        { $sort: { unitsSold: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.status(200).json({
      success: true,
      dailySales: dailySales.map(d => ({ date: d._id, sales: d.sales, orders: d.orders })),
      orderStatusDistribution: orderStatusStats.map(s => ({ status: s._id, count: s.count })),
      categorySales: categorySales.map(c => ({ category: c._id, count: c.productCount, avgPrice: Math.round(c.avgPrice) })),
      topProducts
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 15);
    const search = req.query.search;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      products
    });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      brand,
      category,
      price,
      discountPrice,
      stock,
      sku,
      specifications,
      tags,
      isFeatured,
      images: providedImages
    } = req.body;

    let images = [];
    if (providedImages) {
      images = Array.isArray(providedImages) ? providedImages : [providedImages];
    }

    // Handle files uploaded through Multer
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = await uploadImageBuffer(file.buffer, 'shopsmart/products');
        images.push(imageUrl);
      }
    }

    if (images.length === 0) {
      images = ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'];
    }

    const parsedSpecs = typeof specifications === 'string'
      ? JSON.parse(specifications)
      : specifications || [];

    const parsedTags = typeof tags === 'string'
      ? tags.split(',').map(t => t.trim())
      : tags || [];

    const generatedSku = sku || `SKU-${Date.now().toString().slice(-6)}`;

    const product = await Product.create({
      name,
      description,
      brand,
      category,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      stock: Number(stock) || 0,
      sku: generatedSku,
      images,
      specifications: parsedSpecs,
      tags: parsedTags,
      isFeatured: isFeatured === 'true' || isFeatured === true
    });

    // Record initial inventory movement
    await InventoryMovement.create({
      product: product._id,
      type: 'in',
      quantity: product.stock,
      reason: 'Initial Product Stock Creation',
      previousStock: 0,
      newStock: product.stock,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    let product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousStock = product.stock;

    // Handle new images if uploaded
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = await uploadImageBuffer(file.buffer, 'shopsmart/products');
        product.images.push(imageUrl);
      }
    }

    // Merge body
    const updates = { ...req.body };
    if (updates.specifications && typeof updates.specifications === 'string') {
      updates.specifications = JSON.parse(updates.specifications);
    }
    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map(t => t.trim());
    }

    Object.assign(product, updates);
    await product.save();

    // Check if stock changed
    if (updates.stock !== undefined && Number(updates.stock) !== previousStock) {
      const diff = Number(updates.stock) - previousStock;
      await InventoryMovement.create({
        product: product._id,
        type: 'adjustment',
        quantity: diff,
        reason: 'Admin manual stock adjustment',
        previousStock,
        newStock: product.stock,
        createdBy: req.user._id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Soft delete by marking inactive, or hard delete
    product.isActive = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deactivated successfully'
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 15);
    const status = req.query.status;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.orderStatus = status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customer', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
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

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note, carrier, trackingNumber } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const validStatuses = ['pending_payment', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status.' });
    }

    order.orderStatus = status;
    if (carrier) order.trackingDetails.carrier = carrier;
    if (trackingNumber) order.trackingDetails.trackingNumber = trackingNumber;

    order.trackingDetails.statusTimeline.push({
      status,
      note: note || `Order updated to ${status} by administrator`
    });

    // If marked refunded or cancelled by admin, restore stock if it was completed
    if (['refunded', 'cancelled'].includes(status) && order.paymentStatus === 'completed') {
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
            reason: `Admin order ${status} #${order.orderNumber}`,
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
      message: 'Order status updated successfully',
      order
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminCustomers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 15);
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      User.find({ role: 'customer' })
        .select('name email phone addresses createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({ role: 'customer' })
    ]);

    // Attach order counts
    const customerIds = customers.map(c => c._id);
    const orderCounts = await Order.aggregate([
      { $match: { customer: { $in: customerIds } } },
      { $group: { _id: '$customer', totalOrders: { $sum: 1 }, totalSpent: { $sum: '$total' } } }
    ]);

    const countMap = {};
    orderCounts.forEach(oc => {
      countMap[oc._id.toString()] = { totalOrders: oc.totalOrders, totalSpent: oc.totalSpent };
    });

    const customersWithStats = customers.map(c => ({
      ...c,
      totalOrders: countMap[c._id.toString()]?.totalOrders || 0,
      totalSpent: countMap[c._id.toString()]?.totalSpent || 0
    }));

    res.status(200).json({
      success: true,
      count: customersWithStats.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      customers: customersWithStats
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminInventory = async (req, res, next) => {
  try {
    const lowStock = await Product.find({ stock: { $lte: 5 }, isActive: true })
      .populate('category', 'name')
      .sort({ stock: 1 })
      .lean();

    const movements = await InventoryMovement.find()
      .populate('product', 'name sku')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.status(200).json({
      success: true,
      lowStock,
      recentMovements: movements
    });
  } catch (err) {
    next(err);
  }
};

export const updateInventoryStock = async (req, res, next) => {
  try {
    const { productId, newStock, reason } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousStock = product.stock;
    product.stock = Math.max(0, parseInt(newStock, 10));
    await product.save();

    await InventoryMovement.create({
      product: product._id,
      type: 'adjustment',
      quantity: product.stock - previousStock,
      reason: reason || 'Manual stock update from inventory panel',
      previousStock,
      newStock: product.stock,
      createdBy: req.user._id
    });

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      product
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: coupons.length, coupons });
  } catch (err) {
    next(err);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, message: 'Coupon created successfully', coupon });
  } catch (err) {
    next(err);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.status(200).json({ success: true, message: 'Coupon updated', coupon });
  } catch (err) {
    next(err);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const getAiUsageStats = async (req, res, next) => {
  try {
    const [totalConversations, totalMessages] = await Promise.all([
      Conversation.countDocuments(),
      Conversation.aggregate([
        { $unwind: '$messages' },
        { $count: 'total' }
      ])
    ]);

    const recentConversations = await Conversation.find()
      .populate('user', 'name email')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      stats: {
        totalConversations,
        totalMessages: totalMessages[0]?.total || 0,
        recentConversations
      }
    });
  } catch (err) {
    next(err);
  }
};

export const exportSalesCsv = async (req, res, next) => {
  try {
    const orders = await Order.find({ orderStatus: { $nin: ['cancelled'] } })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    let csv = 'OrderNumber,Date,CustomerName,CustomerEmail,Subtotal,Discount,Shipping,Total,PaymentProvider,PaymentStatus,OrderStatus\n';

    for (const o of orders) {
      const date = new Date(o.createdAt).toISOString().split('T')[0];
      const customerName = `"${(o.customer?.name || o.shippingAddress?.fullName || 'Guest').replace(/"/g, '""')}"`;
      const customerEmail = o.customer?.email || '';
      csv += `${o.orderNumber},${date},${customerName},${customerEmail},${o.subtotal},${o.discount},${o.shippingCost},${o.total},${o.paymentProvider},${o.paymentStatus},${o.orderStatus}\n`;
    }

    res.header('Content-Type', 'text/csv');
    res.attachment(`sales_report_${Date.now()}.csv`);
    return res.send(csv);
  } catch (err) {
    next(err);
  }
};

export default {
  getDashboardStats,
  getAnalytics,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminOrders,
  updateOrderStatus,
  getAdminCustomers,
  getAdminInventory,
  updateInventoryStock,
  getAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getAiUsageStats,
  exportSalesCsv
};
