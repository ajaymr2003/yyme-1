import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../core/contexts/AdminAuthContext';
import { getCached, setCached } from '../../core/cache';
import { formatINR, formatDateTime } from '@ymenet/utils';
import { CreditCard, ChevronRight } from 'lucide-react';
import { UpgradeRequest } from '../../core/types';

const CACHE_PREFIX = 'yyme_upgrades_';
const CACHE_TTL_MS = 3 * 60 * 1000;

async function fetchFromDB(filter: string): Promise<UpgradeRequest[]> {
  let query = supabase.from('subscription_upgrade_requests')
    .select('*, seller:sellers(business_name, owner_name), plan:subscription_plans(name, monthly_price)')
    .order('created_at', { ascending: false });
  if (filter !== 'all') query = query.eq('status', filter);
  const { data } = await query;
  return (data as any) ?? [];
}

export function UpgradeRequestsQueue() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending_approval' | 'approved' | 'rejected'>('pending_approval');

  const fetchRequests = useCallback(async (forceRefresh = false) => {
    const cacheKey = `${CACHE_PREFIX}${filter}`;

    if (!forceRefresh) {
      const cached = getCached<UpgradeRequest[]>(cacheKey, CACHE_TTL_MS);
      if (cached) {
        setRequests(cached);
        setLoading(false);
        fetchFromDB(filter).then(fresh => {
          setCached(cacheKey, fresh);
          setRequests(fresh);
        });
        return;
      }
    }

    setLoading(true);
    const data = await fetchFromDB(filter);
    setCached(cacheKey, data);
    setRequests(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const statusColors: Record<string, string> = {
    pending_approval: 'bg-amber-50 text-amber-700 border border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border border-red-200',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Subscription Upgrade Requests</h1>
        <select value={filter} onChange={e => setFilter(e.target.value as any)}
          className="px-3 py-2 bg-white border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="pending_approval">Pending</option>
          <option value="all">All</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-600">No {filter === 'pending_approval' ? 'pending' : ''} requests</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Seller</th>
                <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Target Plan</th>
                <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Method</th>
                <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">UTR</th>
                <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.request_id}
                  onClick={() => navigate(`/seller-upgrades/${req.request_id}`)}
                  className="border-b border-neutral-100 last:border-0 hover:bg-emerald-50/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-[11px] font-bold text-neutral-600 shrink-0">
                        {req.seller?.business_name?.charAt(0) ?? 'S'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{req.seller?.business_name ?? 'Unknown'}</p>
                        <p className="text-[10px] text-neutral-400">{req.seller?.owner_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[req.status]}`}>
                      {req.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-neutral-900 capitalize">{req.target_plan_id.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-xs font-bold text-emerald-700">{formatINR(req.amount_paid)}</td>
                  <td className="px-4 py-3 text-xs text-neutral-600">{req.payment_method}</td>
                  <td className="px-4 py-3 text-xs font-mono text-neutral-600">{req.utr_reference_number}</td>
                  <td className="px-4 py-3 text-[11px] text-neutral-400">{formatDateTime(req.created_at)}</td>
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
