import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  Bot,
  User as UserIcon,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import API from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const EXAMPLE_PROMPTS = [
  "Find wireless headphones under ₹3,000",
  "Recommend a laptop for coding & college",
  "Show me gifts under ₹1,500",
  "Compare best-selling smartwatches"
];

const AIAssistantModal = () => {
  const location = useLocation();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState(() => {
    return [
      {
        role: 'assistant',
        content: "Hi there! I'm your ShopSmart AI assistant. Ask me anything—I can search our real-time catalog, compare products, or help you find the best items within your budget!",
        products: []
      }
    ];
  });
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => {
    let sid = localStorage.getItem('shopsmart_ai_session');
    if (!sid) {
      sid = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('shopsmart_ai_session', sid);
    }
    return sid;
  });

  const chatEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Don't render floating bubble if user is already on the dedicated /ai-assistant page
  if (location.pathname === '/ai-assistant') {
    return null;
  }

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await API.post('/ai/chat', {
        message: text.trim(),
        sessionId
      });

      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.reply,
            products: res.data.products || []
          }
        ]);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Sorry, I encountered an issue searching the catalog. Please try again.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: errorMsg,
          products: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared! What products or recommendations are you looking for today?",
        products: []
      }
    ]);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-medium p-4 sm:px-5 sm:py-3.5 rounded-full shadow-2xl shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-300"
          aria-label="Open AI Shopping Assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <span className="hidden sm:inline-block text-sm font-semibold tracking-wide">
            ShopSmart AI
          </span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden ${
            isExpanded
              ? 'inset-4 sm:inset-10 md:inset-16 max-w-5xl mx-auto'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[440px] h-[600px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-indigo-900/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  AI Shopping Assistant
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h3>
                <p className="text-[11px] text-slate-300">Live MongoDB Catalog Search</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={handleResetChat}
                title="Restart Chat"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Collapse' : 'Expand'}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition hidden sm:block"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Render matched products if any */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {msg.products.map((p) => {
                        const price = p.discountPrice || p.price;
                        return (
                          <div
                            key={p._id}
                            className="bg-white p-3 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-sm transition flex flex-col justify-between"
                          >
                            <div className="flex gap-2.5 items-start">
                              <img
                                src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                                alt={p.name}
                                className="w-14 h-14 object-cover rounded-lg bg-slate-100 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                                  {p.brand}
                                </span>
                                <h4 className="text-xs font-semibold text-slate-900 truncate">
                                  {p.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-bold text-indigo-600">
                                    ₹{price.toLocaleString('en-IN')}
                                  </span>
                                  {p.discountPrice && (
                                    <span className="text-[10px] text-slate-400 line-through">
                                      ₹{p.price.toLocaleString('en-IN')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                              <Link
                                to={`/product/${p.slug}`}
                                onClick={() => setIsOpen(false)}
                                className="text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-0.5"
                              >
                                View <ChevronRight className="w-3 h-3" />
                              </Link>
                              <button
                                onClick={() => addToCart(p, 1)}
                                className="bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white px-2.5 py-1 rounded-lg font-semibold transition"
                              >
                                + Add to Cart
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-slate-500 font-medium ml-1">Searching catalog...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompt Pills */}
          <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {EXAMPLE_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                className="text-[11px] whitespace-nowrap bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium px-3 py-1.5 rounded-full border border-slate-200/60 transition"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Tell me what you're looking for..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
              className="flex-1 bg-slate-100 focus:bg-white text-sm rounded-xl px-4 py-2.5 border border-transparent focus:border-indigo-500 outline-none transition"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white p-2.5 rounded-xl transition shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIAssistantModal;
