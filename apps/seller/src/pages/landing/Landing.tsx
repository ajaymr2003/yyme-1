import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import {
  TrendingUp,
  CheckCircle,
  MapPin,
  Package,
  ShieldCheck,
  Smartphone,
  FileCheck,
  PackageCheck,
  Truck,
  Wallet,
  ChevronDown,
  Quote,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Small scroll-reveal helper — no external animation library needed  */
/* ------------------------------------------------------------------ */
function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // reveal once, don't re-trigger on scroll up
        }
      },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children,
  delay = 0,
  className = '',
}) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Data                                                                */
/* ------------------------------------------------------------------ */
const lifecycleSteps = [
  { icon: Smartphone, label: 'Order Placed', desc: 'A buyer finds your product and checks out in seconds.' },
  { icon: FileCheck, label: 'You Pack It', desc: 'Mark it packed the moment it\u2019s ready to go.' },
  { icon: Truck, label: 'You Ship It', desc: 'Hand-deliver it yourself or send it with any courier you choose.' },
  { icon: PackageCheck, label: 'Buyer Confirms', desc: 'The buyer confirms receipt \u2014 or it auto-confirms after 10 days.' },
  { icon: Wallet, label: 'You Get Paid', desc: 'Your earnings land in your bank account after a short protection window.' },
];

const testimonials = [
  {
    quote:
      "I list a new batch of pickles every Sunday and they're live in under a minute. No fees eating into a small batch anymore.",
    name: 'Home-based seller',
    place: 'Kottayam, Kerala',
  },
  {
    quote:
      "Not having a GST number used to mean I couldn't sell online at all. YMENET generated my enrollment ID right in the app.",
    name: 'Bamboo craft seller',
    place: 'Wayanad, Kerala',
  },
  {
    quote:
      'I deliver by hand to half my buyers and courier the rest. Having that choice, instead of being forced into one system, actually matters.',
    name: 'Spice seller',
    place: 'Idukki, Kerala',
  },
];

const faqs = [
  {
    q: "What if I don't have a GST number?",
    a: "You can still sell. We'll generate a GST Enrollment ID for you, right inside the app \u2014 no need to visit the GST portal separately. You'll sell to buyers within your own state to start, and can upgrade to a full GSTIN anytime.",
  },
  {
    q: 'How much commission does YMENET take?',
    a: "There's no fee to list. A standard commission applies only when you make a sale \u2014 and it's waived entirely for sellers with a valid disability certificate.",
  },
  {
    q: 'How do I get paid?',
    a: "After a buyer confirms delivery, funds are held briefly for buyer protection, then released directly to your verified bank account \u2014 no manual withdrawal needed.",
  },
  {
    q: 'Who handles delivery?',
    a: "You do, your way. Hand-deliver locally or ship with any courier you prefer. There's no single logistics partner you're locked into.",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */
export const Landing: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[120%] bg-emerald-50/80 rounded-l-[120px] transform rotate-3" />
          <div className="absolute top-[10%] -right-[5%] w-[60%] h-[100%] bg-emerald-100/50 rounded-l-[100px] transform -rotate-2" />
        </div>

        <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-[64px] font-black text-neutral-900 leading-[1.2] tracking-tight mb-6">
              Sell Online to Crores of Customers at <br className="hidden lg:block" />
              <span className="text-emerald-600 inline-block mt-3 lg:mt-4 transform hover:scale-105 transition-transform cursor-default">Zero Listing Fees</span>
            </h1>
            <p className="text-lg text-neutral-600 font-medium mb-8">
              Become a YYMEE seller today and grow your business across India — list unlimited products for free, and pay only when you actually make a sale
            </p>

            <div className="bg-white/80 backdrop-blur-sm border border-emerald-100 p-4 rounded-2xl mb-8 flex items-start gap-4 shadow-sm inline-flex">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider px-2 py-1 rounded">New</span>
              <p className="text-sm font-semibold text-neutral-700">
                Doin't have a GSTIN? You can still sell on YYMEE.
                <a href="#gst" className="text-emerald-600 hover:text-emerald-700 ml-1 underline decoration-2 underline-offset-2">Know more</a>
              </p>
            </div>

            <div>
              <Link to="/signup">
                <Button size="lg" className="h-14 px-8 text-lg font-black bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                  Start Selling Now
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg aspect-square">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-transparent rounded-full opacity-60 animate-pulse" />

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-white rounded-3xl shadow-2xl border border-neutral-100 p-6 flex flex-col justify-between transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex justify-between items-center border-b pb-4">
                  <div className="flex gap-2 items-center">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="h-2 w-16 bg-neutral-200 rounded-full mb-1" />
                      <div className="h-2 w-24 bg-neutral-100 rounded-full" />
                    </div>
                  </div>
                  <span className="text-emerald-500 font-bold text-sm">+218%</span>
                </div>

                <div className="flex-1 flex items-end gap-2 pt-6">
                  <div className="w-1/5 bg-emerald-100 h-[30%] rounded-t-sm" />
                  <div className="w-1/5 bg-emerald-200 h-[50%] rounded-t-sm" />
                  <div className="w-1/5 bg-emerald-300 h-[40%] rounded-t-sm" />
                  <div className="w-1/5 bg-emerald-400 h-[70%] rounded-t-sm" />
                  <div className="w-1/5 bg-emerald-600 h-[100%] rounded-t-sm relative">
                    <div className="absolute -top-3 -right-2 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-sm" />
                  </div>
                </div>
              </div>

              <div className="absolute top-10 left-0 w-16 h-16 bg-white rounded-2xl shadow-xl border border-neutral-100 flex items-center justify-center transform -rotate-12 animate-bounce" style={{ animationDuration: '3s' }}>
                <Package className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="absolute bottom-20 -right-6 w-20 h-20 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-600/30 flex flex-col items-center justify-center text-white transform rotate-6 hover:scale-110 transition-transform">
                <span className="font-black text-2xl">0%</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Fees</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-16 bg-white">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors group">
              <h3 className="text-3xl font-black text-emerald-600 mb-2 group-hover:scale-105 transform origin-left transition-transform">Lakhs of</h3>
              <p className="text-lg font-bold text-neutral-800 leading-snug">Sellers trust ymenet to sell online</p>
            </div>
            <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors group">
              <h3 className="text-3xl font-black text-emerald-600 mb-2 group-hover:scale-105 transform origin-left transition-transform">Crores of</h3>
              <p className="text-lg font-bold text-neutral-800 leading-snug">Customers buying across India</p>
            </div>
            <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors group">
              <h3 className="text-3xl font-black text-emerald-600 mb-2 group-hover:scale-105 transform origin-left transition-transform">Thousands of</h3>
              <p className="text-lg font-bold text-neutral-800 leading-snug">Serviceable pincodes — we deliver everywhere.</p>
            </div>
            <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors group">
              <h3 className="text-3xl font-black text-emerald-600 mb-2 group-hover:scale-105 transform origin-left transition-transform">Hundreds of</h3>
              <p className="text-lg font-bold text-neutral-800 leading-snug">Categories to sell online</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY SELL SECTION */}
      <section className="py-20 bg-neutral-900 text-white rounded-t-[3rem] mt-10">
        <div className="max-w-[1440px] mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-5xl font-black mb-16">Why sell on ymenet?</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3">Zero Listing Fees</h4>
              <p className="text-neutral-400 font-medium leading-relaxed">List unlimited products for free. You only pay a small commission when you actually make a sale.</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mb-6">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3">You Control Delivery</h4>
              <p className="text-neutral-400 font-medium leading-relaxed">Hand-deliver locally or use any courier you choose — no single logistics partner locks you in.</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3">Secure Payments</h4>
              <p className="text-neutral-400 font-medium leading-relaxed">Funds are deposited directly to your bank account after a short, predictable buyer-protection window.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/*  HOW YOUR FIRST SALE WORKS — animated order lifecycle        */}
      {/* ------------------------------------------------------------ */}
      <section className="relative py-24 bg-white overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-6">
          <Reveal className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">The Journey</span>
            <h2 className="text-3xl lg:text-5xl font-black text-neutral-900 mt-3 mb-4">What happens after you make a sale</h2>
            <p className="text-neutral-600 font-medium text-lg">
              Five steps, start to finish — and you're in control of every one of them.
            </p>
          </Reveal>

          {/* Desktop: horizontal stepper */}
          <div className="hidden lg:block relative">
            <div className="absolute top-8 left-0 right-0 h-[2px] bg-neutral-100" />
            <LifecycleProgressLine />
            <div className="grid grid-cols-5 gap-6 relative">
              {lifecycleSteps.map((step, i) => (
                <Reveal key={step.label} delay={i * 120}>
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-emerald-100 flex items-center justify-center mb-6 relative z-10 group-hover:border-emerald-500 group-hover:shadow-lg group-hover:shadow-emerald-100 transition-all duration-300">
                      <step.icon className="w-7 h-7 text-emerald-600" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-600 mb-2">Step {i + 1}</span>
                    <h4 className="font-bold text-neutral-900 mb-2">{step.label}</h4>
                    <p className="text-sm text-neutral-500 font-medium leading-relaxed px-2">{step.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Mobile: vertical stepper */}
          <div className="lg:hidden space-y-8 relative pl-8">
            <div className="absolute left-[31px] top-2 bottom-2 w-[2px] bg-emerald-100" />
            {lifecycleSteps.map((step, i) => (
              <Reveal key={step.label} delay={i * 100}>
                <div className="flex gap-5 relative">
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-white border-2 border-emerald-100 flex items-center justify-center relative z-10">
                    <step.icon className="w-7 h-7 text-emerald-600" />
                  </div>
                  <div className="pt-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-600 mb-1 block">Step {i + 1}</span>
                    <h4 className="font-bold text-neutral-900 mb-1">{step.label}</h4>
                    <p className="text-sm text-neutral-500 font-medium leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/*  TESTIMONIALS — auto-rotating                                */}
      {/* ------------------------------------------------------------ */}
      <TestimonialCarousel />

      {/* ------------------------------------------------------------ */}
      {/*  FAQ ACCORDION                                               */}
      {/* ------------------------------------------------------------ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal className="text-center mb-14">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Good to Know</span>
            <h2 className="text-3xl lg:text-4xl font-black text-neutral-900 mt-3">Common questions</h2>
          </Reveal>

          <div className="space-y-3">
            {faqs.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <Reveal key={item.q} delay={i * 80}>
                  <div className="border border-neutral-200 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-neutral-50 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="font-bold text-neutral-900">{item.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-emerald-600 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <div
                      className="grid transition-all duration-300 ease-out"
                      style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                    >
                      <div className="overflow-hidden">
                        <p className="px-6 pb-5 text-neutral-600 font-medium leading-relaxed">{item.a}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/*  FINAL CTA — animated gradient blob                         */}
      {/* ------------------------------------------------------------ */}
      <section className="relative py-24 overflow-hidden bg-emerald-600">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500 rounded-full blur-3xl opacity-50 animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-700 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="text-3xl lg:text-5xl font-black text-white mb-4">Ready to start selling?</h2>
            <p className="text-emerald-50 text-lg font-medium mb-10">
              It takes less than 5 minutes to get your first product live — no GST number required to begin.
            </p>
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-black bg-white !text-emerald-700 hover:!text-emerald-800 hover:bg-emerald-50 border-none shadow-2xl hover:-translate-y-0.5 transition-all">
                Start Selling Now
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Sub-component: animated progress line for the desktop stepper      */
/* ------------------------------------------------------------------ */
const LifecycleProgressLine: React.FC = () => {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  return (
    <div ref={ref} className="absolute top-8 left-0 h-[2px] bg-emerald-500 z-0" style={{
      width: inView ? '100%' : '0%',
      transition: 'width 1.4s cubic-bezier(0.65, 0, 0.35, 1)',
    }} />
  );
};

/* ------------------------------------------------------------------ */
/*  Sub-component: auto-rotating testimonial carousel                  */
/* ------------------------------------------------------------------ */
const TestimonialCarousel: React.FC = () => {
  const [active, setActive] = useState(0);
  const { ref, inView } = useInView<HTMLDivElement>(0.3);

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [inView]);

  return (
    <section ref={ref} className="py-24 bg-neutral-50">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">From Our Sellers</span>
        <h2 className="text-3xl lg:text-4xl font-black text-neutral-900 mt-3 mb-14">Real sellers, real businesses</h2>

        <div className="relative min-h-[220px] flex items-center justify-center">
          <Quote className="absolute -top-6 left-1/2 -translate-x-1/2 w-10 h-10 text-emerald-200" />
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-out ${
                i === active ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
              }`}
            >
              <p className="text-xl lg:text-2xl font-bold text-neutral-800 leading-snug max-w-2xl mb-6">
                "{t.quote}"
              </p>
              <p className="font-black text-emerald-600">{t.name}</p>
              <p className="text-sm text-neutral-500 font-medium">{t.place}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Show testimonial ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === active ? 'w-8 bg-emerald-600' : 'w-2 bg-emerald-200 hover:bg-emerald-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
