import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  ShieldCheck,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react';
import API from '../services/api';

const OrderConfirmation = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/orders/${id}`)
      .then((res) => {
        if (res.data.success) {
          setOrder(res.data.order);
        }
      })
      .catch((err) => {
        console.error('Error fetching order details:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Order not found</h2>
        <Link to="/" className="mt-4 inline-block text-indigo-600 font-medium">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Top Success Badge */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
          Order Successfully Placed
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Thank you for your order!
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          We've received your order and our fulfillment team has started preparing your package. A confirmation has been dispatched.
        </p>
      </div>

      {/* Order Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Order Number:</span>
            <strong className="text-sm text-slate-900 font-mono">{order.orderNumber}</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Order Date:</span>
            <strong className="text-slate-900">{new Date(order.createdAt).toLocaleDateString()}</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Payment Status:</span>
            <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
              order.paymentStatus === 'completed'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {order.paymentStatus}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Order Status:</span>
            <span className="inline-block px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-indigo-100 text-indigo-800">
              {order.orderStatus}
            </span>
          </div>
        </div>

        {/* Ordered items */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Ordered Items</h3>
          <div className="divide-y divide-slate-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg bg-slate-100"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900">{item.name}</h4>
                    <span className="text-slate-400">Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <span className="font-bold text-slate-900">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing breakdown */}
        <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">₹{order.subtotal.toLocaleString('en-IN')}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Discount</span>
              <span>-₹{order.discount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Delivery Fee</span>
            <span className="font-semibold text-slate-900">
              {order.shippingCost === 0 ? <span className="text-emerald-600 font-bold uppercase">FREE</span> : `₹${order.shippingCost}`}
            </span>
          </div>
          <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-extrabold text-slate-900">
            <span>Total Paid</span>
            <span className="text-indigo-600">₹{order.total.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Shipping address details */}
        <div className="border-t border-slate-100 pt-4 text-xs text-slate-600">
          <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-indigo-600" /> Delivery Address:
          </h4>
          <p>{order.shippingAddress.fullName} • {order.shippingAddress.phone}</p>
          <p>{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to={`/dashboard?tab=orders`}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-md shadow-indigo-600/20 text-center transition flex items-center justify-center gap-2"
        >
          <Package className="w-4 h-4" />
          <span>Track in Customer Dashboard</span>
        </Link>
        <Link
          to="/products"
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-6 py-3.5 rounded-xl text-center transition"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
