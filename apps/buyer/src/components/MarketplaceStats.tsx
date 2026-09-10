import React from 'react';

const STATS = [
  { value: '10,000+', label: 'Products' },
  { value: '500+', label: 'Artisans' },
  { value: '50K+', label: 'Buyers' },
  { value: '4.8★', label: 'Rating' },
];

export function MarketplaceStats() {
  return (
    <section className="bg-emerald-900 text-white py-4">
      <div className="w-full px-0 grid grid-cols-4 gap-2 text-center">
        {STATS.map((stat, i) => (
          <div key={i}>
            <h3 className="text-sm font-black text-emerald-300">{stat.value}</h3>
            <p className="text-[8px] font-semibold text-emerald-100 uppercase">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
