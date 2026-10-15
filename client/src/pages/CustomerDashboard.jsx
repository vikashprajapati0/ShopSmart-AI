import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  User,
  Package,
  MapPin,
  Heart,
  Plus,
  Trash2,
  Calendar,
  Truck,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../services/api';

const CustomerDashboard = () => {
  const { user, updateProfile, addAddress, deleteAddress, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'orders';

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Add Address Form Modal
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false
  });

  useEffect(() => {
    if (activeTab === 'orders') {
      setOrdersLoading(true);
      API.get('/orders/my-orders')
        .then((res) => {
          if (res.data.success) {
            setOrders(res.data.orders);
          }
        })
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    }
  }, [activeTab]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    await updateProfile({ name, phone, avatar });
    setSavingProfile(false);
  };

  const handleAddAddressSubmit = async (e) => {
    e.preventDefault();
    const res = await addAddress(newAddress);
    if (res.success) {
      setAddressModalOpen(false);
      setNewAddress({
        fullName: user?.name || '',
        phone: user?.phone || '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        isDefault: false
      });
      refreshUser();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-indigo-50 shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-indigo-100 text-indigo-700 font-bold text-2xl flex items-center justify-center shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}

          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {user?.name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full">
                Customer Account
              </span>
              {user?.phone && (
                <span className="text-xs text-slate-400 font-medium">
                  • {user.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {user?.role === 'admin' && (
          <Link
            to="/admin"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" /> Go to Admin Console
          </Link>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          onClick={() => setSearchParams({ tab: 'orders' })}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" /> My Orders ({orders.length})
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'addresses' })}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'addresses'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4" /> Saved Addresses ({user?.addresses?.length || 0})
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'profile' })}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" /> Profile Settings
        </button>
      </div>

      {/* Tab Content */}
      {/* 1. Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {ordersLoading ? (
            <div className="p-12 text-center text-slate-400">Loading your orders...</div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 text-base">No orders yet</h3>
              <p className="text-xs text-slate-500 mt-1">Start shopping to view your past purchases and track deliveries.</p>
              <Link to="/products" className="mt-4 inline-block bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl">
                Browse Products
              </Link>
            </div>
          ) : (
            orders.map((o) => (
              <div
                key={o._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 hover:border-indigo-200 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Order:</span>
                    <strong className="text-slate-900 font-mono text-sm">{o.orderNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Date:</span>
                    <span className="text-slate-800 font-semibold">{new Date(o.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Payment:</span>
                    <span className="inline-block px-2 py-0.5 rounded-full font-bold uppercase text-[10px] bg-slate-100 text-slate-800">
                      {o.paymentProvider} • {o.paymentStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Status:</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      o.orderStatus === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : o.orderStatus === 'cancelled'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {o.orderStatus}
                    </span>
                  </div>
                </div>

                {/* Items preview */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-x-auto py-1">
                    {o.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 shrink-0">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-lg bg-slate-200"
                        />
                        <div className="text-xs">
                          <p className="font-semibold text-slate-900 max-w-[140px] truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-400">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 ml-auto">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Total</span>
                      <strong className="text-base text-indigo-600 font-extrabold">
                        ₹{o.total.toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <Link
                      to={`/order-confirmation/${o._id}`}
                      className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1"
                    >
                      Track <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. Addresses Tab */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Saved Delivery Addresses</h3>
            <button
              onClick={() => setAddressModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Address
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {user?.addresses?.map((addr) => (
              <div
                key={addr._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{addr.fullName}</span>
                    {addr.isDefault && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {addr.street}, {addr.city}, {addr.state} - {addr.postalCode}
                  </p>
                  <p className="text-[11px] text-slate-500">Phone: {addr.phone}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => deleteAddress(addr._id)}
                    className="text-xs text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Profile Settings Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 max-w-xl shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-6">Personal Profile Details</h3>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-slate-100 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 text-slate-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400">Email cannot be changed directly</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Avatar Image URL</label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm transition"
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Add Address Modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add New Delivery Address</h3>

            <form onSubmit={handleAddAddressSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Receiver Name</label>
                <input
                  type="text"
                  required
                  value={newAddress.fullName}
                  onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Postal PIN Code</label>
                  <input
                    type="text"
                    required
                    value={newAddress.postalCode}
                    onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition"
                >
                  Save Address
                </button>
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
