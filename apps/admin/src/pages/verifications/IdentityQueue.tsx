import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../core/contexts/AdminAuthContext';
import { getCached, setCached } from '../../core/cache';
import { formatDateTime } from '@ymenet/utils';
import { 
  ShieldCheck, Search, RefreshCw, Store, User, Phone, 
  ArrowRight, Clock
} from 'lucide-react';
import { SellerVerification } from '../../core/types';

const CACHE_PREFIX = 'yyme_verifications_';
const CACHE_TTL_MS = 2 * 60 * 1000;

const PROOF_NAMES: Record<string, string> = {
  AADHAAR: 'Aadhaar',
  PAN: 'PAN',
  DRIVING_LICENCE: 'Driving Licence',
  VOTER_ID: 'Voter ID',
  PASSPORT: 'Passport',
  GST: 'GST',
  ENROLLMENT_ID: 'Enrolment ID',
  DISABILITY_PROOF: 'Disability',
};

async function fetchFromDB(filter: string): Promise<SellerVerification[]> {
  let query = supabase.from('seller_verifications')
    .select('*, seller:sellers(seller_id, business_name, owner_name, whatsapp_number, phone_number, account_status)')
    .order('created_at', { ascending: false });

  if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  const { data: verifData, error: verifErr } = await query;
  if (verifErr) {
    console.warn('seller_verifications fetch note:', verifErr);
  }

  const list: any[] = verifData ? [...verifData] : [];

  if (filter === 'pending' || filter === 'all') {
    const existingSellerIds = new Set(list.map(v => v.seller_id));
    const { data: pendingSellers } = await supabase
      .from('sellers')
      .select('seller_id, business_name, owner_name, whatsapp_number, phone_number, account_status, created_at')
      .eq('account_status', 'pending_verification');

    if (pendingSellers) {
      for (const s of pendingSellers) {
        if (!existingSellerIds.has(s.seller_id)) {
          list.push({
            record_id: `synthetic-${s.seller_id}`,
            seller_id: s.seller_id,
            verification_type: 'AADHAAR',
            reference_number: 'New Registration',
            document_url: null,
            status: 'pending',
            created_at: s.created_at || new Date().toISOString(),
            seller: s,
          });
        }
      }
    }
  }

  return list;
}

export function IdentityQueue() {
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState<SellerVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchVerifications = useCallback(async (forceRefresh = false) => {
    const cacheKey = `${CACHE_PREFIX}${filter}`;

    if (!forceRefresh) {
      const cached = getCached<SellerVerification[]>(cacheKey, CACHE_TTL_MS);
      if (cached) {
        setVerifications(cached);
        setLoading(false);
        fetchFromDB(filter).then(fresh => {
          setCached(cacheKey, fresh);
          setVerifications(fresh);
        });
        return;
      }
    }

    setLoading(true);
    const data = await fetchFromDB(filter);
    setCached(cacheKey, data);
    setVerifications(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return verifications;
    const q = searchQuery.toLowerCase();
    return verifications.filter(v => 
      v.seller?.business_name?.toLowerCase().includes(q) ||
      v.seller?.owner_name?.toLowerCase().includes(q) ||
      v.seller?.phone_number?.includes(q) ||
      v.seller?.whatsapp_number?.includes(q) ||
      v.reference_number?.toLowerCase().includes(q) ||
      v.verification_type?.toLowerCase().includes(q)
    );
  }, [verifications, searchQuery]);

  const statusBadges: Record<string, { bg: string; label: string }> = {
    pending: { bg: 'bg-amber-50 border-amber-200 text-amber-800', label: 'Pending Review' },
    verified: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', label: 'Approved' },
    rejected: { bg: 'bg-red-50 border-red-200 text-red-800', label: 'Rejected' },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            Seller Identity Verifications
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Review new seller applications, verify identity documents, and approve store accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchVerifications(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-xl text-xs font-medium hover:bg-neutral-50 transition-colors shadow-sm"
            title="Refresh queue"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-1">
          {(['pending', 'rejected'] as const).map(tab => {
            const labels = {
              pending: 'Pending Review',
              rejected: 'Rejected',
            };
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  filter === tab
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search store, owner, phone..."
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* List / Table View */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
          <p className="text-xs text-neutral-500 mt-3 font-medium">Loading verifications...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <ShieldCheck className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-neutral-700">No {filter === 'pending' ? 'pending' : 'rejected'} verifications</h3>
          <p className="text-xs text-neutral-400 mt-1">
            {searchQuery ? 'Try adjusting your search query.' : 'Sellers will appear here when applications are submitted.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-neutral-100">
          {filteredList.map(v => {
            const badge = statusBadges[v.status] || statusBadges.pending;
            const proofLabel = PROOF_NAMES[v.verification_type] || v.verification_type || 'Aadhaar';

            return (
              <div
                key={v.record_id}
                onClick={() => navigate(`/verifications/${v.record_id}`)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/80 transition-colors cursor-pointer group"
              >
                {/* Store & Owner info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-neutral-900 truncate">
                        {v.seller?.business_name || 'Unnamed Store'}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-500 mt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                        {v.seller?.owner_name || 'N/A'}
                      </span>
                      {v.seller?.phone_number && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-neutral-400" />
                          {v.seller.phone_number}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ID Proof & Date & Action Button */}
                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pl-13 sm:pl-0">
                  <div className="text-left sm:text-right">
                    <div className="flex items-center sm:justify-end gap-1.5">
                      <span className="text-xs font-semibold text-neutral-800">{proofLabel}</span>
                      <span className="text-xs font-mono text-neutral-500">&bull; {v.reference_number || 'N/A'}</span>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-mono block mt-0.5 flex items-center sm:justify-end gap-1">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      {formatDateTime(v.created_at)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/verifications/${v.record_id}`);
                    }}
                    className="flex items-center gap-1 px-3.5 py-2 bg-neutral-100 hover:bg-emerald-600 hover:text-white text-neutral-700 rounded-xl text-xs font-semibold transition-all shadow-sm group-hover:bg-emerald-600 group-hover:text-white"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
