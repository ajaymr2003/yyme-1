import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import {
  Truck, PackageCheck, ShieldCheck, Map,
  ArrowRight, Clock, MapPin, RefreshCcw
} from 'lucide-react';

export const Shipping: React.FC = () => {
  return (
    <div className="bg-white">
      {/* SECTION 1: Hero */}
      <section className="bg-emerald-50 py-16 lg:py-24">
        <div className="max-w-[1140px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Column: Text */}
          <div className="max-w-xl">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-neutral-900 leading-[1.2] tracking-tight mb-6">
              Hassle-Free Shipping & Returns
            </h1>

            <p className="text-lg text-neutral-600 font-medium mb-8 leading-relaxed">
              Take full control of your logistics. Manage your own shipping and reach millions of customers across India on your own terms, with transparent return policies.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="h-14 px-8 text-lg font-black bg-emerald-600 hover:bg-emerald-700 w-full shadow-lg">
                  Start Selling Now
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Illustration */}
          <div className="relative flex justify-center lg:justify-end mt-10 lg:mt-0">
            <div className="w-full max-w-md aspect-square bg-white rounded-3xl border-4 border-emerald-100 shadow-2xl p-10 relative flex flex-col items-center justify-center transform -rotate-2 hover:rotate-0 transition-transform duration-500">

              <div className="text-center">
                <div className="bg-emerald-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Truck className="w-16 h-16 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-black text-neutral-900 tracking-tight">
                  Ship Your Way
                </h2>
              </div>

              {/* Decorative Floating Elements */}
              <div className="absolute top-8 right-8 bg-emerald-50 p-3 rounded-2xl shadow border border-emerald-100 animate-bounce" style={{ animationDuration: '3.5s' }}>
                <MapPin className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="absolute bottom-8 left-8 bg-emerald-50 p-3 rounded-2xl shadow border border-emerald-100 animate-bounce" style={{ animationDuration: '4.5s' }}>
                <PackageCheck className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: Shipping Features */}
      <section className="py-24 bg-white">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-neutral-900 tracking-tight mb-4">How Shipping Works</h2>
            <p className="text-lg text-neutral-600 font-medium max-w-2xl mx-auto">Ship your way, directly to your customers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
                <Map className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-neutral-900 mb-4">Full Control</h3>
              <p className="text-neutral-600 font-medium leading-relaxed">
                Choose your preferred courier partners. You have complete freedom to negotiate your own rates and ship orders exactly how you want.
              </p>
            </div>

            <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-neutral-900 mb-4">Direct to Customer</h3>
              <p className="text-neutral-600 font-medium leading-relaxed">
                Pack and ship orders directly from your address to the buyer. No middleman warehouses, no unnecessary delays.
              </p>
            </div>

            <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-neutral-900 mb-4">Easy Tracking</h3>
              <p className="text-neutral-600 font-medium leading-relaxed">
                Provide tracking details directly on the platform so your customers can stay informed and your mind at ease.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Returns Policy */}
      <section className="py-16 sm:py-24 bg-neutral-900 text-white rounded-[3rem] mx-2 sm:mx-4 lg:mx-10 mb-16 sm:mb-24 overflow-hidden">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight mb-4">Fair & Transparent Returns</h2>
            <p className="text-lg text-emerald-100 font-medium max-w-2xl mx-auto">We balance customer trust with seller protection.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center shrink-0">
                  <RefreshCcw className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Direct Return Process</h3>
                  <p className="text-neutral-400 leading-relaxed font-medium">Customers can request returns for valid reasons within the allowed window. You coordinate directly with them to arrange the return shipment.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Seller Protection</h3>
                  <p className="text-neutral-400 leading-relaxed font-medium">Have complete visibility into the return process without unexpected platform deductions, keeping you in full control.</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-900 border border-emerald-800 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-600 rounded-full blur-3xl opacity-30" />
              <h3 className="text-2xl font-bold text-white mb-6">Return Shipping Costs</h3>
              <p className="text-emerald-50 font-medium leading-relaxed mb-6">
                Because you manage your own shipping, you also handle the return logistics and costs, giving you complete control over your profit margins.
              </p>
              <div className="bg-emerald-950/50 p-4 rounded-xl border border-emerald-800">
                <p className="text-emerald-200 text-sm font-medium">
                  We don't deduct arbitrary return shipping fees from your payouts—you manage it directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Final CTA */}
      <section className="bg-neutral-50 py-24 border-t border-neutral-200">
        <div className="max-w-[1140px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <h2 className="text-3xl lg:text-4xl font-black text-neutral-900 tracking-tight mb-4">
              Start Selling Across India
            </h2>
            <p className="text-lg text-neutral-600 font-medium leading-relaxed">
              Take full control of your business logistics and scale to new heights.
            </p>
          </div>
          <div className="shrink-0">
            <Link to="/signup">
              <Button size="lg" className="h-14 px-10 text-lg font-black bg-emerald-600 hover:bg-emerald-700 shadow-xl" icon={<ArrowRight className="w-5 h-5" />}>
                Start Selling
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
