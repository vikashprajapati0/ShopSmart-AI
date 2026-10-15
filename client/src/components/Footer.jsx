import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Truck, RotateCcw, Headphones, Mail } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Footer = () => {
  const [email, setEmail] = useState('');
  const { showToast } = useToast();

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      showToast('Thank you for subscribing to ShopSmart AI updates!', 'success');
      setEmail('');
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      {/* Value Proposition Highlights */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Free Express Delivery</h4>
                <p className="text-xs text-slate-400 mt-0.5">On all orders above ₹999 across India</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Secure Razorpay Payments</h4>
                <p className="text-xs text-slate-400 mt-0.5">256-bit encrypted checkout protection</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Hassle-Free Returns</h4>
                <p className="text-xs text-slate-400 mt-0.5">7-day doorstep return & replacement</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">24/7 AI Shopping Assistant</h4>
                <p className="text-xs text-slate-400 mt-0.5">Instant personalized product guidance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                ShopSmart <span className="text-indigo-400">AI</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Discover, compare, and shop products through natural language conversations. Powered by real-time catalog intelligence and verified pricing.
            </p>
            <div className="pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Subscribe for exclusive deals
              </span>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-sm">
                <div className="relative flex-1">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 text-white placeholder:text-slate-500 text-sm rounded-xl pl-10 pr-3 py-2.5 border border-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-white text-sm font-semibold tracking-wider uppercase mb-4">Shop</h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/products" className="hover:text-white transition">All Products</Link>
              </li>
              <li>
                <Link to="/category/electronics" className="hover:text-white transition">Electronics</Link>
              </li>
              <li>
                <Link to="/category/fashion" className="hover:text-white transition">Fashion</Link>
              </li>
              <li>
                <Link to="/category/home-kitchen" className="hover:text-white transition">Home & Kitchen</Link>
              </li>
              <li>
                <Link to="/ai-assistant" className="text-indigo-400 hover:text-indigo-300 font-medium transition flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h5 className="text-white text-sm font-semibold tracking-wider uppercase mb-4">Customer Care</h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/dashboard?tab=orders" className="hover:text-white transition">Track Your Order</Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-white transition">My Wishlist</Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition">Shopping Cart</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">Help & Support</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition">About Us</Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h5 className="text-white text-sm font-semibold tracking-wider uppercase mb-4">Policies</h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition">Terms of Service</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">Shipping Policy</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">Refunds & Returns</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ShopSmart AI Inc. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span>Powered by Gemini AI</span>
            <span>•</span>
            <span>Razorpay Verified</span>
            <span>•</span>
            <span>MongoDB Atlas</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
