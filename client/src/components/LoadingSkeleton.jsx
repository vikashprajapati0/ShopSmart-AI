import React from 'react';

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 animate-pulse">
    <div className="aspect-square bg-slate-200 rounded-xl" />
    <div className="space-y-2">
      <div className="h-3 bg-slate-200 rounded w-1/3" />
      <div className="h-4 bg-slate-200 rounded w-3/4" />
      <div className="h-3 bg-slate-200 rounded w-1/4" />
    </div>
    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
      <div className="h-5 bg-slate-200 rounded w-1/3" />
      <div className="h-8 bg-slate-200 rounded-xl w-16" />
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export default {
  ProductCardSkeleton,
  ProductGridSkeleton
};
