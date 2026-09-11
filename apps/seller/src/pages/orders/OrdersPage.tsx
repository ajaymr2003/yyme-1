import React, { useEffect, useState } from 'react';
import { useSellerAuth, supabase } from '../../core/contexts/SellerAuthContext';
import { formatINR } from '@ymenet/utils';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  XCircle,
  AlertCircle,
  ChevronDown,
  RefreshCw,
  Eye,
  Calendar,
  User,
  Filter
} from 'lucide-react';

export interface OrderItem {
  order_id: string;
  order_number?: string;
  seller_id: string;
  buyer_id?: string;
  product_id?: string;
  variant_id?: string;
  item_price: number;
  product_images?: string[];
  status: 'initiated' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | string;
  clicked_at?: string;
  created_at?: string;
  product?: {
    product_id: string;
    name: string;
    base_price: number;
  };
  variant?: {
    variant_id: string;
    variant_type: string;
    variant_value: string;
    selling_price: number;
  };
  buyer?: {
    buyer_id: string;
    full_name: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  initiated: {
    label: 'Initiated',
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: Clock
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-blue-800',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: CheckCircle2
  },
  packed: {
    label: 'Packed',
    color: 'text-indigo-800',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: Package
  },
  shipped: {
    label: 'Shipped',
    color: 'text-teal-800',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    icon: Truck
  },
  delivered: {
    label: 'Delivered',
    color: 'text-emerald-800',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: CheckCircle2
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-rose-800',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    icon: XCircle
  }
};

const STATUS_OPTIONS = [
  { value: 'initiated', label: 'Initiated' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

export function OrdersPage() {
  const { sellerProfile } = useSellerAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  async function fetchOrders() {
    if (!sellerProfile?.seller_id) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          order_id,
          order_number,
          seller_id,
          buyer_id,
          product_id,
          variant_id,
          item_price,
          product_images,
          status,
          clicked_at,
          created_at,
          product:products(product_id, name, base_price),
          variant:product_variants(variant_id, variant_type, variant_value, selling_price),
          buyer:buyers(buyer_id, full_name)
        `)
        .eq('seller_id', sellerProfile.seller_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching seller orders:', error);
      } else {
        const rows: OrderItem[] = (data as any) ?? [];
        setOrders(rows);
      }
    } catch (err) {
      console.error('Unexpected error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [sellerProfile?.seller_id]);

  // Handle status update
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const previousOrders = [...orders];

    // Optimistic update
    setOrders(prev =>
      prev.map(o => (o.order_id === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('order_id', orderId);

      if (error) {
        throw error;
      }

      showToast(`Status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    } catch (err: any) {
      console.error('Failed to update status:', err);
      alert(`Failed to update status: ${err.message || 'Unknown error'}`);
      setOrders(previousOrders); // Rollback
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper for deterministic order ID display
  const getDisplayOrderId = (order: OrderItem) => {
    if (order.order_number) return order.order_number;
    if (order.order_id) {
      const num = (Math.abs(order.order_id.split('-').reduce((acc, p) => acc + (parseInt(p, 16) || 0), 0)) % 900000) + 100000;
      return `ORD${num}`;
    }
    return 'ORD100001';
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const displayId = getDisplayOrderId(order).toLowerCase();
    const prodName = order.product?.name?.toLowerCase() || '';
    const buyerName = order.buyer?.full_name?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();

    const matchesSearch = displayId.includes(q) || prodName.includes(q) || buyerName.includes(q);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalCount = orders.length;
  const initiatedCount = orders.filter(o => o.status === 'initiated').length;
  const inProgressCount = orders.filter(o => ['confirmed', 'packed', 'shipped'].includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((acc, o) => acc + (Number(o.item_price) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-neutral-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Orders</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage incoming orders and update delivery fulfillment status
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-50 transition-colors shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white border border-neutral-200 rounded-xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Total Orders</span>
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-neutral-900">{totalCount}</p>
          <p className="text-[10.5px] sm:text-[11px] text-neutral-400 mt-0.5">{formatINR(totalRevenue)} volume</p>
        </div>

        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Initiated</span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-900">{initiatedCount}</p>
          <p className="text-[10.5px] sm:text-[11px] text-amber-700/80 mt-0.5">New buyer requests</p>
        </div>

        <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">In Progress</span>
            <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-blue-900">{inProgressCount}</p>
          <p className="text-[10.5px] sm:text-[11px] text-blue-700/80 mt-0.5">Confirmed / packed</p>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Delivered</span>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-900">{deliveredCount}</p>
          <p className="text-[10.5px] sm:text-[11px] text-emerald-700/80 mt-0.5">Fulfilled orders</p>
        </div>
      </div>

      {/* WhatsApp Order Disclaimer Notice */}
      <div className="bg-amber-50/75 border border-amber-200/80 rounded-xl p-3.5 sm:p-4 flex items-start gap-3 shadow-2xs">
        <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="text-xs text-amber-900 leading-relaxed space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-amber-950">Important Order Disclaimer</h4>
            <span className="text-[10px] font-bold bg-amber-200/70 text-amber-900 px-1.5 py-0.5 rounded-md">Notice</span>
          </div>
          <p className="text-amber-900/90 text-[11.5px] sm:text-xs">
            When a buyer clicks <strong>"Buy Now"</strong>, the order is registered as <strong>Initiated</strong>. Please note that clicking "Buy Now" does not mean you will automatically receive an order request message on WhatsApp (the buyer may not have sent the message or may have closed WhatsApp). Always confirm details with the buyer before dispatching.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none -mx-1 px-1">
            {[
              { id: 'all', label: 'All Orders', count: totalCount },
              { id: 'initiated', label: 'Initiated', count: initiatedCount },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'shipped', label: 'Shipped' },
              { id: 'delivered', label: 'Delivered', count: deliveredCount },
              { id: 'cancelled', label: 'Cancelled' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.id ? 'bg-emerald-800 text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID, product, buyer..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-neutral-400"
            />
          </div>
        </div>
      </div>

      {/* Orders Container */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
            <p className="text-xs text-neutral-500 font-medium">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-800">No Orders Found</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search query or status filter.'
                : 'Orders placed via WhatsApp or Buy Now by buyers will appear here in real time.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Order ID & Date</th>
                    <th className="py-3 px-4">Product Details</th>
                    <th className="py-3 px-4">Buyer</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {filteredOrders.map(order => {
                    const displayId = getDisplayOrderId(order);
                    const dateStr = (order.clicked_at || order.created_at)
                      ? new Date(order.clicked_at || order.created_at!).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'N/A';
                    
                    const img = order.product_images?.[0];
                    const currentStatus = (order.status || 'initiated').toLowerCase();
                    const statusConf = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.initiated;
                    const StatusIcon = statusConf.icon;

                    return (
                      <tr key={order.order_id} className="hover:bg-neutral-50/60 transition-colors">
                        {/* 1. Order ID & Date */}
                        <td className="py-3.5 px-4 align-top">
                          <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded text-[11px] border border-neutral-200 inline-block">
                            {displayId}
                          </span>
                          <p className="text-[11px] text-neutral-400 mt-1.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-neutral-400" />
                            {dateStr}
                          </p>
                        </td>

                        {/* 2. Product Details */}
                        <td className="py-3.5 px-4 align-top max-w-[280px]">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {img ? (
                                <img src={img} alt={order.product?.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xl">📦</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-neutral-900 truncate">
                                {order.product?.name || 'Custom Product'}
                              </h4>
                              {order.variant && (
                                <span className="inline-block mt-0.5 text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded font-medium">
                                  {order.variant.variant_type}: {order.variant.variant_value}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 3. Buyer */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                              {(order.buyer?.full_name || 'B').charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-neutral-800">
                              {order.buyer?.full_name || 'Verified Buyer'}
                            </span>
                          </div>
                        </td>

                        {/* 4. Total Amount */}
                        <td className="py-3.5 px-4 align-top">
                          <span className="font-bold text-neutral-900 text-sm">
                            {formatINR(order.item_price || 0)}
                          </span>
                        </td>

                        {/* 5. Status Badge */}
                        <td className="py-3.5 px-4 align-top">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${statusConf.bg} ${statusConf.color} ${statusConf.border}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConf.label}
                          </span>
                        </td>

                        {/* 6. Action: Update Status Dropdown */}
                        <td className="py-3.5 px-4 align-top text-right">
                          <div className="inline-block">
                            <select
                              value={currentStatus}
                              disabled={updatingId === order.order_id}
                              onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white text-neutral-800 shadow-2xs hover:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-neutral-100">
              {filteredOrders.map(order => {
                const displayId = getDisplayOrderId(order);
                const dateStr = (order.clicked_at || order.created_at)
                  ? new Date(order.clicked_at || order.created_at!).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'N/A';

                const img = order.product_images?.[0];
                const currentStatus = (order.status || 'initiated').toLowerCase();
                const statusConf = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.initiated;
                const StatusIcon = statusConf.icon;

                return (
                  <div key={order.order_id} className="p-3.5 sm:p-4 space-y-3 hover:bg-neutral-50/50 transition-colors">
                    {/* Top Row: Order ID & Date + Status */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded text-[11px] border border-neutral-200">
                          {displayId}
                        </span>
                        <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-neutral-400" />
                          {dateStr}
                        </span>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${statusConf.bg} ${statusConf.color} ${statusConf.border}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConf.label}
                      </span>
                    </div>

                    {/* Middle: Product & Buyer Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {img ? (
                          <img src={img} alt={order.product?.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">📦</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-neutral-900 text-xs line-clamp-2 leading-snug">
                            {order.product?.name || 'Custom Product'}
                          </h4>
                          <span className="font-black text-neutral-900 text-sm shrink-0">
                            {formatINR(order.item_price || 0)}
                          </span>
                        </div>
                        {order.variant && (
                          <span className="inline-block mt-1 text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded font-medium">
                            {order.variant.variant_type}: {order.variant.variant_value}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[9px] font-bold">
                            {(order.buyer?.full_name || 'B').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[11px] text-neutral-600 font-medium truncate">
                            {order.buyer?.full_name || 'Verified Buyer'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Update Status */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                      <span className="text-[11px] font-medium text-neutral-500">Update Status:</span>
                      <select
                        value={currentStatus}
                        disabled={updatingId === order.order_id}
                        onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white text-neutral-800 shadow-2xs hover:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
