import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Filter,
  SlidersHorizontal,
  X,
  Search,
  Star,
  Check,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import API from '../services/api';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import { ProductGridSkeleton } from '../components/LoadingSkeleton';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filters state from URL query
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const searchQuery = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedBrand = searchParams.get('brand') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const ratingFilter = searchParams.get('rating') || '';
  const inStockOnly = searchParams.get('inStock') === 'true';
  const sortOption = searchParams.get('sort') || 'newest';

  // Fetch filter metadata (categories, brands)
  useEffect(() => {
    API.get('/products/filters')
      .then((res) => {
        if (res.data.success) {
          setCategories(res.data.categories);
          setBrands(res.data.brands);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch products when query params change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams(searchParams);
        if (!params.has('limit')) params.set('limit', '12');

        const res = await API.get(`/products?${params.toString()}`);
        if (res.data.success) {
          setProducts(res.data.products);
          setTotalPages(res.data.totalPages);
          setTotalProducts(res.data.total);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === null || value === undefined || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    newParams.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const FilterSidebarContent = () => (
    <div className="space-y-6">
      {/* Category filter */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">
          Category
        </h4>
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          <button
            onClick={() => updateParam('category', '')}
            className={`w-full text-left text-xs py-1.5 px-2 rounded-lg font-medium transition ${
              !selectedCategory
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => updateParam('category', cat.slug)}
              className={`w-full text-left text-xs py-1.5 px-2 rounded-lg font-medium transition ${
                selectedCategory === cat.slug
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="pt-4 border-t border-slate-200/80">
        <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">
          Price Range (₹)
        </h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateParam('minPrice', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500"
          />
          <span className="text-slate-400 text-xs">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateParam('maxPrice', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex flex-wrap gap-1 mt-2.5">
          {['1000', '3000', '5000', '15000', '60000'].map((price) => (
            <button
              key={price}
              onClick={() => updateParam('maxPrice', price)}
              className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 px-2 py-0.5 rounded border border-slate-200 text-slate-600"
            >
              Under ₹{Number(price).toLocaleString('en-IN')}
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div className="pt-4 border-t border-slate-200/80">
          <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">
            Brand
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {brands.map((b) => (
              <label
                key={b}
                className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedBrand === b}
                  onChange={() => updateParam('brand', selectedBrand === b ? '' : b)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span>{b}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Customer Rating */}
      <div className="pt-4 border-t border-slate-200/80">
        <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">
          Minimum Rating
        </h4>
        <div className="space-y-1.5">
          {[4, 3, 2].map((stars) => (
            <button
              key={stars}
              onClick={() => updateParam('rating', ratingFilter === stars.toString() ? '' : stars.toString())}
              className={`w-full flex items-center justify-between text-xs py-1.5 px-2 rounded-lg transition ${
                ratingFilter === stars.toString()
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < stars ? 'fill-amber-400' : 'text-slate-200'}`}
                  />
                ))}
                <span className="text-slate-700 font-medium ml-1">& up</span>
              </div>
              {ratingFilter === stars.toString() && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* In Stock toggle */}
      <div className="pt-4 border-t border-slate-200/80">
        <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : '')}
            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
          />
          <span>In-Stock Items Only</span>
        </label>
      </div>

      {/* Reset button */}
      <button
        onClick={handleResetFilters}
        className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 py-2.5 rounded-xl border border-rose-200 transition"
      >
        <RotateCcw className="w-3.5 h-3.5" /> Reset All Filters
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore All Products
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Showing <strong className="text-slate-800">{totalProducts}</strong> products found
            {searchQuery && (
              <span> for "<span className="text-indigo-600 font-medium">{searchQuery}</span>"</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            Filters
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="popularity">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-28 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-indigo-600" /> Catalog Filters
              </span>
            </div>
            <FilterSidebarContent />
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {loading ? (
            <ProductGridSkeleton count={9} />
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12">
              <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No products found</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                We couldn't find any items matching your selected criteria. Try adjusting your filters or search keywords.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-sm transition"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => updateParam('page', page)}
              />
            </>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full p-6 shadow-2xl flex flex-col z-10 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <span className="font-bold text-slate-900 text-base">Filter Products</span>
              <button onClick={() => setMobileFilterOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <FilterSidebarContent />
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
