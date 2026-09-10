import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { Store, CheckCircle2 } from 'lucide-react';

export const NoGst: React.FC = () => {
  return (
    <div className="bg-white">
      {/* HERO SECTION */}
      <section className="bg-emerald-50 py-16 lg:py-24">
        <div className="max-w-[1140px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[500px]">

          {/* Left Column: Text */}
          <div>
            <div className="inline-block bg-white text-emerald-800 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-6 border border-emerald-200 shadow-sm">
              For Sellers Without a GSTIN
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[56px] font-black text-neutral-900 leading-[1.2] tracking-tight mb-6">
              <span className="text-emerald-700">No GSTIN? No Worries.</span>
              <br />
              Enrollment ID? <span className="text-emerald-700">We'll Generate It For You.</span>
            </h1>

            <p className="text-lg text-neutral-600 font-medium mb-10 leading-relaxed max-w-xl">
              Whether you're a home-based seller or a growing business, start selling to buyers in your state today — <span className="font-bold text-neutral-900 bg-emerald-100 px-1 py-0.5 rounded">no GST registration required</span>.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link to="/signup">
                <Button size="lg" className="h-14 px-8 text-lg font-black bg-emerald-600 hover:bg-emerald-700 shadow-xl hover:-translate-y-0.5 transition-all">
                  Register Now
                </Button>
              </Link>
              <span className="text-neutral-500 font-bold">and start selling</span>
            </div>
          </div>

          {/* Right Column: Illustration */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="w-full max-w-md aspect-square bg-white rounded-3xl border-4 border-emerald-100 shadow-2xl p-8 relative flex items-center justify-center transform rotate-2 hover:rotate-0 transition-transform duration-500">

              {/* Decorative Badge */}
              <div className="absolute -top-6 -left-6 bg-white p-3 rounded-2xl shadow-lg border border-emerald-100 transform -rotate-12">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>

              {/* Generic Graphic */}
              <div className="flex flex-col items-center opacity-80">
                <Store className="w-32 h-32 text-emerald-200 mb-6" />
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-12 h-12 bg-emerald-200 rounded-lg animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-12 h-12 bg-emerald-300 rounded-lg animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* DETAIL SECTION */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-black text-neutral-900 mb-8 tracking-tight">
            An Opportunity for Sellers Without a GSTIN
          </h2>

          <div className="space-y-6 text-lg text-neutral-600 font-medium leading-relaxed">
            <p>
              YMENET welcomes sellers without a GST number to sign up and start selling to buyers within their own state.
            </p>
            <p>
              If you're not GST-registered, you'll need a GST Enrollment ID to get started. Don't have one yet?{' '}
              <Link to="/signup" className="text-emerald-600 font-bold hover:text-emerald-700 underline underline-offset-4 decoration-2">
                Generate it right here
              </Link>
              {' '}— no need to visit the GST portal separately, and no extra paperwork to track down.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-neutral-100">
            <p className="text-sm font-semibold text-neutral-500">
              Already have an Enrollment ID? Just enter it during signup — no need to generate a new one.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
