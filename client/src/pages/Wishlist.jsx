import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = (product) => {
    addToCart(product, 1);
    removeFromWishlist(product._id);
  };

  if (wishlist.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200/80 p-10 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-5">
            <Heart className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Your wishlist is empty</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            Save items that you like by clicking the heart icon on any product card, and find them all here when you're ready to purchase.
          </p>
          <div className="mt-8">
            <Link
              to="/products"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6 py-3 rounded-xl transition shadow-sm inline-flex items-center gap-1.5"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Saved Wishlist
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {wishlist.length} item{wishlist.length > 1 ? 's' : ''} saved for later
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlist.map((product) => {
          const price = product.discountPrice || product.price;
          const isOutOfStock = product.stock <= 0;

          return (
            <div
              key={product._id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
            >
              <div>
                <Link to={`/product/${product.slug}`} className="block aspect-square bg-slate-100 overflow-hidden">
                  <img
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                <div className="p-4 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {product.brand}
                  </span>
                  <Link
                    to={`/product/${product.slug}`}
                    className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition truncate block"
                  >
                    {product.name}
                  </Link>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold text-slate-900">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    {product.discountPrice && (
                      <span className="text-xs text-slate-400 line-through">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 space-y-2">
                <button
                  onClick={() => handleMoveToCart(product)}
                  disabled={isOutOfStock}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Out of Stock' : 'Move to Cart'}</span>
                </button>

                <button
                  onClick={() => removeFromWishlist(product._id)}
                  className="w-full text-slate-400 hover:text-rose-600 text-xs font-semibold py-1.5 transition flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Wishlist;
