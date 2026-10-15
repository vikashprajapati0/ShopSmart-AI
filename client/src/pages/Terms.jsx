import React from 'react';

const Terms = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-6 text-sm text-slate-600 leading-relaxed">
        <p>Last updated: October 2026</p>
        <h3 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h3>
        <p>By accessing or purchasing from ShopSmart AI, you agree to be bound by these Terms of Service and all applicable Indian commercial laws and e-commerce regulations.</p>
        <h3 className="text-base font-bold text-slate-900">2. Product Pricing & Catalog Accuracy</h3>
        <p>All prices are listed in Indian Rupees (₹) inclusive of applicable taxes unless stated otherwise. Prices calculated and finalized by the backend database at the time of checkout are binding.</p>
        <h3 className="text-base font-bold text-slate-900">3. AI Shopping Assistant Guidance</h3>
        <p>The AI Shopping Assistant is provided to guide and assist your product discovery based on database catalog queries. It does not possess unilateral authority to modify contractual order prices or guarantee third-party external specifications.</p>
      </div>
    </div>
  );
};

export default Terms;
