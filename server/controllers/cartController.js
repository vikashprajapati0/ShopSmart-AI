import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Helper to format and calculate cart totals with real database prices
const formatCartResponse = (cart) => {
  let subtotal = 0;
  const items = [];

  for (const item of cart.items) {
    if (!item.product) continue;
    const price = item.product.discountPrice !== null && item.product.discountPrice !== undefined
      ? item.product.discountPrice
      : item.product.price;

    const itemTotal = price * item.quantity;
    subtotal += itemTotal;

    items.push({
      product: {
        _id: item.product._id,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        discountPrice: item.product.discountPrice,
        images: item.product.images,
        stock: item.product.stock,
        brand: item.product.brand
      },
      quantity: item.quantity,
      price,
      itemTotal,
      inStock: item.product.stock >= item.quantity,
      availableStock: item.product.stock
    });
  }

  // Shipping policy: Free delivery over ₹999, else ₹99
  const shippingCost = subtotal >= 999 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shippingCost;

  return {
    items,
    itemCount: items.reduce((acc, curr) => acc + curr.quantity, 0),
    subtotal,
    shippingCost,
    total
  };
};

export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name slug price discountPrice images stock brand isActive'
    });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.status(200).json({
      success: true,
      cart: formatCartResponse(cart)
    });
  } catch (err) {
    next(err);
  }
};

export const addItemToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = Math.max(1, parseInt(quantity, 10));

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found or currently unavailable' });
    }

    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available in stock.`
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    const price = product.discountPrice || product.price;

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + qty;
      if (newQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. You have ${cart.items[existingIndex].quantity} in cart and available stock is ${product.stock}.`
        });
      }
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].priceAtAddition = price;
    } else {
      cart.items.push({
        product: product._id,
        quantity: qty,
        priceAtAddition: price
      });
    }

    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name slug price discountPrice images stock brand isActive'
    });

    res.status(200).json({
      success: true,
      cart: formatCartResponse(cart)
    });
  } catch (err) {
    next(err);
  }
};

export const updateCartItemQuantity = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    if (qty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const product = await Product.findById(productId);
      if (!product) {
        cart.items.splice(itemIndex, 1);
      } else {
        if (qty > product.stock) {
          return res.status(400).json({
            success: false,
            message: `Only ${product.stock} units available in stock.`
          });
        }
        cart.items[itemIndex].quantity = qty;
      }
    }

    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name slug price discountPrice images stock brand isActive'
    });

    res.status(200).json({
      success: true,
      cart: formatCartResponse(cart)
    });
  } catch (err) {
    next(err);
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      cart.items = cart.items.filter(item => item.product.toString() !== productId);
      await cart.save();
      await cart.populate({
        path: 'items.product',
        select: 'name slug price discountPrice images stock brand isActive'
      });
    }

    res.status(200).json({
      success: true,
      cart: cart ? formatCartResponse(cart) : { items: [], itemCount: 0, subtotal: 0, shippingCost: 0, total: 0 }
    });
  } catch (err) {
    next(err);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.status(200).json({
      success: true,
      cart: { items: [], itemCount: 0, subtotal: 0, shippingCost: 0, total: 0 }
    });
  } catch (err) {
    next(err);
  }
};

export const mergeGuestCart = async (req, res, next) => {
  try {
    const { items = [] } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return getCart(req, res, next);
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    for (const guestItem of items) {
      if (!guestItem.productId) continue;
      const product = await Product.findById(guestItem.productId);
      if (!product || !product.isActive || product.stock <= 0) continue;

      const requestedQty = Math.max(1, parseInt(guestItem.quantity, 10) || 1);
      const existing = cart.items.find(i => i.product.toString() === guestItem.productId);

      if (existing) {
        existing.quantity = Math.min(product.stock, existing.quantity + requestedQty);
      } else {
        cart.items.push({
          product: product._id,
          quantity: Math.min(product.stock, requestedQty),
          priceAtAddition: product.discountPrice || product.price
        });
      }
    }

    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name slug price discountPrice images stock brand isActive'
    });

    res.status(200).json({
      success: true,
      cart: formatCartResponse(cart)
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  mergeGuestCart
};
