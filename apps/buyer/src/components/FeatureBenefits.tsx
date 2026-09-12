import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, MessageCircle, Sparkles, CheckCircle, X, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';
import { themeTokens } from '@ymenet/theme';

interface FeatureCard {
  title: string;
  description: string;
  cta: string;
  link?: string;
  onClick?: () => void;
  icon: React.ReactNode;
}

export function FeatureBenefits() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [showCustomOrderModal, setShowCustomOrderModal] = useState(false);

  const scrollToMakers = () => {
    const el = document.getElementById('verified-makers');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/shop');
    }
  };

  const FEATURES: FeatureCard[] = [
    {
      title: 'Under ₹499',
      description: 'Pocket-friendly authentic craft finds.',
      cta: 'Show products',
      link: '/search?max_price=499',
      icon: (
        <svg className="w-16 h-16 sm:w-20 sm:h-20 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Base stacked coins */}
          <ellipse cx="50" cy="74" rx="22" ry="7" stroke={themeTokens.colors.iconSvg} strokeWidth="2.5" fill={themeTokens.colors.primary} />
          <path d="M28 64C28 68 38 71 50 71C62 71 72 68 72 64" stroke={themeTokens.colors.iconSvg} strokeWidth="2.5" />
          <ellipse cx="50" cy="64" rx="22" ry="7" stroke={themeTokens.colors.iconSvg} strokeWidth="2.5" fill={themeTokens.colors.primary} />
          <path d="M28 54C28 58 38 61 50 61C62 61 72 58 72 54" stroke={themeTokens.colors.iconSvg} strokeWidth="2.5" />
          <ellipse cx="50" cy="54" rx="22" ry="7" stroke={themeTokens.colors.iconSvg} strokeWidth="2.5" fill={themeTokens.colors.primary} />
          {/* Arrow savings indicator */}
          <rect x="47" y="16" width="6" height="22" rx="3" fill={themeTokens.colors.iconSvg} />
          <path d="M41 36L50 45L59 36" stroke={themeTokens.colors.iconSvg} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {/* Rupee coin tag */}
          <circle cx="50" cy="54" r="9" fill={themeTokens.colors.background} stroke={themeTokens.colors.iconSvg} strokeWidth="1.8" />
          <text x="46.5" y="58" fontSize="11" fontWeight="bold" fill={themeTokens.colors.primary} fontFamily="sans-serif">₹</text>
        </svg>
      ),
    },
    {
      title: 'New Arrivals',
      description: 'Freshly listed handcrafted products.',
      cta: 'Explore New',
      link: '/search?sort=new',
      icon: (
        <svg className="w-16 h-16 sm:w-20 sm:h-20 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Package box */}
          <rect x="25" y="40" width="50" height="40" rx="6" stroke={themeTokens.colors.iconSvg} strokeWidth="2.5" fill={themeTokens.colors.primary} />
          <path d="M25 52H75" stroke={themeTokens.colors.iconSvg} strokeWidth="2.5" />
          <path d="M50 40V80" stroke={themeTokens.colors.iconSvg} strokeWidth="2.5" />
          {/* Open ribbon lid */}
          <path d="M25 40L42 26C44 24.5 47 24.5 49 26L75 40" stroke={themeTokens.colors.iconSvg} strokeWidth="2.5" fill={themeTokens.colors.background} />
          {/* Sparkling burst stars */}
          <path d="M78 22L80 27L85 29L80 31L78 36L76 31L71 29L76 27L78 22Z" fill={themeTokens.colors.iconSvg} />
          <path d="M20 28L21.5 32L25.5 33.5L21.5 35L20 39L18.5 35L14.5 33.5L18.5 32L20 28Z" fill={themeTokens.colors.iconSvg} />
          <circle cx="85" cy="46" r="2" fill={themeTokens.colors.iconSvg} />
        </svg>
      ),
    },
    {
      title: 'Best Sellers',
      description: 'Top-rated favorites loved by buyers.',
      cta: 'Go to Best Sellers',
      link: '/search?sort=best',
      icon: (
        <svg className="w-16 h-16 sm:w-20 sm:h-20 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Shopping bag */}
          <path d="M28 36H72V80C72 82 70 84 68 84H32C30 84 28 82 28 80V36Z" stroke={themeTokens.colors.iconSvg} strokeWidth="2.5" fill={themeTokens.colors.primary} />
          {/* Handle */}
          <path d="M38 36V26C38 20.5 42.5 16 48 16H52C57.5 16 62 20.5 62 26V36" stroke={themeTokens.colors.iconSvg} strokeWidth="2.5" strokeLinecap="round" />
          {/* Star badge on bag */}
          <circle cx="50" cy="58" r="14" fill={themeTokens.colors.background} stroke={themeTokens.colors.iconSvg} strokeWidth="2" />
          <path d="M50 49L52.8 54.8L59 55.7L54.5 60.1L55.6 66.3L50 63.4L44.4 66.3L45.5 60.1L41 55.7L47.2 54.8L50 49Z" fill={themeTokens.colors.primary} stroke={themeTokens.colors.iconSvg} strokeWidth="1" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: 'Direct from Maker',
      description: '0% middleman fees, 100% authentic.',
      cta: 'View Makers',
      onClick: scrollToMakers,
      icon: (
        <svg className="w-16 h-16 sm:w-20 sm:h-20 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Workshop Storefront awning */}
          <path d="M20 38L25 24H75L80 38V44H20V38Z" stroke={themeTokens.colors.iconSvg} strokeWidth="2.5" fill={themeTokens.colors.background} />
          <path d="M32 44V24M44 44V24M56 44V24M68 44V24" stroke={themeTokens.colors.iconSvg} strokeWidth="1.5" />
          {/* Store body */}
          <rect x="24" y="44" width="52" height="36" stroke={themeTokens.colors.iconSvg} strokeWidth="2.5" fill={themeTokens.colors.primary} />
          {/* Artisan doorway / arched window */}
          <path d="M40 80V60C40 54.5 44.5 50 50 50C55.5 50 60 54.5 60 60V80" stroke={themeTokens.colors.iconSvg} strokeWidth="2.5" fill={themeTokens.colors.background} />
          {/* Verified Badge tick */}
          <circle cx="76" cy="30" r="7" fill={themeTokens.colors.background} stroke={themeTokens.colors.iconSvg} strokeWidth="1.5" />
          <path d="M73 30L75.5 32.5L79 28" stroke={themeTokens.colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: 'Custom Orders',
      description: 'Chat with makers for custom size & bulk.',
      cta: 'How it Works',
      onClick: () => setShowCustomOrderModal(true),
      icon: (
        <svg className="w-16 h-16 sm:w-20 sm:h-20 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* WhatsApp / Chat Bubble */}
          <path d="M22 46C22 32.7 33.7 22 48 22C62.3 22 74 32.7 74 46C74 59.3 62.3 70 48 70C43 70 38.3 68.7 34.2 66.4L20 71L24.3 58C22.8 54.4 22 50.3 22 46Z" stroke={themeTokens.colors.iconSvg} strokeWidth="2.5" fill={themeTokens.colors.primary} />
          {/* Craft tape / pencil inside chat */}
          <path d="M38 42H58" stroke={themeTokens.colors.background} strokeWidth="3" strokeLinecap="round" />
          <path d="M38 50H52" stroke={themeTokens.colors.background} strokeWidth="3" strokeLinecap="round" />
          {/* Floating heart / custom needle */}
          <circle cx="70" cy="24" r="7" fill={themeTokens.colors.background} stroke={themeTokens.colors.iconSvg} strokeWidth="1.5" />
          <path d="M67 24C67 21.5 70 21 70 23.5C70 21 73 21.5 73 24C73 26 70 27.5 70 27.5C70 27.5 67 26 67 24Z" fill="#DC2626" />
        </svg>
      ),
    },
    {
      title: 'Hot Deals & Offers',
      description: 'Exclusive discounts directly from makers.',
      cta: 'View Deals',
      link: '/search?filter=deals',
      icon: (
        <svg className="w-16 h-16 sm:w-20 sm:h-20 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Discount tag badge */}
          <path d="M30 24H54L78 48C80 50 80 54 78 56L56 78C54 80 50 80 48 78L24 54V30C24 26.7 26.7 24 30 24Z" stroke={themeTokens.colors.iconSvg} strokeWidth="2.5" fill={themeTokens.colors.primary} />
          {/* Tag hole */}
          <circle cx="36" cy="36" r="4.5" fill={themeTokens.colors.background} stroke={themeTokens.colors.iconSvg} strokeWidth="2" />
          {/* Percent % symbol */}
          <circle cx="48" cy="50" r="2.5" fill={themeTokens.colors.background} />
          <line x1="60" y1="46" x2="46" y2="60" stroke={themeTokens.colors.background} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="58" cy="56" r="2.5" fill={themeTokens.colors.background} />
          {/* Flame flare */}
          <path d="M72 22C72 22 78 26 76 32C79 30 80 27 80 27C80 27 84 31 82 38C86 34 85 28 85 28C85 28 89 33 87 40C87 40 91 35 90 30" stroke={themeTokens.colors.iconSvg} strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <section className="w-full relative z-20 -mt-10 sm:-mt-22 pb-4">
        <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 relative">
          <div
            ref={scrollRef}
            className="flex sm:grid sm:grid-cols-6 gap-2 sm:gap-3.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {FEATURES.map((feature, i) => {
              const buttonClasses =
                'w-full text-[10px] sm:text-xs font-bold py-1.5 px-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors text-center shadow-xs block cursor-pointer';

              return (
                <div
                  key={i}
                  className="shrink-0 w-[125px] sm:w-auto min-h-[220px] sm:min-h-[265px] rounded-xl p-3 sm:p-4 text-center flex flex-col items-center justify-between shadow-md border border-neutral-100 bg-white hover:shadow-lg transition-all duration-200 snap-start group"
                >
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-900 leading-snug group-hover:text-emerald-700 transition-colors">
                    {feature.title}
                  </h3>

                  <div className="relative flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 my-1.5 shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <div className="absolute w-12 h-12 sm:w-16 sm:h-16 rounded-[60%_40%_30%_70%_/_60%_30%_70%_40%] bg-emerald-500/15" />
                    {feature.icon}
                  </div>

                  <p className="text-[10px] sm:text-xs leading-tight text-neutral-500 mb-2">
                    {feature.description}
                  </p>

                  {feature.onClick ? (
                    <button onClick={feature.onClick} className={buttonClasses}>
                      {feature.cta}
                    </button>
                  ) : (
                    <Link to={feature.link || '/shop'} className={buttonClasses}>
                      {feature.cta}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {/* Floating next button (mobile only) */}
          <button
            onClick={() => {
              if (scrollRef.current) {
                scrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
              }
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white w-10 h-10 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-neutral-200 flex items-center justify-center cursor-pointer z-20 sm:hidden"
            aria-label="Next benefit"
          >
            <ChevronRight className="w-5 h-5 text-neutral-600" />
          </button>
        </div>
      </section>

      {/* Custom Orders & WhatsApp Connect Modal */}
      {showCustomOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-neutral-100 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowCustomOrderModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900">Custom & Direct Orders</h3>
                <p className="text-xs text-neutral-500">Connect directly with authentic makers on WhatsApp</p>
              </div>
            </div>

            <div className="space-y-3.5 my-6 text-xs sm:text-sm text-neutral-600">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-neutral-900 mb-0.5">Custom Sizing & Colors</h4>
                  <p className="text-xs text-neutral-500">Need specific textile measurements, terracotta designs, or bespoke framing? Request custom craft details right with the artisan.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
                <HeartHandshake className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-neutral-900 mb-0.5">Bulk & Festive Gifting</h4>
                  <p className="text-xs text-neutral-500">Order wedding hampers, corporate handcrafted gifts, or bulk party sets directly at workshop rates.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-neutral-900 mb-0.5">0% Hidden Middleman Markup</h4>
                  <p className="text-xs text-neutral-500">Every single rupee goes straight to the weaver and craftsperson with verified quality checks.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowCustomOrderModal(false);
                  navigate('/shop');
                }}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-colors text-center shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Browse Verified Makers</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowCustomOrderModal(false)}
                className="py-3 px-5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
