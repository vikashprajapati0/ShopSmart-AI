import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('shopsmart_guest_cart');
      return saved ? JSON.parse(saved) : { items: [], itemCount: 0, subtotal: 0, shippingCost: 0, total: 0 };
    } catch {
      return { items: [], itemCount: 0, subtotal: 0, shippingCost: 0, total: 0 };
    }
  });

  const [loading, setLoading] = useState(false);

  // Recalculate guest cart locally
  const calculateGuestCart = (items) => {
    let subtotal = 0;
    const formattedItems = items.map((item) => {
      const price = item.product.discountPrice || item.product.price;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;
      return {
        ...item,
        price,
        itemTotal,
        inStock: (item.product.stock || 0) >= item.quantity,
        availableStock: item.product.stock || 0
      };
    });

    const shippingCost = subtotal >= 999 || subtotal === 0 ? 0 : 99;
    const total = subtotal + shippingCost;
    const itemCount = formattedItems.reduce((acc, curr) => acc + curr.quantity, 0);

    const calculated = { items: formattedItems, itemCount, subtotal, shippingCost, total };
    localStorage.setItem('shopsmart_guest_cart', JSON.stringify(calculated));
    return calculated;
  };

  // Fetch cart from backend when authenticated
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await API.get('/cart');
      if (res.data.success) {
        setCart(res.data.cart);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Merge guest cart on login
  useEffect(() => {
    if (isAuthenticated) {
      const guestCartRaw = localStorage.getItem('shopsmart_guest_cart');
      if (guestCartRaw) {
        try {
          const guestCart = JSON.parse(guestCartRaw);
          if (guestCart.items && guestCart.items.length > 0) {
            const itemsToMerge = guestCart.items.map((i) => ({
              productId: i.product._id,
              quantity: i.quantity
            }));
            API.post('/cart/merge', { items: itemsToMerge })
              .then((res) => {
                if (res.data.success) {
                  setCart(res.data.cart);
                  localStorage.removeItem('shopsmart_guest_cart');
                }
              })
              .catch(() => {
                fetchCart();
              });
            return;
          }
        } catch {
          // ignore
        }
      }
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  const addToCart = async (product, quantity = 1) => {
    if (product.stock <= 0) {
      showToast('This product is out of stock.', 'error');
      return false;
    }

    if (isAuthenticated) {
      try {
        setLoading(true);
        const res = await API.post('/cart/items', { productId: product._id, quantity });
        if (res.data.success) {
          setCart(res.data.cart);
          showToast(`Added "${product.name}" to cart!`, 'success');
          return true;
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to add item to cart.';
        showToast(msg, 'error');
        return false;
      } finally {
        setLoading(false);
      }
    } else {
      // Guest cart local handling
      let updatedItems = [...cart.items];
      const existingIndex = updatedItems.findIndex((i) => i.product._id === product._id);

      if (existingIndex > -1) {
        const newQty = updatedItems[existingIndex].quantity + quantity;
        if (newQty > product.stock) {
          showToast(`Cannot add more. Available stock: ${product.stock}`, 'error');
          return false;
        }
        updatedItems[existingIndex].quantity = newQty;
      } else {
        updatedItems.push({
          product,
          quantity
        });
      }

      setCart(calculateGuestCart(updatedItems));
      showToast(`Added "${product.name}" to cart!`, 'success');
      return true;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        const res = await API.put(`/cart/items/${productId}`, { quantity });
        if (res.data.success) {
          setCart(res.data.cart);
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to update quantity.';
        showToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    } else {
      let updatedItems = [...cart.items];
      if (quantity <= 0) {
        updatedItems = updatedItems.filter((i) => i.product._id !== productId);
      } else {
        const item = updatedItems.find((i) => i.product._id === productId);
        if (item) {
          item.quantity = quantity;
        }
      }
      setCart(calculateGuestCart(updatedItems));
    }
  };

  const removeFromCart = async (productId) => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        const res = await API.delete(`/cart/items/${productId}`);
        if (res.data.success) {
          setCart(res.data.cart);
          showToast('Item removed from cart.', 'info');
        }
      } catch (err) {
        showToast('Failed to remove item.', 'error');
      } finally {
        setLoading(false);
      }
    } else {
      const updatedItems = cart.items.filter((i) => i.product._id !== productId);
      setCart(calculateGuestCart(updatedItems));
      showToast('Item removed from cart.', 'info');
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await API.delete('/cart');
      } catch {
        // ignore
      }
    }
    const empty = { items: [], itemCount: 0, subtotal: 0, shippingCost: 0, total: 0 };
    setCart(empty);
    localStorage.removeItem('shopsmart_guest_cart');
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
