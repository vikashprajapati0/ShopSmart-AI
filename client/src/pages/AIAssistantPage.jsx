import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import API from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const EXAMPLE_PROMPTS = [
  "Find wireless headphones under ₹3,000",
  "Recommend a lightweight laptop for coding & college",
  "Show me gifts under ₹1,500",
  "Compare best-selling smartwatches",
  "Suggest home espresso coffee machines"
];

const AIAssistantPage = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('query');
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm ShopSmart AI, your intelligent shopping assistant. I have direct access to our verified product catalog.\n\nTell me what you're looking for, your budget, or what you need it for (e.g. coding, running, gifting) and I'll find the best matches with real-time prices and availability!",
      products: []
    }
  ]);
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
  const initializedQueryRef = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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

  // Auto trigger query if passed via URL param
  useEffect(() => {
    if (initialQuery && !initializedQueryRef.current) {
      initializedQueryRef.current = true;
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat restarted! How can I help you discover great products today?",
        products: []
      }
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-indigo-900/40">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shrink-0">
            <Sparkles className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              AI Shopping Assistant
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Powered by real-time MongoDB catalog filtering and Gemini AI
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-xl transition backdrop-blur-md"
        >
          <RefreshCw className="w-4 h-4" /> Reset Conversation
        </button>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div className={`max-w-[85%] space-y-4 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Bubble */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Embedded Product Cards */}
                {msg.products && msg.products.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    {msg.products.map((p) => {
                      const price = p.discountPrice || p.price;
                      return (
                        <div
                          key={p._id}
                          className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                        >
                          <div className="flex gap-3 items-start">
                            <img
                              src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                              alt={p.name}
                              className="w-16 h-16 object-cover rounded-xl bg-slate-100 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block truncate">
                                {p.brand}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {p.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-sm font-extrabold text-slate-900">
                                  ₹{price.toLocaleString('en-IN')}
                                </span>
                                {p.discountPrice && (
                                  <span className="text-xs text-slate-400 line-through">
                                    ₹{p.price.toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                            <Link
                              to={`/product/${p.slug}`}
                              className="text-slate-600 hover:text-indigo-600 font-semibold flex items-center gap-1"
                            >
                              View Specs <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => addToCart(p, 1)}
                              className="bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white border border-slate-200 px-5 py-3.5 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-slate-500 font-medium ml-1">Analyzing catalog products...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Example Prompt Chips */}
        <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Suggested:</span>
          {EXAMPLE_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
              className="text-xs whitespace-nowrap bg-white hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-medium px-3.5 py-1.5 rounded-full border border-slate-200 transition shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-4 bg-white border-t border-slate-200 flex items-center gap-3 shrink-0"
        >
          <input
            type="text"
            placeholder="Type your requirements, budget, or question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-100 focus:bg-white text-sm rounded-2xl px-5 py-3.5 border border-transparent focus:border-indigo-500 outline-none transition"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold px-6 py-3.5 rounded-2xl transition shadow-md shadow-indigo-600/20 flex items-center gap-2"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistantPage;
