import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../core/contexts/AdminAuthContext';
import { getCached, setCached } from '../../core/cache';
import { formatDateTime } from '@ymenet/utils';
import { Store, ChevronRight, Search } from 'lucide-react';
import { Seller } from '../../core/types';

const CACHE_PREFIX = 'yyme_sellers_';
const CACHE_TTL_MS = 3 * 60 * 1000;

async function fetchFromDB(search: string): Promise<Seller[]> {
  let query = supabase.from('sellers')
    .select('*')
    .order('created_at', { ascending: false });
  if (search.trim()) {
    query = query.or(`business_name.ilike.%${search}%,owner_name.ilike.%${search}%,whatsapp_number.ilike.%${search}%`);
  }
  const { data } = await query;
  return (data as any) ?? [];
}

export function Sellers() {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSellers = useCallback(async (forceRefresh = false) => {
    const cacheKey = `${CACHE_PREFIX}${search}`;

    if (!forceRefresh) {
      const cached = getCached<Seller[]>(cacheKey, CACHE_TTL_MS);
      if (cached) {
        setSellers(cached);
        setLoading(false);
        fetchFromDB(search).then(fresh => {
          setCached(cacheKey, fresh);
          setSellers(fresh);
        });
        return;
      }
    }

    setLoading(true);
    const data = await fetchFromDB(search);
    setCached(cacheKey, data);
    setSellers(data);
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchSellers(); }, [fetchSellers]);

  const statusColors: Record<string, string> = {
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    pending_verification: 'bg-amber-50 text-amber-700 border border-amber-200',
    rejected: 'bg-red-50 text-red-700 border border-red-200',
    frozen: 'bg-neutral-100 text-neutral-600 border border-neutral-200',
    suspended: 'bg-red-50 text-red-700 border border-red-200',
  };

  const tierColors: Record<string, string> = {
    free: 'bg-neutral-100 text-neutral-600',
    standard: 'bg-blue-50 text-blue-700',
    premium: 'bg-purple-50 text-purple-700',
    extra_premium: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Sellers</h1>
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sellers..."
            className="pl-9 pr-3 py-2 bg-white border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
        </div>
      ) : sellers.length === 0 ? (
        <div className="text-center py-12">
          <Store className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-600">No sellers found</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Seller</th>
                <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Tier</th>
                <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Clicks</th>
                <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Listings</th>
                <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sellers.map(seller => (
                <tr key={seller.seller_id}
                  onClick={() => navigate(`/sellers/${seller.seller_id}`)}
                  className="border-b border-neutral-100 last:border-0 hover:bg-emerald-50/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-[11px] font-bold text-emerald-700 shrink-0">
                        {seller.business_name?.charAt(0) ?? 'S'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{seller.business_name}</p>
                        <p className="text-[10px] text-neutral-400">{seller.owner_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[seller.account_status] || 'bg-neutral-100 text-neutral-600'}`}>
                      {seller.account_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${tierColors[seller.subscription_tier] || 'bg-neutral-100 text-neutral-600'}`}>
                      {seller.subscription_tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-700">
                    <span className="font-semibold">{seller.remaining_click_quota}</span>
                    <span className="text-neutral-400"> / {seller.click_quota}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-700">
                    <span className="font-semibold">{seller.used_listing_count}</span>
                    <span className="text-neutral-400"> / {seller.max_listing_quota}</span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-neutral-400">{formatDateTime(seller.created_at)}</td>
                  <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-neutral-400" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
