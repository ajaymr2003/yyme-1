import React from 'react';
import { Outlet } from 'react-router-dom';
import { ShoppingCart, Search, Store, User, LogOut } from 'lucide-react';
import { useAuth } from '../core/contexts/AuthContext';
import { useCart } from '../core/contexts/CartContext';

export function BuyerLayout() {
  const { buyerProfile, signOut } = useAuth();
  const { items } = useCart();

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">Y</span>
          </div>
          <span className="text-lg font-bold text-neutral-900 tracking-tight">YYME</span>
        </div>
        <div className="flex items-center gap-2">
          <a href="/search" className="p-2 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors">
            <Search className="w-5 h-5" />
          </a>
          <a href="/cart" className="relative p-2 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors">
            <ShoppingCart className="w-5 h-5" />
            {items.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {items.length}
              </span>
            )}
          </a>
          <button onClick={signOut} className="p-2 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex items-center justify-around px-4 py-2 z-30">
        <a href="/" className="flex flex-col items-center gap-0.5 px-4 py-1 text-emerald-600">
          <Store className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </a>
        <a href="/shop" className="flex flex-col items-center gap-0.5 px-4 py-1 text-neutral-400">
          <Store className="w-5 h-5" />
          <span className="text-[10px] font-medium">Shop</span>
        </a>
        <a href="/cart" className="relative flex flex-col items-center gap-0.5 px-4 py-1 text-neutral-400">
          <ShoppingCart className="w-5 h-5" />
          {items.length > 0 && (
            <span className="absolute top-0 right-3 bg-emerald-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {items.length}
            </span>
          )}
          <span className="text-[10px] font-medium">Cart</span>
        </a>
        <div className="flex flex-col items-center gap-0.5 px-4 py-1 text-neutral-400">
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">{buyerProfile?.full_name?.split(' ')[0] ?? 'Profile'}</span>
        </div>
      </nav>
    </div>
  );
}
