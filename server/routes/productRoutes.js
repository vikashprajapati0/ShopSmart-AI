import express from 'express';
import {
  getProducts,
  getProductBySlug,
  getProductById,
  getFeaturedProducts,
  getRelatedProducts,
  getFilterMeta
} from '../controllers/productController.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/filters', getFilterMeta);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id/related', getRelatedProducts);
router.get('/:id', getProductById);

export default router;
