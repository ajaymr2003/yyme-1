import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSellerAuth } from './core/contexts/SellerAuthContext';
import { SellerLayout } from './components/SellerLayout';
import { LandingPage } from './pages/landing/LandingPage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { LoginPage } from './pages/login/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProductsPage } from './pages/dashboard/ProductsPage';
import { AddProductPage } from './pages/product/AddProductPage';
import { EditProductPage } from './pages/product/EditProductPage';
import { SubscriptionPage } from './pages/subscription/SubscriptionPage';

export function AppRoutes() {
  const { session, sellerProfile, loading } = useSellerAuth();

  if (loading) return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
        <p className="text-sm text-neutral-500 font-medium">Loading YYME Seller...</p>
      </div>
    </div>
  );

  if (!session) return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );

  if (sellerProfile && sellerProfile.account_status === 'pending_verification') {
    return (
      <Routes>
        <Route path="*" element={<OnboardingPage />} />
      </Routes>
    );
  }

  if (sellerProfile && sellerProfile.account_status === 'rejected') {
    return (
      <Routes>
        <Route path="*" element={<OnboardingPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<SellerLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/add" element={<AddProductPage />} />
        <Route path="/products/edit/:productId" element={<EditProductPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
