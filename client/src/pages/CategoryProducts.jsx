import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import API from '../services/api';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/LoadingSkeleton';

const CategoryProducts = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      try {
        setLoading(true);
        const [catRes, prodRes] = await Promise.all([
          API.get(`/categories/${slug}`),
          API.get(`/products?category=${slug}&limit=20`)
        ]);

        if (catRes.data.success) setCategory(catRes.data.category);
        if (prodRes.data.success) setProducts(prodRes.data.products);
      } catch (err) {
        console.error('Error fetching category products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndProducts();
  }, [slug]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/" className="hover:text-indigo-600 transition">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/products" className="hover:text-indigo-600 transition">Categories</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-semibold">{category?.name || slug}</span>
      </nav>

      {/* Category Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-8 sm:p-12 shadow-md">
        <div className="relative z-10 max-w-xl">
          <span className="text-xs uppercase font-bold tracking-widest text-indigo-400">
            Category Collection
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-2">
            {category?.name || 'Category'}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            {category?.description || `Explore our hand-curated selection of premium ${category?.name || ''} items.`}
          </p>
          <div className="mt-6">
            <span className="inline-block bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold">
              {products.length} Products Available
            </span>
          </div>
        </div>

        {category?.image && (
          <img
            src={category.image}
            alt={category.name}
            className="absolute right-0 top-0 w-full sm:w-1/2 h-full object-cover opacity-25 sm:opacity-40 mask-radial"
          />
        )}
      </div>

      {/* Products Grid */}
      <div>
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
            <p className="text-sm text-slate-500">No products currently available in this category.</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <ArrowLeft className="w-4 h-4" /> Browse all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryProducts;
