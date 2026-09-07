import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../core/contexts/AdminAuthContext';
import {
  LayoutDashboard,
  Users,
  Store,
  ShieldCheck,
  CreditCard,
  Package,
  ClipboardCheck,
  FolderTree,
  AlertTriangle,
  Image,
  ScrollText,
  Settings,
  Sliders,
  LogOut,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'USERS',
    items: [
      { href: '/users', label: 'User Management', icon: Users },
      { href: '/sellers', label: 'Sellers', icon: Store },
      { href: '/seller-upgrades', label: 'Seller Upgrades', icon: CreditCard },
      { href: '/verifications', label: 'Verifications', icon: ShieldCheck },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { href: '/products', label: 'Products', icon: Package },
      { href: '/qc-pending', label: 'QC Pending', icon: ClipboardCheck, badge: 2 },
      { href: '/categories', label: 'Categories', icon: FolderTree },
      { href: '/disputes', label: 'Disputes', icon: AlertTriangle },
      { href: '/promotions', label: 'Promotions', icon: Image },
      { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/platform-config', label: 'Platform Config', icon: Sliders },
    ],
  },
];

export function AdminLayout() {
  const { signOut, user } = useAdminAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-white/10 text-white'
        : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
    }`;

  return (
    <div className="min-h-screen bg-stone-100 flex">
      <aside className="hidden md:flex w-64 bg-[#1a2332] flex-col fixed h-full z-30">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">Y</span>
            </div>
            <span className="text-lg font-bold text-white">YYME</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Admin Console</p>
        </div>

        <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
          {navSections.map(section => (
            <div key={section.title}>
              <p className="px-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <NavLink key={item.href} to={item.href} end={item.href === '/'}
                    className={linkClass}>
                    <item.icon className="w-4 h-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 bg-emerald-600/20 rounded-full flex items-center justify-center text-xs font-bold text-emerald-400">
              {user?.email?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-neutral-200 truncate">{user?.email ?? 'Admin'}</p>
              <p className="text-[10px] text-neutral-500">Platform Admin</p>
            </div>
          </div>
          <button onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#1a2332] border-b border-white/10 px-4 py-3 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">Y</span>
          </div>
          <span className="text-sm font-bold text-white">Admin</span>
        </div>
        <button onClick={signOut} className="p-1.5 text-neutral-400 hover:text-red-400">
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
