import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSellerAuth, supabase } from '../../core/contexts/SellerAuthContext';
import { useQuota } from '../../core/contexts/QuotaContext';
import { formatINR } from '@ymenet/utils';
import { BarChart3, Package, Zap, MessageCircle, TrendingUp, Plus, ArrowRight } from 'lucide-react';

export function DashboardPage() {
  const { sellerProfile } = useSellerAuth();
  const { clicksUsed, clicksRemaining, listingsUsed, listingsRemaining, tier } = useQuota();
  const [recentClicks, setRecentClicks] = useState<any[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);

  useEffect(() => {
    if (!sellerProfile) return;
    supabase.from('whatsapp_click_logs')
      .select('*, product:products(name)')
      .eq('seller_id', sellerProfile.seller_id)
      .order('clicked_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setRecentClicks(data ?? []));

    supabase.from('whatsapp_click_logs')
      .select('log_id', { count: 'exact', head: true })
      .eq('seller_id', sellerProfile.seller_id)
      .then(({ count }) => setTotalClicks(count ?? 0));
  }, [sellerProfile]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Welcome back, {sellerProfile?.business_name}</p>
        </div>
        <Link to="/products/add"
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Clicks Used', value: clicksUsed, icon: <Zap className="w-5 h-5 text-amber-500" />, color: 'bg-amber-50 border-amber-200' },
          { label: 'Clicks Left', value: clicksRemaining, icon: <MessageCircle className="w-5 h-5 text-emerald-500" />, color: 'bg-emerald-50 border-emerald-200' },
          { label: 'Products Listed', value: listingsUsed, icon: <Package className="w-5 h-5 text-blue-500" />, color: 'bg-blue-50 border-blue-200' },
          { label: 'Listings Left', value: listingsRemaining, icon: <BarChart3 className="w-5 h-5 text-purple-500" />, color: 'bg-purple-50 border-purple-200' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">{stat.icon}</div>
            <p className="text-2xl font-black text-neutral-900">{stat.value}</p>
            <p className="text-[11px] text-neutral-500 font-medium mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Current Plan */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Current Plan</p>
            <h3 className="text-lg font-bold text-neutral-900 mt-1 capitalize">{tier} Tier</h3>
          </div>
          <Link to="/subscription"
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline">
            Upgrade <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="mt-3 bg-neutral-100 rounded-lg p-3">
          <div className="flex justify-between text-xs text-neutral-600 mb-1">
            <span>Click usage</span>
            <span className="font-semibold">{clicksUsed} / {clicksUsed + clicksRemaining}</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (clicksUsed / (clicksUsed + clicksRemaining || 1)) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Recent WhatsApp Clicks */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Recent WhatsApp Clicks</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">{totalClicks} total leads captured</p>
          </div>
        </div>
        <div className="p-5">
          {recentClicks.length === 0 ? (
            <div className="text-center py-6">
              <MessageCircle className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs text-neutral-500">No clicks yet. Add products to start receiving orders!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentClicks.map(click => (
                <div key={click.log_id} className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-neutral-900">{click.product?.name ?? 'Product'}</p>
                    <p className="text-[10px] text-neutral-400">{click.buyer_phone ?? 'Anonymous'} · {click.buyer_pincode ?? 'N/A'}</p>
                  </div>
                  <span className="text-[10px] text-neutral-400">{new Date(click.clicked_at).toLocaleDateString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
