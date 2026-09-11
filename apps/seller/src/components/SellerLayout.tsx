import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useSellerAuth } from '../core/contexts/SellerAuthContext';
import { useQuota } from '../core/contexts/QuotaContext';
import { LayoutDashboard, Package, LogOut, Zap, BarChart3, User, ShoppingBag } from 'lucide-react';

export function SellerLayout() {
  const { sellerProfile, signOut } = useSellerAuth();
  const { clicksRemaining, tier } = useQuota();

  return (
    <div className="min-h-screen bg-stone-100 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-neutral-200 flex-col fixed h-full z-30">
        <div className="p-5 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">Y</span>
            </div>
            <span className="text-lg font-bold text-neutral-900">YYME</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">Seller Portal</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 font-medium'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </NavLink>
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 font-medium'
              }`
            }
          >
            <ShoppingBag className="w-4 h-4" /> Orders
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 font-medium'
              }`
            }
          >
            <Package className="w-4 h-4" /> Products
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 font-medium'
              }`
            }
          >
            <User className="w-4 h-4" /> Profile
          </NavLink>
        </nav>

        <div className="p-4 border-t border-neutral-100">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-800 uppercase">{tier} Tier</span>
            </div>
            <p className="text-[11px] text-emerald-700">{clicksRemaining} clicks remaining</p>
          </div>
          <div className="flex items-center gap-3 px-2 mb-2">
            <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center text-xs font-bold text-neutral-600">
              {sellerProfile?.business_name?.charAt(0) ?? 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-neutral-900 truncate">{sellerProfile?.business_name}</p>
              <p className="text-[10px] text-neutral-400 truncate">{sellerProfile?.whatsapp_number}</p>
            </div>
          </div>
          <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">Y</span>
          </div>
          <span className="text-sm font-bold text-neutral-900">YYME</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">{clicksRemaining} clicks</span>
          <button onClick={signOut} className="p-1.5 text-neutral-400 hover:text-red-600">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen">
        <div className="p-3.5 sm:p-4 md:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-neutral-200 flex items-center justify-around py-1.5 px-2 z-30 shadow-lg">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
              isActive ? 'text-emerald-700' : 'text-neutral-500 hover:text-neutral-800'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
              isActive ? 'text-emerald-700' : 'text-neutral-500 hover:text-neutral-800'
            }`
          }
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Orders</span>
        </NavLink>
        <NavLink
          to="/products"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
              isActive ? 'text-emerald-700' : 'text-neutral-500 hover:text-neutral-800'
            }`
          }
        >
          <Package className="w-5 h-5" />
          <span>Products</span>
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
              isActive ? 'text-emerald-700' : 'text-neutral-500 hover:text-neutral-800'
            }`
          }
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}
