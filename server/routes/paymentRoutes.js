import express from 'express';
import {
  verifyRazorpayPayment,
  handleRazorpayWebhook
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/razorpay/verify', protect, verifyRazorpayPayment);
router.post('/razorpay/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);

export default router;
