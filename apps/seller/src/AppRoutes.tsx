import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSellerAuth } from './core/contexts/SellerAuthContext';
import { SellerLayout } from './components/SellerLayout';
import { LandingLayout } from './pages/landing/LandingLayout';
import { Landing } from './pages/landing/Landing';
import { HowItWorks } from './pages/landing/HowItWorks';
import { Pricing } from './pages/landing/Pricing';
import { Shipping } from './pages/landing/Shipping';
import { NoGst } from './pages/landing/NoGst';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { LoginPage } from './pages/login/LoginPage';
import { SignupPage } from './pages/login/SignupPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProductsPage } from './pages/dashboard/ProductsPage';
import { AddProductPage } from './pages/product/AddProductPage';
import { EditProductPage } from './pages/product/EditProductPage';
import { SubscriptionPage } from './pages/subscription/SubscriptionPage';
import { ProfilePage } from './pages/profile/ProfilePage';

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
      <Route element={<LandingLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/shipping" element={<Shipping />} />
        <Route path="/no-gst" element={<NoGst />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
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
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
