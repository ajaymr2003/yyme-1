import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from './core/contexts/AdminAuthContext';
import { AdminLayout } from './layout/AdminLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { UserManagement } from './pages/users/UserManagement';
import { Sellers } from './pages/sellers/Sellers';
import { SellerDetail } from './pages/sellers/SellerDetail';
import { IdentityQueue } from './pages/verifications/IdentityQueue';
import { VerificationDetailPage } from './pages/verifications/VerificationDetailPage';
import { Products } from './pages/products/Products';
import { QcPending } from './pages/qc/QcPending';
import { CategoryManager } from './pages/categories/CategoryManager';
import { Disputes } from './pages/disputes/Disputes';
import { BannerManager } from './pages/promotions/BannerManager';
import { AuditLogs } from './pages/audit/AuditLogs';
import { Settings } from './pages/settings/Settings';
import { PlatformConfig } from './pages/config/PlatformConfig';
import { UpgradeRequestsQueue } from './pages/subscriptions/UpgradeRequestsQueue';
import { UpgradeRequestDetail } from './pages/subscriptions/UpgradeRequestDetail';

export function AppRoutes() {
  const { session, loading } = useAdminAuth();

  if (loading) return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  );

  if (!session) return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" />} />
      <Route element={<AdminLayout />}>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/sellers" element={<Sellers />} />
        <Route path="/sellers/:id" element={<SellerDetail />} />
        <Route path="/seller-upgrades" element={<UpgradeRequestsQueue />} />
        <Route path="/seller-upgrades/:id" element={<UpgradeRequestDetail />} />
        <Route path="/verifications" element={<IdentityQueue />} />
        <Route path="/verifications/:id" element={<VerificationDetailPage />} />
        <Route path="/products" element={<Products />} />
        <Route path="/qc-pending" element={<QcPending />} />
        <Route path="/categories" element={<CategoryManager />} />
        <Route path="/disputes" element={<Disputes />} />
        <Route path="/promotions" element={<BannerManager />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/platform-config" element={<PlatformConfig />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
