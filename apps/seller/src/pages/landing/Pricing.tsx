import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { Input } from './Input';
import {
  Percent, FileText, Banknote, ShieldCheck,
  ArrowRight, Calculator, CheckCircle2, TrendingDown,
  ShoppingBag, Package
} from 'lucide-react';

export const Pricing: React.FC = () => {
  return (
    <div className="bg-white">
      {/* SECTION 1: Hero */}
      <section className="bg-emerald-50 py-16 lg:py-24">
        <div className="max-w-[1140px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Column: Text */}
          <div className="max-w-xl">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-neutral-900 leading-[1.2] tracking-tight mb-6">
              Pricing & Commission
            </h1>

            <p className="text-lg text-neutral-600 font-medium mb-8 leading-relaxed">
              YMENET charges <span className="font-bold text-neutral-900 bg-emerald-100 px-1 py-0.5 rounded">zero listing fees</span> across every category, so you keep more of what you earn. A small commission applies only when you make a sale — and it's <span className="font-bold text-neutral-900 bg-emerald-100 px-1 py-0.5 rounded">waived entirely for eligible sellers</span>.
            </p>

            <div className="bg-white border border-emerald-200 p-4 rounded-2xl mb-8 shadow-sm flex items-start gap-4">
              <span className="bg-emerald-600 text-white text-xs font-black uppercase tracking-wider px-2 py-1 rounded">New</span>
              <p className="text-sm font-semibold text-neutral-700">
                Have a disability certificate? You pay 0% commission on every sale. Click{' '}
                <Link to="/no-gst" className="text-emerald-600 hover:text-emerald-700 underline decoration-2 underline-offset-2">here</Link>
                {' '}to know more.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold border-r border-neutral-200 pr-3">
                  +91
                </div>
                <Input
                  placeholder="Enter Your Mobile Number"
                  className="w-full pl-16 h-14 text-lg bg-white shadow-inner"
                />
              </div>
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="h-14 px-8 text-lg font-black bg-emerald-600 hover:bg-emerald-700 w-full shadow-lg">
                  Start Selling
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Illustration */}
          <div className="relative flex justify-center lg:justify-end mt-10 lg:mt-0">
            <div className="w-full max-w-md aspect-square bg-white rounded-3xl border-4 border-emerald-100 shadow-2xl p-10 relative flex flex-col items-center justify-center transform rotate-2 hover:rotate-0 transition-transform duration-500">

              <div className="text-center">
                <h2 className="text-6xl sm:text-[120px] font-black text-emerald-600 leading-none tracking-tighter drop-shadow-sm">
                  ₹0
                </h2>
                <p className="text-3xl font-black text-neutral-900 uppercase tracking-widest mt-2">
                  Listing Fees
                </p>
              </div>

              {/* Decorative Floating Elements */}
              <div className="absolute top-10 left-10 bg-emerald-50 p-3 rounded-2xl shadow border border-emerald-100 animate-bounce" style={{ animationDuration: '3s' }}>
                <ShoppingBag className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="absolute bottom-10 right-10 bg-emerald-50 p-3 rounded-2xl shadow border border-emerald-100 animate-bounce" style={{ animationDuration: '4s' }}>
                <Package className="w-8 h-8 text-emerald-500" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: Three Feature Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-[1140px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-neutral-900 mb-4">No Registration Fee</h3>
            <p className="text-neutral-600 font-medium leading-relaxed">
              Signing up as a YMENET seller is completely free — no cost to create your account or list your products.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
              <Banknote className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-neutral-900 mb-4">No Collection Fee</h3>
            <p className="text-neutral-600 font-medium leading-relaxed">
              There's no separate charge for accepting payments — your commission covers everything, with nothing extra deducted.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
              <Percent className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-neutral-900 mb-4">Commission Waived for Eligible Sellers</h3>
            <p className="text-neutral-600 font-medium leading-relaxed">
              Sellers with a valid, government-verified disability certificate pay zero commission on every sale, automatically.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: How Commission Actually Works */}
      <section className="py-16 sm:py-24 bg-neutral-900 text-white rounded-[3rem] mx-2 sm:mx-4 lg:mx-10 mb-16 sm:mb-24 overflow-hidden">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight">How commission works on YMENET</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Column A */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-emerald-400 mb-6">Standard Sellers</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-neutral-300 font-medium leading-relaxed">A standard commission percentage applies on each successful sale</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-neutral-300 font-medium leading-relaxed">Commission is calculated on your product price plus delivery charge — never on GST</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-neutral-300 font-medium leading-relaxed">GST collected from buyers passes through to you in full, for your own filing</span>
                </li>
              </ul>
            </div>

            {/* Column B */}
            <div className="bg-emerald-900 border border-emerald-800 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-600 rounded-full blur-3xl opacity-30" />
              <h3 className="text-2xl font-bold text-white mb-6">Disability-Certificate Sellers</h3>
              <ul className="space-y-4 relative z-10">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-emerald-50 font-medium leading-relaxed">Zero commission on every sale, automatically applied</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-emerald-50 font-medium leading-relaxed">Same GST passthrough and delivery-charge rules apply</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-emerald-50 font-medium leading-relaxed">Certificate is re-verified periodically to keep your exemption active</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="w-12 h-12 bg-neutral-700 rounded-full flex items-center justify-center shrink-0">
              <Calculator className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-neutral-300 font-medium leading-relaxed">
              <strong className="text-white">Example:</strong> On a ₹1,000 sale with ₹50 delivery, a standard seller pays commission only on the ₹1,050 — GST is never included in that calculation.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: Payment Cycle */}
      <section className="bg-neutral-50 py-24">
        <div className="max-w-[1140px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-black text-neutral-900 tracking-tight mb-6">
              Payment Cycle
            </h2>
            <p className="text-lg text-neutral-600 font-medium leading-relaxed">
              Your settlement amount is deposited directly into your bank account after a 7-day buyer-protection window from delivery confirmation. You can track your balance and upcoming payouts anytime from your Earnings dashboard.
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Banknote className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="text-xl font-bold text-neutral-900">7-Day Settlement Cycle</h4>
            </div>

            <div className="h-px bg-neutral-100 w-full mb-6" />

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="text-xl font-bold text-neutral-900">Secure Payments to Your Verified Account</h4>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: What's Deducted, Transparently */}
      <section className="py-24 bg-white">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-neutral-900 tracking-tight">What's deducted from your payout — and what isn't</h2>
          </div>

          <div className="space-y-4">
            {/* Row 1 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 border border-neutral-200 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors">
              <Percent className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-neutral-900">Commission</h4>
                <p className="text-neutral-500 text-sm mt-1">Only if you don't hold a valid disability exemption</p>
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 border border-neutral-200 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors">
              <FileText className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-neutral-900">TCS (Tax Collected at Source)</h4>
                <p className="text-neutral-500 text-sm mt-1">A small, government-mandated deduction under e-commerce tax rules — not a platform fee</p>
              </div>
            </div>

            {/* Row 3 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 border border-neutral-200 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors">
              <TrendingDown className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-neutral-900">Return Shipping Recovery</h4>
                <p className="text-neutral-500 text-sm mt-1">Only applies if a return happens, recovered quietly from your next payout</p>
              </div>
            </div>

            {/* Row 4 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 border border-emerald-500 bg-emerald-50 rounded-2xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-emerald-900">GST</h4>
                <p className="text-emerald-700 text-sm mt-1 font-medium">Never deducted — it passes through to you in full for your own filing</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: Final CTA */}
      <section className="bg-neutral-50 py-24 border-t border-neutral-200">
        <div className="max-w-[1140px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <h2 className="text-3xl lg:text-4xl font-black text-neutral-900 tracking-tight mb-4">
              Sell Products Online with Zero Listing Fees
            </h2>
            <p className="text-lg text-neutral-600 font-medium leading-relaxed">
              Join YMENET and reach buyers across India — starting in your own state, even without a GST number.
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
