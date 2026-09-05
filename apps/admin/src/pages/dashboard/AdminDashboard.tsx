import React, { useEffect, useState } from 'react';
import { supabase } from '../../core/contexts/AdminAuthContext';
import { ShieldCheck, Users, Package, Zap, TrendingUp, BarChart3 } from 'lucide-react';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalSellers: 0, pendingVerifications: 0, activeSellers: 0,
    totalProducts: 0, totalClicks: 0, pendingUpgrades: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const [sellers, pending, active, products, clicks, upgrades] = await Promise.all([
        supabase.from('sellers').select('seller_id', { count: 'exact', head: true }),
        supabase.from('seller_verifications').select('record_id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('sellers').select('seller_id', { count: 'exact', head: true }).eq('account_status', 'active'),
        supabase.from('products').select('product_id', { count: 'exact', head: true }),
        supabase.from('whatsapp_click_logs').select('log_id', { count: 'exact', head: true }),
        supabase.from('subscription_upgrade_requests').select('request_id', { count: 'exact', head: true }).eq('status', 'pending_approval'),
      ]);

      setStats({
        totalSellers: sellers.count ?? 0,
        pendingVerifications: pending.count ?? 0,
        activeSellers: active.count ?? 0,
        totalProducts: products.count ?? 0,
        totalClicks: clicks.count ?? 0,
        pendingUpgrades: upgrades.count ?? 0,
      });
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-neutral-900">Platform Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Total Sellers', value: stats.totalSellers, icon: <Users className="w-5 h-5 text-blue-500" />, color: 'bg-blue-50 border-blue-200' },
          { label: 'Active Sellers', value: stats.activeSellers, icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />, color: 'bg-emerald-50 border-emerald-200' },
          { label: 'Pending KYC', value: stats.pendingVerifications, icon: <ShieldCheck className="w-5 h-5 text-amber-500" />, color: 'bg-amber-50 border-amber-200' },
          { label: 'Total Products', value: stats.totalProducts, icon: <Package className="w-5 h-5 text-purple-500" />, color: 'bg-purple-50 border-purple-200' },
          { label: 'Total Leads', value: stats.totalClicks, icon: <TrendingUp className="w-5 h-5 text-emerald-500" />, color: 'bg-emerald-50 border-emerald-200' },
          { label: 'Pending Upgrades', value: stats.pendingUpgrades, icon: <Zap className="w-5 h-5 text-amber-500" />, color: 'bg-amber-50 border-amber-200' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">{stat.icon}</div>
            <p className="text-2xl font-black text-neutral-900">{stat.value}</p>
            <p className="text-[11px] text-neutral-500 font-medium mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-neutral-900 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Review Identity Verifications', href: '/verifications', count: stats.pendingVerifications, color: 'bg-amber-100 text-amber-800' },
              { label: 'Approve Subscription Upgrades', href: '/subscriptions', count: stats.pendingUpgrades, color: 'bg-blue-100 text-blue-800' },
              { label: 'Manage Categories', href: '/categories', count: null, color: 'bg-purple-100 text-purple-800' },
              { label: 'Manage Banners', href: '/promotions', count: null, color: 'bg-emerald-100 text-emerald-800' },
            ].map((action, i) => (
              <a key={i} href={action.href}
                className="flex items-center justify-between p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-100">
                <span className="text-sm font-medium text-neutral-700">{action.label}</span>
                {action.count !== null && action.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${action.color}`}>{action.count}</span>
                )}
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-neutral-900 mb-3">Platform Health</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-neutral-600 mb-1">
                <span>Seller Approval Rate</span>
                <span className="font-semibold">{stats.totalSellers > 0 ? Math.round((stats.activeSellers / stats.totalSellers) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${stats.totalSellers > 0 ? (stats.activeSellers / stats.totalSellers) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-neutral-600 mb-1">
                <span>KYC Backlog</span>
                <span className="font-semibold">{stats.pendingVerifications} pending</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${stats.pendingVerifications > 10 ? 'bg-red-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, stats.pendingVerifications * 10)}%` }} />
              </div>
            </div>
            <div className="pt-2 border-t border-neutral-100">
              <p className="text-[11px] text-neutral-400">Lead conversion tracking: {stats.totalClicks} WhatsApp clicks logged across all sellers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
