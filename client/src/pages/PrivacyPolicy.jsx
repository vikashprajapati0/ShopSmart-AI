import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-6 text-sm text-slate-600 leading-relaxed">
        <p>Last updated: October 2026</p>
        <h3 className="text-base font-bold text-slate-900">1. Information We Collect</h3>
        <p>We collect information you provide directly to us when creating an account, making a purchase, communicating with our AI assistant, or signing up for newsletters. This includes name, email, shipping address, phone number, and conversation queries.</p>
        <h3 className="text-base font-bold text-slate-900">2. How We Use Information</h3>
        <p>We use your information to fulfill orders, process payments via Razorpay, deliver packages, provide personalized product recommendations, improve AI assistant accuracy, and protect against fraudulent transactions.</p>
        <h3 className="text-base font-bold text-slate-900">3. Payment Security</h3>
        <p>We never store credit card numbers, CVVs, or bank account credentials. All payment processing occurs over secure 256-bit SSL connections through our authorized payment partner, Razorpay.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
