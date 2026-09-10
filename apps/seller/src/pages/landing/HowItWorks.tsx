import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import {
  ShoppingBag, CheckCircle, ShieldCheck,
  PlayCircle, FileText, UploadCloud, Truck,
  CreditCard, ChevronDown, Check, ArrowRight,
  Package
} from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="bg-white font-sans overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">

      {/* SECTION 1: Hero */}
      <section className="bg-emerald-50 py-16 lg:py-24">
        <div className="max-w-[1140px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left max-w-xl mx-auto lg:mx-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 leading-[1.2] tracking-tight mb-6">
              Start selling in minutes — no fees, no middlemen
            </h1>
            <p className="text-lg text-neutral-600 font-medium mb-8 leading-relaxed">
              Whether you have a GST number or not, YMENET gives every seller — from home bakers to established businesses — the same open marketplace.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="h-14 px-8 text-lg font-black bg-emerald-600 hover:bg-emerald-700 w-full whitespace-nowrap shadow-lg shadow-emerald-600/20">
                  Start Selling Now
                </Button>
              </Link>
              <button className="flex items-center justify-center gap-2 text-emerald-600 font-bold hover:text-emerald-700 transition-colors h-14 px-6 whitespace-nowrap">
                <PlayCircle className="w-5 h-5 shrink-0" />
                <span>Watch a 2-minute walkthrough</span>
              </button>
            </div>
          </div>
          <div className="w-full relative">
            <div className="aspect-[16/10] bg-emerald-100 rounded-3xl border border-emerald-200 shadow-xl overflow-hidden relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/50 to-white/20" />
              <div className="relative z-10 flex flex-col items-center text-emerald-600/80">
                <ShoppingBag className="w-24 h-24 mb-4 opacity-50" />
                <span className="font-bold tracking-widest uppercase">Platform Preview</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: The 4-Step Overview */}
      <section className="py-24 bg-white">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-neutral-900 tracking-tight">From signup to your first sale — how it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xl border-2 border-emerald-200">1</div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-emerald-600" /></div>
                  Sign up with just your phone number
                </h3>
                <p className="text-neutral-600 font-medium leading-relaxed">No lengthy forms. Verify with OTP and you're in.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xl border-2 border-emerald-200">2</div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center"><FileText className="w-4 h-4 text-emerald-600" /></div>
                  Tell us if you have a GST number
                </h3>
                <p className="text-neutral-600 font-medium leading-relaxed">Have a GSTIN? Sell all over India. Don't have one? We'll generate a GST Enrollment ID for you right here — no need to visit the GST portal separately. You'll sell within your state to start.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xl border-2 border-emerald-200">3</div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center"><UploadCloud className="w-4 h-4 text-emerald-600" /></div>
                  List your products for free
                </h3>
                <p className="text-neutral-600 font-medium leading-relaxed">No listing fees, ever. Add your product, set your price, and you're live instantly.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xl border-2 border-emerald-200">4</div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center"><CreditCard className="w-4 h-4 text-emerald-600" /></div>
                  Sell, ship, and get paid
                </h3>
                <p className="text-neutral-600 font-medium leading-relaxed">You choose how you deliver — hand it over yourself or use any courier. We handle payments, and your earnings reach your bank account after a short buyer-protection window.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 3: How GST vs. Non-GST Selling Works */}
      <section className="py-24 bg-neutral-50 border-y border-neutral-200">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Selling with or without GST — what changes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 relative">
            {/* Divider line for desktop */}
            <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-neutral-200 -translate-x-1/2" />

            {/* Column A: I have a GSTIN */}
            <div className="pr-0 md:pr-8">
              <div className="flex items-center justify-center mb-8">
                <span className="bg-emerald-100 text-emerald-800 font-black px-6 py-2 rounded-full text-lg shadow-sm border border-emerald-200">
                  I have a GSTIN
                </span>
              </div>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <Check className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700 font-medium leading-relaxed">Sell to buyers anywhere in India</span>
                </li>
                <li className="flex items-start gap-4">
                  <Check className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700 font-medium leading-relaxed">Standard GST applies, shown clearly to buyers at checkout</span>
                </li>
                <li className="flex items-start gap-4">
                  <Check className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700 font-medium leading-relaxed">Full invoicing under your own GSTIN</span>
                </li>
              </ul>
            </div>

            {/* Column B: I don't have a GSTIN */}
            <div className="pl-0 md:pl-8">
              <div className="flex items-center justify-center mb-8">
                <span className="bg-blue-100 text-blue-800 font-black px-6 py-2 rounded-full text-lg shadow-sm border border-blue-200">
                  I don't have a GSTIN
                </span>
              </div>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <Check className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700 font-medium leading-relaxed">We generate your GST Enrollment ID instantly, in-app</span>
                </li>
                <li className="flex items-start gap-4">
                  <Check className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700 font-medium leading-relaxed">Sell to buyers within your own state</span>
                </li>
                <li className="flex items-start gap-4">
                  <Check className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700 font-medium leading-relaxed">0% GST — your products are tax-exempt for buyers</span>
                </li>
                <li className="flex items-start gap-4">
                  <Check className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700 font-bold leading-relaxed">Upgrade to a full GSTIN anytime as your business grows</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: What Happens After a Sale */}
      <section className="py-24 bg-white">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-neutral-900 tracking-tight">What happens after you make a sale</h2>
          </div>

          <div className="bg-white border border-neutral-200 rounded-3xl p-8 lg:p-12 shadow-sm">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative">
              {/* Desktop Connecting Line */}
              <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-neutral-100 -translate-y-1/2 -z-10" />

              {/* Step 1 */}
              <div className="flex flex-col items-center text-center bg-white px-4 z-10 w-full lg:w-48">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
                  <ShoppingBag className="w-7 h-7 text-emerald-600" />
                </div>
                <h4 className="font-bold text-neutral-900 text-sm">Order Placed</h4>
              </div>

              <div className="lg:hidden text-neutral-300"><ChevronDown className="w-6 h-6" /></div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center bg-white px-4 z-10 w-full lg:w-48">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
                  <Package className="w-7 h-7 text-emerald-600" />
                </div>
                <h4 className="font-bold text-neutral-900 text-sm">You Pack It</h4>
              </div>

              <div className="lg:hidden text-neutral-300"><ChevronDown className="w-6 h-6" /></div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center bg-white px-4 z-10 w-full lg:w-56">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
                  <Truck className="w-7 h-7 text-emerald-600" />
                </div>
                <h4 className="font-bold text-neutral-900 text-sm leading-tight">You Ship It<br/><span className="text-xs text-neutral-500 font-medium">(Hand-deliver or Courier)</span></h4>
              </div>

              <div className="lg:hidden text-neutral-300"><ChevronDown className="w-6 h-6" /></div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center bg-white px-4 z-10 w-full lg:w-48">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
                <h4 className="font-bold text-neutral-900 text-sm">Buyer Confirms Receipt</h4>
              </div>

              <div className="lg:hidden text-neutral-300"><ChevronDown className="w-6 h-6" /></div>

              {/* Step 5 */}
              <div className="flex flex-col items-center text-center bg-white px-4 z-10 w-full lg:w-48">
                <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mb-4 border-4 border-emerald-100 shadow-md transform scale-110">
                  <CreditCard className="w-7 h-7 text-white" />
                </div>
                <h4 className="font-black text-emerald-700 text-sm uppercase tracking-wide">You Get Paid</h4>
              </div>
            </div>

            <p className="text-center text-neutral-500 font-semibold text-sm mt-12 bg-neutral-50 py-3 px-6 rounded-xl inline-flex max-w-2xl mx-auto w-full justify-center">
              <ShieldCheck className="w-5 h-5 text-neutral-400 mr-2 shrink-0" />
              <span>Payments are held briefly for buyer protection, then released straight to your bank account.</span>
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5: Why Sellers Choose YMENET */}
      <section className="py-24 bg-neutral-50 border-t border-neutral-200">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Built to be fair to every seller</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-white border border-neutral-200 p-8 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <ShoppingBag className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-neutral-900 text-lg mb-3">Zero listing fees</h3>
              <p className="text-neutral-600 text-sm font-medium leading-relaxed">List unlimited products — we only earn when you make a sale.</p>
            </div>

            <div className="bg-white border border-neutral-200 p-8 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-neutral-900 text-lg mb-3">Commission-free for eligible sellers</h3>
              <p className="text-neutral-600 text-sm font-medium leading-relaxed">Sellers with a valid disability certificate pay zero commission on every sale.</p>
            </div>

            <div className="bg-white border border-neutral-200 p-8 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <Truck className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-neutral-900 text-lg mb-3">You control delivery</h3>
              <p className="text-neutral-600 text-sm font-medium leading-relaxed">Hand-deliver locally or use any courier of your choice — your call, every time.</p>
            </div>

            <div className="bg-white border border-neutral-200 p-8 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-neutral-900 text-lg mb-3">Transparent returns</h3>
              <p className="text-neutral-600 text-sm font-medium leading-relaxed">Clear return policies, and we recover any return costs quietly from future payouts — never an upfront demand.</p>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 6: FAQ Preview */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Common questions</h2>
          </div>

          <div className="space-y-4">
            <div className="border border-neutral-200 rounded-2xl bg-white overflow-hidden transition-all">
              <button
                onClick={() => toggleFaq(0)}
                className="w-full text-left px-6 py-6 flex items-center justify-between font-bold text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                What if I don't have a GST number?
                <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${openFaq === 0 ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === 0 && (
                <div className="px-6 pb-6 text-neutral-600 font-medium leading-relaxed">
                  You can still sell on YMENET without a GST number! We've integrated with the GSTN network to instantly generate a GST Enrollment ID for you during onboarding. This allows you to legally sell to buyers within your own state, tax-free.
                </div>
              )}
            </div>

            <div className="border border-neutral-200 rounded-2xl bg-white overflow-hidden transition-all">
              <button
                onClick={() => toggleFaq(1)}
                className="w-full text-left px-6 py-6 flex items-center justify-between font-bold text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                How much commission does YMENET take?
                <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${openFaq === 1 ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === 1 && (
                <div className="px-6 pb-6 text-neutral-600 font-medium leading-relaxed">
                  We charge 0% commission on almost all categories, meaning you keep what you earn. There are no listing fees either. For eligible sellers with a disability certificate, selling is completely commission-free permanently.
                </div>
              )}
            </div>

            <div className="border border-neutral-200 rounded-2xl bg-white overflow-hidden transition-all">
              <button
                onClick={() => toggleFaq(2)}
                className="w-full text-left px-6 py-6 flex items-center justify-between font-bold text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                How do I get paid?
                <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${openFaq === 2 ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === 2 && (
                <div className="px-6 pb-6 text-neutral-600 font-medium leading-relaxed">
                  Payments are held securely in escrow until the buyer confirms receipt or the return window closes. Once cleared, funds are automatically transferred to your registered bank account on our standard 7-day settlement cycle.
                </div>
              )}
            </div>
          </div>

          <div className="text-center mt-8">
            <button className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline underline-offset-4">
              See all FAQs
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 7: Final CTA */}
      <section className="bg-emerald-900 py-16 sm:py-24 text-center relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-2xl bg-emerald-800/50 rounded-full blur-3xl -z-10" />

        <div className="max-w-[1140px] mx-auto px-6 relative z-10">
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight">Ready to start selling?</h2>
          <p className="text-xl text-emerald-100 font-medium mb-10 max-w-xl mx-auto">
            It takes less than 5 minutes to get your first product live.
          </p>
          <Link to="/signup">
            <Button size="lg" className="h-14 px-10 text-lg font-black bg-white text-emerald-900 hover:bg-emerald-50 shadow-xl w-full sm:w-auto" icon={<ArrowRight className="w-5 h-5" />}>
              Start Selling Now
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
};
