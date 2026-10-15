import express from 'express';
import {
  getWishlist,
  toggleWishlistItem,
  removeFromWishlist,
  moveToCart
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getWishlist);
router.post('/toggle/:productId', toggleWishlistItem);
router.delete('/:productId', removeFromWishlist);
router.post('/move-to-cart/:productId', moveToCart);

export default router;
