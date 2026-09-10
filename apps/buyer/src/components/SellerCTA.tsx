import React from 'react';
import { Link } from 'react-router-dom';

export function SellerCTA() {
  return (
    <section className="w-full py-6">
      <div className="bg-emerald-800 rounded-xl p-4 text-white flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-base font-extrabold">Start Selling Today</h2>
          <p className="text-emerald-100 text-[10px] leading-relaxed max-w-md">
            Join hundreds of local merchants. Upload listings with 0% platform commissions.
          </p>
        </div>
        <Link
          to="http://localhost:5174"
          className="shrink-0 inline-flex items-center justify-center px-5 py-2 bg-white text-emerald-800 text-sm font-bold rounded-lg hover:bg-emerald-50 transition-colors"
        >
          Register Seller
        </Link>
      </div>
    </section>
  );
}
