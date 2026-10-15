import React from 'react';
import { Sparkles, ShieldCheck, Zap, Heart, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          About ShopSmart AI
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Pioneering the future of e-commerce through conversation-driven product discovery and verified catalog intelligence.
        </p>
      </div>

      {/* Mission */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Traditional online shopping overwhelms customers with hundreds of generic filters, conflicting reviews, and sponsored placements. At <strong>ShopSmart AI</strong>, we believe finding the right product should be as natural and effortless as asking an experienced personal shopper.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          We combine cutting-edge Large Language Models (LLMs) with strict database catalog grounding. Our assistant never hallucinates specs, prices, or stock—every recommendation is verified directly against our live MongoDB inventory.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <Zap className="w-6 h-6 text-indigo-600 mb-2" />
            <h4 className="font-bold text-slate-900 text-sm">Natural Language Search</h4>
            <p className="text-xs text-slate-500 mt-1">Understands budget, intended usage, and custom preferences.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <ShieldCheck className="w-6 h-6 text-emerald-600 mb-2" />
            <h4 className="font-bold text-slate-900 text-sm">Transparent Pricing</h4>
            <p className="text-xs text-slate-500 mt-1">Backend validated prices and atomic stock guarantees.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <Heart className="w-6 h-6 text-rose-600 mb-2" />
            <h4 className="font-bold text-slate-900 text-sm">Customer Centric</h4>
            <p className="text-xs text-slate-500 mt-1">Free express shipping, 7-day returns, and 24/7 AI shopping advice.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
