import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAdminAuth } from '../core/contexts/AdminAuthContext';
import { LayoutDashboard, ShieldCheck, CreditCard, FolderTree, Image, LogOut } from 'lucide-react';

export function AdminLayout() {
  const { signOut, user } = useAdminAuth();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/verifications', label: 'Identity Queue', icon: ShieldCheck },
    { href: '/subscriptions', label: 'Upgrade Requests', icon: CreditCard },
    { href: '/categories', label: 'Categories', icon: FolderTree },
    { href: '/promotions', label: 'Banners', icon: Image },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex">
      <aside className="hidden md:flex w-64 bg-white border-r border-neutral-200 flex-col fixed h-full z-30">
        <div className="p-5 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">Y</span>
            </div>
            <span className="text-lg font-bold text-neutral-900">YYME</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">Admin Console</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <a key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors">
              <item.icon className="w-4 h-4" /> {item.label}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-100">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-bold text-emerald-700">
              {user?.email?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-neutral-900 truncate">{user?.email ?? 'Admin'}</p>
              <p className="text-[10px] text-neutral-400">Platform Admin</p>
            </div>
          </div>
          <button onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">Y</span>
          </div>
          <span className="text-sm font-bold text-neutral-900">Admin</span>
        </div>
        <button onClick={signOut} className="p-1.5 text-neutral-400 hover:text-red-600">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <main className="flex-1 md:ml-64 pt-14 md:pt-0 min-h-screen">
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
