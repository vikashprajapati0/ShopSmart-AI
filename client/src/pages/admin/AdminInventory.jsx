import React, { useState, useEffect } from 'react';
import { Boxes, AlertTriangle, ArrowUpDown, Clock, Check, RefreshCw } from 'lucide-react';
import API from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminInventory = () => {
  const [lowStock, setLowStock] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick update stock state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStockVal, setNewStockVal] = useState('');
  const [updateReason, setUpdateReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const { showToast } = useToast();

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/inventory');
      if (res.data.success) {
        setLowStock(res.data.lowStock);
        setMovements(res.data.recentMovements);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedProduct || newStockVal === '') return;

    try {
      setUpdating(true);
      const res = await API.post('/admin/inventory/update-stock', {
        productId: selectedProduct._id,
        newStock: Number(newStockVal),
        reason: updateReason || 'Manual restock via inventory panel'
      });

      if (res.data.success) {
        showToast(`Stock updated for ${selectedProduct.name}`, 'success');
        setSelectedProduct(null);
        setNewStockVal('');
        setUpdateReason('');
        fetchInventory();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update stock.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Inventory & Stock Audits
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Low-stock alerts, one-click inventory adjustments, and atomic movement history
          </p>
        </div>

        <button
          onClick={fetchInventory}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Low Stock Warning Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Low-Stock Warning Products ({lowStock.length})
        </h3>

        {lowStock.length === 0 ? (
          <p className="text-xs text-emerald-600 bg-emerald-50 p-4 rounded-xl font-medium">
            ✓ All catalog items have sufficient stock levels (more than 5 units).
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-right">Quick Restock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStock.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">{p.name}</td>
                    <td className="py-3 px-4 font-mono font-semibold">{p.sku}</td>
                    <td className="py-3 px-4">{p.category?.name || 'General'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full text-[10px]">
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setNewStockVal((p.stock + 20).toString());
                        }}
                        className="bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Adjust Stock for "{selectedProduct.name}"
            </h3>

            <form onSubmit={handleUpdateStock} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Total Stock Units *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newStockVal}
                  onChange={(e) => setNewStockVal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Warehouse shipment restock batch #202"
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl"
                >
                  {updating ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recent Inventory Movements Log */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-indigo-600" />
          Recent Stock Movement Audit Log
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-y border-slate-100">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Qty Changed</th>
                <th className="py-3 px-4">Stock Before → After</th>
                <th className="py-3 px-4">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m) => (
                <tr key={m._id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(m.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                    {m.product?.name || 'Product'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="capitalize font-semibold text-slate-700">{m.type}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">
                    <span className={m.quantity >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {m.previousStock} → <strong className="text-slate-900">{m.newStock}</strong>
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{m.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminInventory;
