import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  Heart,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ChevronRight,
  Share2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import API from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';

const ProductDetails = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review form state
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/products/slug/${slug}`);
        if (res.data.success) {
          const prod = res.data.product;
          setProduct(prod);
          setSelectedImage(0);
          setQuantity(1);

          // Fetch reviews and related products
          const [revRes, relRes] = await Promise.all([
            API.get(`/reviews/product/${prod._id}`),
            API.get(`/products/${prod._id}/related`)
          ]);

          if (revRes.data.success) setReviews(revRes.data.reviews);
          if (relRes.data.success) setRelatedProducts(relRes.data.products);
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [slug]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please log in to submit a review.', 'info');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await API.post(`/reviews/product/${product._id}`, {
        rating,
        title: reviewTitle,
        comment: reviewComment
      });

      if (res.data.success) {
        showToast('Review submitted successfully!', 'success');
        setReviews([res.data.review, ...reviews]);
        setReviewTitle('');
        setReviewComment('');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit review.';
      showToast(msg, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Product not found</h2>
        <Link to="/products" className="mt-4 inline-block text-indigo-600 font-medium">
          ← Back to Catalog
        </Link>
      </div>
    );
  }

  const isFavorited = isInWishlist(product._id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const currentPrice = product.discountPrice || product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/" className="hover:text-indigo-600 transition">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/products" className="hover:text-indigo-600 transition">Products</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to={`/category/${product.category.slug}`} className="hover:text-indigo-600 transition">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
            <img
              src={product.images?.[selectedImage] || product.images?.[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition shrink-0 ${
                    selectedImage === idx ? 'border-indigo-600 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            {/* Brand & Stock */}
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-widest text-indigo-600">
                {product.brand}
              </span>
              <div className="text-xs">
                {isOutOfStock ? (
                  <span className="text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-full">
                    Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className="text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-full">
                    Low Stock: {product.stock} units left
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> In Stock ({product.stock} available)
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              {product.name}
            </h1>

            {/* Rating & SKU */}
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-full text-amber-900 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{product.ratings?.average ? product.ratings.average.toFixed(1) : '4.5'}</span>
                <span className="text-slate-400 font-normal">({reviews.length} reviews)</span>
              </div>
              <span>•</span>
              <span className="font-mono">SKU: {product.sku}</span>
            </div>

            {/* Price section */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-slate-400 line-through">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                    Save {discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="mt-6 text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>

            {/* Quantity Selector and Buttons */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Quantity:</span>
                <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="px-3.5 py-2 text-slate-600 hover:bg-slate-50 font-bold disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-sm font-semibold text-slate-800 min-w-10 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock || isOutOfStock}
                    className="px-3.5 py-2 text-slate-600 hover:bg-slate-50 font-bold disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => addToCart(product, quantity)}
                  disabled={isOutOfStock}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-98"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product)}
                  className={`p-3.5 rounded-2xl border transition ${
                    isFavorited
                      ? 'border-rose-200 bg-rose-50 text-rose-600'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                  title={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-600' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Delivery & Security Promises */}
          <div className="grid grid-cols-3 gap-2 pt-6 border-t border-slate-200/80 text-center text-slate-500">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center">
              <Truck className="w-5 h-5 text-indigo-600 mb-1" />
              <span className="text-[11px] font-semibold text-slate-700">Free Delivery</span>
              <span className="text-[10px] text-slate-400">Over ₹999</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center">
              <ShieldCheck className="w-5 h-5 text-indigo-600 mb-1" />
              <span className="text-[11px] font-semibold text-slate-700">Razorpay Verified</span>
              <span className="text-[10px] text-slate-400">100% Secure</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center">
              <RotateCcw className="w-5 h-5 text-indigo-600 mb-1" />
              <span className="text-[11px] font-semibold text-slate-700">Easy 7-Day Return</span>
              <span className="text-[10px] text-slate-400">Doorstep pickup</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Table */}
      {product.specifications?.length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Technical Specifications</h3>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {product.specifications.map((spec, i) => (
              <div key={i} className={`flex flex-col sm:flex-row py-3 px-4 text-xs ${i % 2 === 0 ? 'bg-slate-50/60' : 'bg-white'}`}>
                <span className="font-semibold text-slate-600 sm:w-1/3">{spec.name}</span>
                <span className="text-slate-900 sm:w-2/3 mt-0.5 sm:mt-0 font-medium">{spec.value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Customer Reviews Section */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Customer Ratings & Reviews</h3>
            <p className="text-xs text-slate-500 mt-1">Verified reviews from authentic customers</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < Math.round(product.ratings?.average || 4.5) ? 'fill-amber-400' : 'text-slate-200'}`}
                />
              ))}
            </div>
            <span className="text-lg font-bold text-slate-900">
              {product.ratings?.average?.toFixed(1) || '4.5'}
            </span>
          </div>
        </div>

        {/* Write a Review Form */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
          <h4 className="text-sm font-bold text-slate-900 mb-3">Leave a Review</h4>
          {!isAuthenticated ? (
            <p className="text-xs text-slate-500">
              Please <Link to="/login" className="text-indigo-600 font-bold underline">log in</Link> to share your review for this product.
            </p>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Your Rating:</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setRating(s)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-6 h-6 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{rating} out of 5</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Review Title</label>
                <input
                  type="text"
                  placeholder="Summarize your experience (optional)"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full bg-white text-xs rounded-xl px-3 py-2 border border-slate-200 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Detailed Review *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="What did you like or dislike about this product?"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full bg-white text-xs rounded-xl p-3 border border-slate-200 focus:border-indigo-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No reviews yet. Be the first to review this product!</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev._id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      {rev.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{rev.user?.name || 'Verified Buyer'}</span>
                      <span className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>

                {rev.title && <h5 className="text-xs font-bold text-slate-800 mt-2.5">{rev.title}</h5>}
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rev.comment}</p>
                {rev.isVerifiedPurchase && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 mt-2">
                    <Check className="w-3 h-3" /> Verified Purchase
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900">Related Products</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetails;
