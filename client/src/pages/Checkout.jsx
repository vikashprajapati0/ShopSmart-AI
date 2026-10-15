import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  Plus,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import API from '../services/api';

const Checkout = () => {
  const { user, isAuthenticated } = useAuth();
  const { cart, clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const couponCode = location.state?.couponCode || '';

  // Address selection
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [newAddressForm, setNewAddressForm] = useState(false);
  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });

  const [paymentProvider, setPaymentProvider] = useState('razorpay');
  const [processing, setProcessing] = useState(false);

  // Simulation modal state if Razorpay SDK test mode is simulated
  const [simulationModal, setSimulationModal] = useState({
    isOpen: false,
    orderData: null,
    razorpayData: null
  });

  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      const defaultIdx = user.addresses.findIndex((a) => a.isDefault);
      setSelectedAddressIndex(defaultIdx > -1 ? defaultIdx : 0);
      const chosen = user.addresses[defaultIdx > -1 ? defaultIdx : 0];
      setAddress({
        fullName: chosen.fullName,
        phone: chosen.phone,
        street: chosen.street,
        city: chosen.city,
        state: chosen.state,
        postalCode: chosen.postalCode,
        country: chosen.country || 'India'
      });
    }
  }, [user]);

  // Load Razorpay official checkout script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Your cart is empty</h2>
        <p className="text-xs text-slate-500 mt-2">Add items to your cart before proceeding to checkout.</p>
        <Link to="/products" className="mt-6 inline-block bg-indigo-600 text-white font-bold text-xs px-6 py-3 rounded-xl">
          Browse Products
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!address.fullName || !address.phone || !address.street || !address.city || !address.postalCode) {
      showToast('Please provide a complete delivery address.', 'error');
      return;
    }

    try {
      setProcessing(true);

      // 1. Create order on the backend with server-verified prices
      const orderRes = await API.post('/orders', {
        shippingAddress: address,
        couponCode: couponCode || undefined,
        paymentProvider
      });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || 'Failed to initialize order');
      }

      const { order, razorpayOrder } = orderRes.data;

      // 2. Handle Cash On Delivery
      if (paymentProvider === 'cod') {
        clearCart();
        showToast('Order confirmed via Cash on Delivery!', 'success');
        navigate(`/order-confirmation/${order._id}`);
        return;
      }

      // 3. Handle Razorpay Online Payment
      if (paymentProvider === 'razorpay') {
        // Check if simulation mode (when live razorpay test keys aren't configured or dev mode)
        if (razorpayOrder.isSimulation || !window.Razorpay) {
          setSimulationModal({
            isOpen: true,
            orderData: order,
            razorpayData: razorpayOrder
          });
          setProcessing(false);
          return;
        }

        // Open official Razorpay Checkout SDK
        const options = {
          key: razorpayOrder.keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'ShopSmart AI',
          description: `Order #${order.orderNumber}`,
          order_id: razorpayOrder.id,
          handler: async function (response) {
            try {
              // 4. Verify payment signature on the backend
              const verifyRes = await API.post('/payments/razorpay/verify', {
                orderId: order._id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              });

              if (verifyRes.data.success) {
                clearCart();
                showToast('Payment verified successfully!', 'success');
                navigate(`/order-confirmation/${order._id}`);
              }
            } catch (err) {
              showToast(err.response?.data?.message || 'Payment signature verification failed.', 'error');
            }
          },
          prefill: {
            name: user?.name || address.fullName,
            email: user?.email || '',
            contact: address.phone
          },
          theme: {
            color: '#4f46e5'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          showToast(`Payment failed: ${response.error.description}`, 'error');
        });
        rzp.open();
        setProcessing(false);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to place order.';
      showToast(msg, 'error');
      setProcessing(false);
    }
  };

  // Handler for simulated sandbox payment testing
  const handleSimulatedPayment = async (success = true) => {
    const { orderData, razorpayData } = simulationModal;

    try {
      setProcessing(true);

      if (!success) {
        setSimulationModal({ isOpen: false, orderData: null, razorpayData: null });
        showToast('Payment was cancelled or failed.', 'error');
        setProcessing(false);
        return;
      }

      const mockPaymentId = `pay_sim_${Date.now()}`;
      const mockSignature = `sim_sig_${razorpayData.id}_${mockPaymentId}`;

      const verifyRes = await API.post('/payments/razorpay/verify', {
        orderId: orderData._id,
        razorpayOrderId: razorpayData.id,
        razorpayPaymentId: mockPaymentId,
        razorpaySignature: mockSignature
      });

      if (verifyRes.data.success) {
        clearCart();
        setSimulationModal({ isOpen: false, orderData: null, razorpayData: null });
        showToast('Payment verified and stock updated successfully!', 'success');
        navigate(`/order-confirmation/${orderData._id}`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Verification failed.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Checkout
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Provide your delivery details and choose your preferred payment method
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Shipping Address & Payment Selection */}
        <div className="lg:col-span-2 space-y-8">
          {/* Shipping Address Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                1. Delivery Address
              </h2>
            </div>

            {/* Saved addresses picker if available */}
            {user?.addresses?.length > 0 && !newAddressForm && (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Select a saved address:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {user.addresses.map((addr, idx) => (
                    <div
                      key={addr._id}
                      onClick={() => {
                        setSelectedAddressIndex(idx);
                        setAddress({
                          fullName: addr.fullName,
                          phone: addr.phone,
                          street: addr.street,
                          city: addr.city,
                          state: addr.state,
                          postalCode: addr.postalCode,
                          country: addr.country
                        });
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition ${
                        selectedAddressIndex === idx
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">{addr.fullName}</span>
                        {selectedAddressIndex === idx && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {addr.street}, {addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">Phone: {addr.phone}</p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setNewAddressForm(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-2"
                >
                  <Plus className="w-4 h-4" /> Add a new address
                </button>
              </div>
            )}

            {/* Manual Address Form */}
            {(newAddressForm || !user?.addresses?.length) && (
              <div className="space-y-4">
                {user?.addresses?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setNewAddressForm(false)}
                    className="text-xs font-semibold text-indigo-600 hover:underline mb-2 block"
                  >
                    ← Choose from saved addresses
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Receiver's name"
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Street Address & House/Flat No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="Apartment, suite, street name"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">State *</label>
                    <input
                      type="text"
                      required
                      placeholder="State"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Postal Code (PIN) *</label>
                    <input
                      type="text"
                      required
                      placeholder="6-digit PIN"
                      value={address.postalCode}
                      onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                2. Payment Method
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Razorpay Option */}
              <label
                className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition ${
                  paymentProvider === 'razorpay'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="razorpay"
                      checked={paymentProvider === 'razorpay'}
                      onChange={() => setPaymentProvider('razorpay')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-900">Razorpay Secure</span>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  UPI (GPay/PhonePe), Credit & Debit Cards, NetBanking, and Wallets. Verified by Razorpay.
                </p>
              </label>

              {/* Cash On Delivery Option */}
              <label
                className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition ${
                  paymentProvider === 'cod'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentProvider === 'cod'}
                      onChange={() => setPaymentProvider('cod')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-900">Cash on Delivery (COD)</span>
                  </div>
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Pay with cash or UPI directly to our delivery courier at your doorstep upon receiving the package.
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Review */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm sticky top-28 space-y-6">
            <h3 className="text-base font-extrabold text-slate-900">Order Items</h3>

            {/* Item list snapshot */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.items.map((item) => (
                <div key={item.product._id} className="flex items-center gap-3 text-xs">
                  <img
                    src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded-lg bg-slate-100 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-slate-400">Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</p>
                  </div>
                  <span className="font-bold text-slate-900">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₹{cart.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="font-semibold text-slate-900">
                  {cart.shippingCost === 0 ? <span className="text-emerald-600 font-bold uppercase">FREE</span> : `₹${cart.shippingCost}`}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-bold text-slate-900">
                <span>Total to Pay</span>
                <span className="text-xl text-indigo-600 font-extrabold">
                  ₹{cart.total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={processing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-98"
            >
              {processing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{paymentProvider === 'cod' ? 'Confirm COD Order' : 'Pay with Razorpay'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Payments are cryptographically verified on our backend.</span>
            </div>
          </div>
        </div>
      </form>

      {/* Development Razorpay Sandbox Simulation Modal */}
      {simulationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Razorpay Payment Sandbox</h3>
                <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Developer Mode Simulation
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Order Number:</span>
                <strong className="text-slate-900 font-mono">{simulationModal.orderData?.orderNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <strong className="text-indigo-600 font-extrabold text-sm">
                  ₹{simulationModal.orderData?.total.toLocaleString('en-IN')}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="text-slate-800">{simulationModal.orderData?.shippingAddress?.fullName}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              This sandbox simulated checkout allows end-to-end testing of Razorpay order generation, HMAC-SHA256 signature verification, inventory atomic updates, and transactional confirmation emails without requiring live credentials.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleSimulatedPayment(true)}
                disabled={processing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulate Successful Payment (200 OK)</span>
              </button>

              <button
                onClick={() => handleSimulatedPayment(false)}
                disabled={processing}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition text-xs"
              >
                Simulate Payment Failure / Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
