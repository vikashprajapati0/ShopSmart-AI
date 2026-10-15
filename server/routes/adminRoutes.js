import express from 'express';
import {
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
} from '../controllers/adminController.js';
import { protect, requireRole } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Enforce admin-only access on all routes in this router
router.use(protect, requireRole('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/ai-usage', getAiUsageStats);
router.get('/export-sales', exportSalesCsv);

// Product Management
router.get('/products', getAdminProducts);
router.post('/products', upload.array('images', 5), createProduct);
router.put('/products/:id', upload.array('images', 5), updateProduct);
router.delete('/products/:id', deleteProduct);

// Order Management
router.get('/orders', getAdminOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Customer Management
router.get('/customers', getAdminCustomers);

// Inventory Management
router.get('/inventory', getAdminInventory);
router.post('/inventory/update-stock', updateInventoryStock);

// Coupon Management
router.get('/coupons', getAdminCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

export default router;
