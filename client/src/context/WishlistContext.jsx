import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('shopsmart_guest_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await API.get('/wishlist');
      if (res.data.success) {
        setWishlist(res.data.wishlist || []);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated, fetchWishlist]);

  const isInWishlist = (productId) => {
    return wishlist.some((item) => (item._id || item) === productId);
  };

  const toggleWishlist = async (product) => {
    const productId = product._id;
    if (isAuthenticated) {
      try {
        const res = await API.post(`/wishlist/toggle/${productId}`);
        if (res.data.success) {
          setWishlist(res.data.wishlist);
          if (res.data.action === 'added') {
            showToast(`Added "${product.name}" to wishlist!`, 'success');
          } else {
            showToast(`Removed "${product.name}" from wishlist.`, 'info');
          }
        }
      } catch (err) {
        showToast('Failed to update wishlist.', 'error');
      }
    } else {
      let updated = [...wishlist];
      const exists = updated.some((p) => p._id === productId);

      if (exists) {
        updated = updated.filter((p) => p._id !== productId);
        showToast(`Removed "${product.name}" from wishlist.`, 'info');
      } else {
        updated.push(product);
        showToast(`Added "${product.name}" to wishlist!`, 'success');
      }

      setWishlist(updated);
      localStorage.setItem('shopsmart_guest_wishlist', JSON.stringify(updated));
    }
  };

  const removeFromWishlist = async (productId) => {
    if (isAuthenticated) {
      try {
        const res = await API.delete(`/wishlist/${productId}`);
        if (res.data.success) {
          setWishlist(res.data.wishlist);
          showToast('Item removed from wishlist.', 'info');
        }
      } catch (err) {
        showToast('Failed to remove from wishlist.', 'error');
      }
    } else {
      const updated = wishlist.filter((p) => p._id !== productId);
      setWishlist(updated);
      localStorage.setItem('shopsmart_guest_wishlist', JSON.stringify(updated));
      showToast('Item removed from wishlist.', 'info');
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        refreshWishlist: fetchWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;
