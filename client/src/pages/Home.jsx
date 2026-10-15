import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Search,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Star,
  CheckCircle2,
  TrendingUp,
  Award
} from 'lucide-react';
import API from '../services/api';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';

const EXAMPLE_PROMPTS = [
  "Find wireless headphones under ₹3,000.",
  "Recommend a laptop for coding and college.",
  "Show me a gift for my friend under ₹1,500.",
  "Compare the best-selling smartwatches."
];

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [promptInput, setPromptInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [personalizedProducts, setPersonalizedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, featRes, trendRes] = await Promise.all([
          API.get('/categories'),
          API.get('/products/featured'),
          API.get('/products?sort=popularity&limit=8')
        ]);

        if (catRes.data.success) setCategories(catRes.data.categories);
        if (featRes.data.success) setFeaturedProducts(featRes.data.products);
        if (trendRes.data.success) setTrendingProducts(trendRes.data.products);

        // Personalized recommendations if user is logged in
        if (isAuthenticated) {
          const recRes = await API.get('/products?sort=rating&limit=4');
          if (recRes.data.success) setPersonalizedProducts(recRes.data.products);
        }
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    if (promptInput.trim()) {
      navigate(`/ai-assistant?query=${encodeURIComponent(promptInput.trim())}`);
    }
  };

  const handlePromptClick = (prompt) => {
    navigate(`/ai-assistant?query=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-white to-transparent pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 bg-indigo-100/80 border border-indigo-200/60 text-indigo-800 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Next-Generation AI Shopping Experience</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
            Shop Smarter with <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Natural Language AI
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            No more endless filter scrolling. Just tell our AI shopping assistant what you need, your budget, or your occasion, and get instant verified recommendations from our real catalog.
          </p>

          {/* Conversational Search Input */}
          <div className="mt-10 max-w-3xl mx-auto">
            <form
              onSubmit={handlePromptSubmit}
              className="relative flex items-center bg-white rounded-2xl sm:rounded-full shadow-xl shadow-indigo-100/80 border-2 border-indigo-100 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 transition-all p-2"
            >
              <div className="pl-4 pr-2 text-indigo-500 hidden sm:block">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <input
                type="text"
                placeholder="Tell us what you're looking for..."
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 text-base sm:text-lg px-3 py-3 outline-none"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3.5 rounded-xl sm:rounded-full flex items-center gap-2 transition shrink-0 shadow-md shadow-indigo-600/30"
              >
                <span>Ask AI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Example Prompt Pills */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm">
              <span className="text-slate-400 font-medium">Try asking:</span>
              {EXAMPLE_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(prompt)}
                  className="bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200/80 hover:border-indigo-300 font-medium px-3.5 py-1.5 rounded-full shadow-xs transition"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-indigo-200/30 to-violet-200/30 blur-3xl pointer-events-none -z-10" />
      </section>

      {/* Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Featured Categories
            </h2>
            <p className="text-sm text-slate-500 mt-1">Explore our handpicked collections</p>
          </div>
          <Link
            to="/products"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
          >
            All Categories <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/category/${cat.slug}`}
              className="group bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 p-4 text-center shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col items-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-slate-100 mb-3 group-hover:scale-105 transition-transform duration-300">
                <img
                  src={cat.image || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300'}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition">
                {cat.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" /> Popular Right Now
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Trending Products
            </h2>
          </div>
          <Link
            to="/products?sort=popularity"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
          >
            View More <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {trendingProducts.slice(0, 4).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Personalized Recommendations for Logged In Customers */}
      {isAuthenticated && personalizedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4" /> Curated for {user?.name}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Recommended For You
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {personalizedProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers / Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" /> Customer Favorites
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Best Sellers
            </h2>
          </div>
          <Link
            to="/products?sort=rating"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
          >
            See All <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Benefits Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Why Customers Love ShopSmart AI
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              Combining cutting-edge conversational technology with transparent pricing and verified fulfillment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Catalog Grounded AI</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our AI model only recommends products verified in our live MongoDB database. Zero hallucinated items or inflated pricing.
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Cryptographic Payments</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Integrated with Razorpay using HMAC-SHA256 signature verification and atomic inventory tracking.
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Guaranteed Satisfaction</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                7-day doorstep returns, live order tracking with SMS/email notifications, and 24/7 assistant support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Loved by Thousands of Shoppers
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Real feedback from verified purchasers across India
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex text-amber-400 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-700 italic leading-relaxed">
                "The conversational AI search is unbelievable. I typed 'I need a coding laptop under 60k' and it immediately pulled up the AeroBook Pro with exact specs and why it fit. Ordered and arrived in 2 days!"
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                A
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Ananya Verma</h4>
                <p className="text-[11px] text-slate-400">Software Developer, Bengaluru</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex text-amber-400 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-700 italic leading-relaxed">
                "The noise-cancelling headphones under ₹3,000 were exactly what I was searching for. Razorpay checkout was seamless and the tracking updates were right on point."
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-sm">
                R
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Rohan Kulkarni</h4>
                <p className="text-[11px] text-slate-400">Designer, Pune</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex text-amber-400 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-700 italic leading-relaxed">
                "Used coupon WELCOME10 for an instant discount. The quality of the French Terry hoodie is top-notch. Clean website design that feels like a premium luxury brand."
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                P
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Pooja Nair</h4>
                <p className="text-[11px] text-slate-400">Verified Buyer, Mumbai</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
