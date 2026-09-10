import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Button } from './Button';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { to: '/landing', label: 'Sell Online' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/pricing', label: 'Pricing & Commission' },
  { to: '/shipping', label: 'Shipping & Returns' },
  { to: '/no-gst', label: "Don't have GST?" },
];

export const LandingLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
      {/* COMMON HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 sm:h-24 flex items-center justify-between">
          <div className="flex items-center gap-6 lg:gap-10">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img src="/logo.png" alt="YYMEE Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-contain shrink-0 transform group-hover:scale-105 transition-transform" />
              <span className="text-lg sm:text-2xl font-black tracking-tight text-neutral-900">
                YYMEE<span className="text-emerald-600">.</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-semibold transition-colors ${
                    location.pathname === link.to
                      ? 'text-emerald-600 font-bold'
                      : 'text-neutral-600 hover:text-emerald-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/login">
              <Button variant="outline" className="font-bold border-neutral-200 hover:bg-neutral-50 hidden sm:inline-flex">
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all">
                Start Selling
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-neutral-600 hover:text-neutral-900 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-neutral-100 bg-white">
            <nav className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                    location.pathname === link.to
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-emerald-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="font-bold border-neutral-200 hover:bg-neutral-50 w-full mt-2 sm:hidden">
                  Login
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* PAGE CONTENT */}
      <main className="flex-1 w-full flex flex-col">
        <Outlet />
      </main>

      {/* COMMON FOOTER */}
      <footer className="bg-neutral-50 border-t border-neutral-200">
        <div className="max-w-[1440px] mx-auto px-6 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-24 mb-12">

            {/* Column 1: Brand */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <img src="/logo.png" alt="YYMEE Logo" className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-xl font-black tracking-tight text-neutral-900">
                  yymee<span className="text-emerald-600">.</span>
                </span>
              </div>
              <p className="text-sm text-neutral-600 font-medium leading-relaxed mb-6">
                Sell your products to crores of customers on YYMEE at 0% commission
              </p>
              <Link to="/signup">
                <Button className="font-bold bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                  Start Selling
                </Button>
              </Link>
            </div>

            {/* Column 2: Links */}
            <div>
              <h4 className="font-bold text-neutral-900 mb-6">Sell on YYMEE</h4>
              <ul className="space-y-4 text-sm font-medium text-neutral-500">
                <li><Link to="/landing" className="hover:text-emerald-600">Sell Online</Link></li>
                <li><a href="#" className="hover:text-emerald-600">Pricing & Commission</a></li>
                <li><Link to="/how-it-works" className="hover:text-emerald-600">How it works</Link></li>
                <li><a href="#" className="hover:text-emerald-600">Shipping & Returns</a></li>
                <li><a href="#" className="hover:text-emerald-600">Grow Your Business</a></li>
                <li><a href="#" className="hover:text-emerald-600">Learning Hub</a></li>
                <li><a href="#" className="hover:text-emerald-600">YYMEE Ads</a></li>
                <li><a href="#" className="hover:text-emerald-600">Shop Online on YYMEE</a></li>
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div>
              <h4 className="font-bold text-neutral-900 mb-6">Contact Us</h4>
              <p className="text-sm font-medium text-neutral-500 hover:text-emerald-600 mb-6 cursor-pointer">
                sell@yymee.com
              </p>
              <div className="flex items-center gap-3">
                <a href="#" aria-label="Instagram" className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-200 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a href="#" aria-label="Facebook" className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-200 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
                <a href="#" aria-label="YouTube" className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-200 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
                  </svg>
                </a>
              </div>
            </div>

          </div>

          <div className="border-t border-neutral-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-neutral-400">
            <p>© 2026 YYMEE Inc. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
