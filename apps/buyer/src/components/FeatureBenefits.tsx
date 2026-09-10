import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface FeatureCard {
  title: string;
  description: string;
  cta: string;
  link: string;
  icon: React.ReactNode;
}

const FEATURES: FeatureCard[] = [
  {
    title: 'Free shipping',
    description: 'Benefit for your first purchase.',
    cta: 'Show products',
    link: '/shop',
    icon: (
      <svg className="w-16 h-16 sm:w-24 sm:h-24 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="35" width="50" height="45" rx="4" stroke="#333" strokeWidth="2.5" fill="#00b33b" />
        <path d="M25 45H75" stroke="#333" strokeWidth="2.5" />
        <path d="M50 35V80" stroke="#333" strokeWidth="2.5" />
        <path d="M25 35L42 22C44 20.5 47 20.5 49 22L75 35" stroke="#333" strokeWidth="2.5" fill="#FFF" />
        <circle cx="15" cy="20" r="1.5" fill="#333" />
        <circle cx="85" cy="25" r="2" fill="#333" />
        <path d="M80 50L83 47M83 47L80 44M83 47H88" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 55L15 52M15 52L12 49M15 52H20" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Enter your account',
    description: 'Enjoy offers to buy everything you want.',
    cta: 'Sign in',
    link: '/login',
    icon: (
      <svg className="w-16 h-16 sm:w-24 sm:h-24 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="25" width="60" height="50" rx="6" stroke="#333" strokeWidth="2.5" fill="#00b33b" />
        <circle cx="50" cy="45" r="10" stroke="#333" strokeWidth="2.5" fill="#FFF" />
        <path d="M35 68C35 59.5 41.5 56 50 56C58.5 56 65 59.5 65 68" stroke="#333" strokeWidth="2.5" strokeLinecap="round" fill="#FFF" />
        <circle cx="27" cy="33" r="2" fill="#333" />
        <circle cx="34" cy="33" r="2" fill="#333" />
        <line x1="20" y1="38" x2="80" y2="38" stroke="#333" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: 'Enter your location',
    description: 'Check delivery costs and times.',
    cta: 'Set location',
    link: '/shop',
    icon: (
      <svg className="w-16 h-16 sm:w-24 sm:h-24 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 30L40 20L60 30L80 20V70L60 80L40 70L20 80V30Z" stroke="#333" strokeWidth="2.5" fill="#FFF" />
        <line x1="40" y1="20" x2="40" y2="70" stroke="#333" strokeWidth="2" strokeDasharray="3 3" />
        <line x1="60" y1="30" x2="60" y2="80" stroke="#333" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M50 30C43 30 38 35 38 42C38 50 50 63 50 63C50 63 62 50 62 42C62 35 57 30 50 30Z" stroke="#333" strokeWidth="2.5" fill="#00b33b" />
        <circle cx="50" cy="40" r="4" fill="#333" />
      </svg>
    ),
  },
  {
    title: 'Payment methods',
    description: 'Pay for purchases securely.',
    cta: 'Show methods',
    link: '/shop',
    icon: (
      <svg className="w-16 h-16 sm:w-24 sm:h-24 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="22" y="32" width="56" height="42" rx="5" stroke="#333" strokeWidth="2.5" fill="#FFF" />
        <path d="M50 32H78V74H50C43 74 38 69 38 62C38 55 43 50 50 50H78" stroke="#333" strokeWidth="2.5" fill="#00b33b" />
        <circle cx="62" cy="62" r="3.5" stroke="#333" strokeWidth="2.5" fill="#FFF" />
        <path d="M30 42H58" stroke="#333" strokeWidth="2" strokeLinecap="round" />
        <path d="M30 50H45" stroke="#333" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Under ₹500',
    description: 'Check products with low prices.',
    cta: 'Show products',
    link: '/shop',
    icon: (
      <svg className="w-16 h-16 sm:w-24 sm:h-24 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="74" rx="20" ry="7" stroke="#333" strokeWidth="2.5" fill="#00b33b" />
        <path d="M30 64C30 68 39 71 50 71C61 71 70 68 70 64" stroke="#333" strokeWidth="2.5" />
        <ellipse cx="50" cy="64" rx="20" ry="7" stroke="#333" strokeWidth="2.5" fill="#00b33b" />
        <path d="M30 54C30 58 39 61 50 61C61 61 70 58 70 54" stroke="#333" strokeWidth="2.5" />
        <ellipse cx="50" cy="54" rx="20" ry="7" stroke="#333" strokeWidth="2.5" fill="#00b33b" />
        <rect x="47" y="18" width="6" height="22" fill="#333" />
        <path d="M42 38L50 46L58 38" stroke="#333" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="50" cy="54" r="8" fill="#FFF" stroke="#333" strokeWidth="1.5" />
        <text x="47" y="58" fontSize="10" fontWeight="bold" fill="#333">₹</text>
      </svg>
    ),
  },
  {
    title: 'Best sellers',
    description: 'Explore trending top picks.',
    cta: 'Go to Best Sellers',
    link: '/shop',
    icon: (
      <svg className="w-16 h-16 sm:w-24 sm:h-24 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M35 38H65V78H35V38Z" stroke="#333" strokeWidth="2.5" fill="#00b33b" />
        <path d="M42 38C42 33 45 28 50 28C55 28 58 33 58 38" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M48 64H72C75 64 78 68 78 72C78 74 76 76 74 76H46L48 64Z" stroke="#333" strokeWidth="2" fill="#FFF" />
        <path d="M46 76L42 70L48 64" stroke="#333" strokeWidth="2" fill="#FFF" />
        <line x1="62" y1="67" x2="68" y2="72" stroke="#333" strokeWidth="1.5" />
        <line x1="58" y1="70" x2="64" y2="75" stroke="#333" strokeWidth="1.5" />
      </svg>
    ),
  },
];

export function FeatureBenefits() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="w-full relative z-30 mt-4 md:-mt-10 pb-0 md:pb-4">
      <div className="max-w-[1400px] mx-auto px-0 sm:px-5 lg:px-8 xl:px-12 relative">
        <div
          ref={scrollRef}
          className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 px-4 sm:px-0 snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className="shrink-0 w-[110px] sm:w-auto min-h-[195px] sm:min-h-[285px] rounded-[6px] p-2.5 sm:p-5 text-center flex flex-col items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.1)] border border-neutral-200 bg-white transition-all duration-200 snap-start"
            >
              <h3 className="text-xs sm:text-base font-medium mb-1.5 sm:mb-3 text-neutral-900">{feature.title}</h3>
              <div className="relative flex items-center justify-center w-16 h-16 sm:w-24 sm:h-24 mb-2 sm:mb-3 shrink-0">
                <div className="absolute w-13 h-13 sm:w-20 sm:h-20 rounded-[60%_40%_30%_70%_/_60%_30%_70%_40%] bg-emerald-500/15" />
                {feature.icon}
              </div>
              <p className="text-[10px] sm:text-xs leading-tight mb-2 sm:mb-3 text-neutral-500">{feature.description}</p>
              <Link
                to={feature.link}
                className="w-full text-[9px] sm:text-xs font-bold py-1 px-1.5 sm:py-2 sm:px-3 rounded-[4px] bg-[#00b33b] text-white hover:bg-[#009932] transition-colors text-center"
              >
                {feature.cta}
              </Link>
            </div>
          ))}
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
  );
}
