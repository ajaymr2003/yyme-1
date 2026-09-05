import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from './core/contexts/AdminAuthContext';
import { AdminLayout } from './layout/AdminLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { IdentityQueue } from './pages/verifications/IdentityQueue';
import { UpgradeRequestsQueue } from './pages/subscriptions/UpgradeRequestsQueue';
import { CategoryManager } from './pages/categories/CategoryManager';
import { BannerManager } from './pages/promotions/BannerManager';

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
        <Route path="/verifications" element={<IdentityQueue />} />
        <Route path="/subscriptions" element={<UpgradeRequestsQueue />} />
        <Route path="/categories" element={<CategoryManager />} />
        <Route path="/promotions" element={<BannerManager />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
