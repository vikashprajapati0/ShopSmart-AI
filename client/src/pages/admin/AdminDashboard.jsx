import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Clock,
  Sparkles,
  Download
} from 'lucide-react';
import API from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/dashboard')
      .then((res) => {
        if (res.data.success) {
          setStats(res.data.stats);
          setRecentOrders(res.data.recentOrders);
        }
      })
      .catch((err) => console.error('Error fetching admin dashboard stats:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCsv = async () => {
    try {
      window.open('/api/admin/export-sales', '_blank');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">Loading administrator dashboard...</div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time business performance from MongoDB aggregation queries
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" /> Export Sales CSV
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Confirmed Sales</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              ₹{(stats?.totalSales || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Excludes cancelled & unpaid</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Orders</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {stats?.totalOrders || 0}
            </span>
            <span className="text-xs font-semibold text-slate-500">Orders</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {stats?.pendingOrders || 0} currently pending fulfillment
          </p>
        </div>

        {/* Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Customers</span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {stats?.totalCustomers || 0}
            </span>
            <span className="text-xs font-semibold text-slate-500">Registered</span>
          </div>
          <p className="text-[11px] text-slate-400">Customer role accounts</p>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg. Order Value</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              ₹{(stats?.avgOrderValue || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Per confirmed order</p>
        </div>
      </div>

      {/* Low-stock Warning Banner */}
      {stats?.lowStockProducts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="text-amber-900">Inventory Notice:</strong>{' '}
              <span className="text-amber-800">
                {stats.lowStockProducts} products have 5 or fewer items remaining in stock.
              </span>
            </div>
          </div>
          <Link
            to="/admin/inventory"
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 rounded-lg shrink-0 transition"
          >
            Review Stock
          </Link>
        </div>
      )}

      {/* Recent Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Recent Customer Orders</h3>
          <Link
            to="/admin/orders"
            className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
          >
            View All Orders <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-y border-slate-100">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((o) => (
                <tr key={o._id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {o.orderNumber}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {o.customer?.name || o.shippingAddress?.fullName}
                  </td>
                  <td className="py-3.5 px-4">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    ₹{o.total.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="uppercase text-[10px] font-bold text-slate-500">
                      {o.paymentProvider} ({o.paymentStatus})
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      o.orderStatus === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : o.orderStatus === 'cancelled'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {o.orderStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
