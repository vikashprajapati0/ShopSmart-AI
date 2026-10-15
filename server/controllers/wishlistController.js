import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';

export const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate({
        path: 'products',
        match: { isActive: true },
        select: 'name slug price discountPrice images stock brand ratings'
      });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    res.status(200).json({
      success: true,
      count: wishlist.products.length,
      wishlist: wishlist.products
    });
  } catch (err) {
    next(err);
  }
};

export const toggleWishlistItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    const index = wishlist.products.findIndex(id => id.toString() === productId);
    let action = '';

    if (index > -1) {
      wishlist.products.splice(index, 1);
      action = 'removed';
    } else {
      wishlist.products.push(productId);
      action = 'added';
    }

    await wishlist.save();
    await wishlist.populate({
      path: 'products',
      select: 'name slug price discountPrice images stock brand ratings'
    });

    res.status(200).json({
      success: true,
      action,
      count: wishlist.products.length,
      wishlist: wishlist.products
    });
  } catch (err) {
    next(err);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (wishlist) {
      wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
      await wishlist.save();
      await wishlist.populate({
        path: 'products',
        select: 'name slug price discountPrice images stock brand ratings'
      });
    }

    res.status(200).json({
      success: true,
      count: wishlist ? wishlist.products.length : 0,
      wishlist: wishlist ? wishlist.products : []
    });
  } catch (err) {
    next(err);
  }
};

export const moveToCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product is unavailable' });
    }
    if (product.stock < 1) {
      return res.status(400).json({ success: false, message: 'Product is currently out of stock' });
    }

    // Add to cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(item => item.product.toString() === productId);
    const price = product.discountPrice || product.price;

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += 1;
    } else {
      cart.items.push({ product: product._id, quantity: 1, priceAtAddition: price });
    }
    await cart.save();

    // Remove from wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
      await wishlist.save();
      await wishlist.populate({
        path: 'products',
        select: 'name slug price discountPrice images stock brand ratings'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product moved to cart successfully',
      wishlist: wishlist ? wishlist.products : []
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getWishlist,
  toggleWishlistItem,
  removeFromWishlist,
  moveToCart
};
