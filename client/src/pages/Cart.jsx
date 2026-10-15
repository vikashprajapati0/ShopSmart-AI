import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Tag,
  Check,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import API from '../services/api';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const subtotal = cart.subtotal || 0;
  const freeShippingThreshold = 999;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shippingCost = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 99;
  const finalTotal = Math.max(0, subtotal - couponDiscount + shippingCost);

  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;

    try {
      setValidatingCoupon(true);
      // Validate coupon with backend
      const res = await API.get('/categories'); // ping check
      // Calculate coupon locally or against server
      let discount = 0;
      if (code === 'WELCOME10') {
        if (subtotal >= 500) {
          discount = Math.min(1000, Math.round(subtotal * 0.1));
          setAppliedCoupon({ code, discountValue: 10, discountType: 'percentage' });
          setCouponDiscount(discount);
          showToast('Coupon WELCOME10 applied! 10% discount added.', 'success');
        } else {
          showToast('Minimum order of ₹500 required for WELCOME10', 'error');
        }
      } else if (code === 'SMART500') {
        if (subtotal >= 2999) {
          discount = 500;
          setAppliedCoupon({ code, discountValue: 500, discountType: 'fixed' });
          setCouponDiscount(discount);
          showToast('Coupon SMART500 applied! ₹500 discount added.', 'success');
        } else {
          showToast('Minimum order of ₹2,999 required for SMART500', 'error');
        }
      } else if (code === 'FESTIVE20') {
        if (subtotal >= 1500) {
          discount = Math.min(2000, Math.round(subtotal * 0.2));
          setAppliedCoupon({ code, discountValue: 20, discountType: 'percentage' });
          setCouponDiscount(discount);
          showToast('Coupon FESTIVE20 applied! 20% discount added.', 'success');
        } else {
          showToast('Minimum order of ₹1,500 required for FESTIVE20', 'error');
        }
      } else {
        showToast('Invalid or expired coupon code.', 'error');
      }
    } catch {
      showToast('Error verifying coupon.', 'error');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    showToast('Coupon removed.', 'info');
  };

  if (cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200/80 p-10 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Your cart is empty</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            Looks like you haven't added any products to your shopping cart yet. Discover items through our catalog or ask our AI assistant!
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/products"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6 py-3 rounded-xl transition shadow-sm"
            >
              Browse Products
            </Link>
            <Link
              to="/ai-assistant"
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs px-6 py-3 rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Ask AI Assistant
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            You have <strong className="text-slate-800">{cart.itemCount} items</strong> in your cart
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition"
        >
          Clear Cart
        </button>
      </div>

      {/* Free Shipping Progress bar */}
      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          {amountToFreeShipping > 0 ? (
            <p className="text-indigo-900 font-semibold">
              Add <strong className="text-indigo-600">₹{amountToFreeShipping.toLocaleString('en-IN')}</strong> more to get <strong className="text-emerald-700">FREE EXPRESS DELIVERY</strong>!
            </p>
          ) : (
            <p className="text-emerald-800 font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> You've unlocked FREE EXPRESS DELIVERY!
            </p>
          )}
        </div>
        <div className="w-full sm:w-48 bg-indigo-200 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
          />
        </div>
      </div>

      {/* Cart Grid: Items Table + Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const product = item.product;
            const price = item.price;

            return (
              <div
                key={product._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Product info */}
                <div className="flex items-center gap-4 min-w-0">
                  <Link to={`/product/${product.slug}`} className="shrink-0">
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                      alt={product.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl bg-slate-100"
                    />
                  </Link>

                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {product.brand}
                    </span>
                    <Link
                      to={`/product/${product.slug}`}
                      className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition truncate block"
                    >
                      {product.name}
                    </Link>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{price.toLocaleString('en-IN')}
                      </span>
                      {product.discountPrice && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quantity and Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-2xs">
                    <button
                      onClick={() => updateQuantity(product._id, item.quantity - 1)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-50 font-bold"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-semibold text-slate-800 min-w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product._id, item.quantity + 1)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-50 font-bold"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-sm font-bold text-slate-900 min-w-20 text-right">
                    ₹{(price * item.quantity).toLocaleString('en-IN')}
                  </span>

                  <button
                    onClick={() => removeFromCart(product._id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 pt-2"
          >
            <ChevronLeft className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>

        {/* Order Summary Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm sticky top-28 space-y-6">
            <h3 className="text-base font-extrabold text-slate-900">Order Summary</h3>

            {/* Price Calculations */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Estimated Shipping</span>
                <span className="font-semibold text-slate-900">
                  {shippingCost === 0 ? <span className="text-emerald-600 uppercase font-bold">FREE</span> : `₹${shippingCost}`}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-bold text-slate-900">
                <span>Total Amount</span>
                <span className="text-xl text-indigo-600 font-extrabold">
                  ₹{finalTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Coupon Application Box */}
            <div className="pt-4 border-t border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Apply Promo Code
              </span>

              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span>{appliedCoupon.code} Applied</span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 text-xs uppercase rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleApplyCoupon()}
                      disabled={!couponCode.trim() || validatingCoupon}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                    >
                      {validatingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>

                  {/* Coupon Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['WELCOME10', 'SMART500', 'FESTIVE20'].map((code) => (
                      <button
                        key={code}
                        onClick={() => handleApplyCoupon(code)}
                        className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-200"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Checkout Action */}
            <button
              onClick={() => navigate('/checkout', { state: { couponCode: appliedCoupon?.code } })}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-98"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe & Secure 256-Bit SSL Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
