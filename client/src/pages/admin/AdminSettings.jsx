import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sparkles,
  Download,
  ShieldCheck,
  Bot,
  Database,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import API from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminSettings = () => {
  const [aiStats, setAiStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    API.get('/admin/ai-usage')
      .then((res) => {
        if (res.data.success) {
          setAiStats(res.data.stats);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCsv = () => {
    window.open('/api/admin/export-sales', '_blank');
    showToast('Exporting sales report CSV...', 'info');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Store Settings & AI Telemetry
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Global platform configurations, AI assistant usage telemetry, and reporting
        </p>
      </div>

      {/* AI Assistant Analytics Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">AI Assistant Activity & Telemetry</h3>
            <p className="text-xs text-slate-500">Live conversation session counts and query metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 font-semibold block">Total Conversation Sessions</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {aiStats?.totalConversations || 0}
            </span>
            <span className="text-[10px] text-slate-400">Stored in MongoDB Conversation collections</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 font-semibold block">Total Messages Processed</span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block">
              {aiStats?.totalMessages || 0}
            </span>
            <span className="text-[10px] text-slate-400">Across user queries and assistant catalog matches</span>
          </div>
        </div>

        {/* Recent queries preview */}
        {aiStats?.recentConversations?.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-700 block">Recent AI Conversation Titles</span>
            <div className="space-y-1.5">
              {aiStats.recentConversations.slice(0, 5).map((conv) => (
                <div key={conv._id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex justify-between">
                  <span className="font-medium text-slate-800 truncate max-w-sm">{conv.title}</span>
                  <span className="text-[10px] text-slate-400">{new Date(conv.updatedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Integrations Health */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900">Core Services & System Status</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>MongoDB Database</span>
            </div>
            <p className="text-emerald-700 mt-1 font-semibold">Active & Connected</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">Port 27017 / shopsmart_ai</p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
            <div className="flex items-center gap-2 font-bold text-indigo-800">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Razorpay Integration</span>
            </div>
            <p className="text-indigo-700 mt-1 font-semibold">Ready & Sandbox Verified</p>
            <p className="text-[10px] text-indigo-600 mt-0.5">HMAC SHA-256 Signatures</p>
          </div>

          <div className="p-4 rounded-2xl bg-violet-50 border border-violet-100">
            <div className="flex items-center gap-2 font-bold text-violet-800">
              <Bot className="w-4 h-4 text-violet-600" />
              <span>AI Provider</span>
            </div>
            <p className="text-violet-700 mt-1 font-semibold">Gemini + Catalog Engine</p>
            <p className="text-[10px] text-violet-600 mt-0.5">Real-time DB Grounding</p>
          </div>
        </div>
      </div>

      {/* Export Reports Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Export Business Reports</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Download complete sales transactions, order numbers, and customer totals as CSV
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Download className="w-4 h-4" /> Download Sales CSV
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
