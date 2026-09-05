import React from 'react';
import { Link } from 'react-router-dom';
import { Store, MessageCircle, Zap, Shield, IndianRupee, ArrowRight, ChevronRight } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">Y</span>
          </div>
          <span className="text-lg font-bold text-neutral-900 tracking-tight">YYME</span>
        </div>
        <Link to="/login" className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
          Seller Login
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-neutral-900 tracking-tight leading-tight">
            Sell on YYME — <span className="text-emerald-600">WhatsApp Direct</span>
          </h1>
          <p className="text-neutral-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
            No complex checkout. No payment gateway hassles. List your products, buyers discover you on YYME, and orders come straight to your WhatsApp.
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
            Start Selling <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: <Store className="w-6 h-6 text-emerald-600" />, title: 'List Products', desc: 'Upload products with variants, pricing, and stock in minutes' },
            { icon: <MessageCircle className="w-6 h-6 text-emerald-600" />, title: 'WhatsApp Orders', desc: 'Buyers click "Order via WhatsApp" — orders land directly in your chat' },
            { icon: <IndianRupee className="w-6 h-6 text-emerald-600" />, title: 'Offline Payment', desc: 'Accept UPI, Cash on Delivery — you control the payment flow' },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-neutral-200 rounded-xl p-5 text-center shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-emerald-100">{item.icon}</div>
              <h3 className="text-sm font-bold text-neutral-900 mb-1">{item.title}</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">How it works</h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Sign Up & KYC', desc: 'Create account, submit GST/Enrollment ID for verification' },
              { step: '2', title: 'Get Approved', desc: 'Admin verifies identity — you get 20 free clicks + 3 listings' },
              { step: '3', title: 'List Products', desc: 'Upload products with images, variants, pricing, and stock' },
              { step: '4', title: 'Receive Orders', desc: 'Buyers discover your products and order via WhatsApp' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">{s.step}</div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900">{s.title}</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
