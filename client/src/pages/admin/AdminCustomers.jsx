import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, Calendar, ShoppingBag } from 'lucide-react';
import API from '../../services/api';
import Pagination from '../../components/Pagination';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    API.get(`/admin/customers?page=${page}&limit=12`)
      .then((res) => {
        if (res.data.success) {
          setCustomers(res.data.customers);
          setTotalPages(res.data.totalPages);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Customer Management
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Directory of registered store patrons, order counts, and lifetime value
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-center">Orders Placed</th>
                <th className="py-3 px-4 text-right">Lifetime Spent</th>
                <th className="py-3 px-4 text-right">Registered On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {c.name?.charAt(0) || 'C'}
                    </div>
                    <span>{c.name}</span>
                  </td>
                  <td className="py-3.5 px-4">{c.email}</td>
                  <td className="py-3.5 px-4">{c.phone || '—'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      {c.totalOrders || 0} Orders
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                    ₹{(c.totalSpent || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
        </div>
      </div>
    </div>
  );
};

export default AdminCustomers;
