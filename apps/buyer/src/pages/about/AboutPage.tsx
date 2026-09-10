import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, Users, MapPin, ArrowRight, Sparkles } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="bg-surface-page">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-800 to-brand-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-xs mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Kerala-Based Artisan Marketplace
              </div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight mb-4">
                Every purchase empowers a life
              </h1>
              <p className="text-sm text-emerald-100/90 leading-relaxed mb-6">
                YYME is a zero-commission marketplace connecting you directly with verified artisans and differently-abled makers across India. No middlemen. No markups. Just authentic, handcrafted products delivered to your doorstep.
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-800 text-sm font-bold rounded-xl shadow-md hover:bg-emerald-50 transition-colors"
              >
                Shop & Support Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="w-64 h-64 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                    <span className="text-4xl font-black">Y</span>
                  </div>
                  <p className="text-sm font-bold">YYMEE</p>
                  <p className="text-xs text-emerald-200">Direct Artisan Commerce</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Strip */}
          <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-white/20">
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-black">500+</p>
              <p className="text-xs text-emerald-200 mt-1">Verified Artisans</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-black">Rs.0</p>
              <p className="text-xs text-emerald-200 mt-1">Commission</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-black">14</p>
              <p className="text-xs text-emerald-200 mt-1">Districts</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div>
          <h2 className="text-xl font-black text-neutral-900 mb-3">Our Story</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            From the weaving villages of Balaramapuram to the coir workshops of Alappuzha, from the cane clusters of Thrissur to the pottery studios of Wayanad — Kerala's artisan heritage is rich, diverse, and deeply human.
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
          <p className="text-sm text-neutral-700 leading-relaxed">
            YYME was born from a simple question: <strong>Why should artisans lose 20-40% of their income to middlemen?</strong> We built a zero-commission platform where verified sellers — including differently-abled artisans backed by CHAD Kerala and government disability registers — connect directly with conscious buyers.
          </p>
          <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-xs font-bold text-emerald-800">🤝 Cooperative Fund</p>
            <p className="text-xs text-emerald-700 mt-1">
              5% of all YYME revenues go into a cooperative fund supporting artisan welfare, skill development, and community empowerment.
            </p>
          </div>
        </div>

        {/* Verification Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: <Shield className="w-6 h-6 text-emerald-600" />,
              title: 'Govt. Verified',
              desc: 'Every seller is verified through government IDs, GST, or disability certificates.',
            },
            {
              icon: <Heart className="w-6 h-6 text-pink-600" />,
              title: 'Differently-Abled First',
              desc: 'An accessibility-first platform prioritizing differently-abled artisans and makers.',
            },
            {
              icon: <Users className="w-6 h-6 text-blue-600" />,
              title: '100% Direct Income',
              desc: 'Zero commission. Every rupee goes directly to the artisan or maker.',
            },
          ].map((card, idx) => (
            <div key={idx} className="bg-white border border-neutral-200 rounded-xl p-5 text-center shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                {card.icon}
              </div>
              <h3 className="text-sm font-bold text-neutral-900 mb-1">{card.title}</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-xl font-black mb-2">Be the Change</h2>
          <p className="text-sm text-emerald-100/90 mb-5 max-w-md mx-auto">
            Every purchase from YYME directly supports an artisan, a family, and a tradition. Join us in building a fairer marketplace.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-800 text-sm font-bold rounded-xl shadow-md hover:bg-emerald-50 transition-colors"
          >
            Shop & Support Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
