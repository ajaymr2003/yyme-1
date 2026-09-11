import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, Navigate, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
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
import { OrdersPage } from './pages/orders/OrdersPage';

export function AppRoutes() {
  const { session, sellerProfile, loading, checkAndHandleBuyerTransition } = useSellerAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionAttemptedRef = useRef(false);

  const buyerId = searchParams.get('buyer_id');
  const userId = searchParams.get('user_id');

  useEffect(() => {
    // If the user is already on the signup route, do not re-run the transition check
    if (location.pathname === '/signup') {
      return;
    }

    if (!loading && (buyerId || userId) && !transitionAttemptedRef.current) {
      transitionAttemptedRef.current = true;
      console.log('[Seller AppRoutes] 🚀 Detected buyer transition parameters in URL:', {
        buyerId,
        userId,
        currentPath: location.pathname,
        fullSearch: location.search,
      });
      setIsTransitioning(true);
      checkAndHandleBuyerTransition(buyerId || '', userId || '')
        .then((result) => {
          console.log('[Seller AppRoutes] Transition evaluation result:', result);
          if (result.action === 'dashboard') {
            console.log('[Seller AppRoutes] ✅ Landing directly to seller dashboard (live session or is_both=true)');
            navigate('/', { replace: true });
          } else if (result.action === 'signup') {
            console.log('[Seller AppRoutes] 📝 Forwarding to signup registration (is_both=false):', result.params);
            const sp = new URLSearchParams();
            if (result.params?.phone) sp.set('phone', result.params.phone);
            if (result.params?.name) sp.set('name', result.params.name);
            if (result.params?.userId) sp.set('user_id', result.params.userId);
            if (result.params?.buyerId) sp.set('buyer_id', result.params.buyerId);
            navigate(`/signup?${sp.toString()}`, { replace: true });
          }
        })
        .catch((err) => {
          console.error('[Seller AppRoutes] ❌ Buyer transition failed:', err);
          navigate('/signup', { replace: true });
        })
        .finally(() => {
          setIsTransitioning(false);
        });
    }
  }, [loading, buyerId, userId, location.pathname]);

  if (loading || isTransitioning) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-neutral-100 max-w-sm mx-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-base text-neutral-800 font-bold">
          {isTransitioning ? 'Connecting your YYME Account...' : 'Loading YYME Seller...'}
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          {isTransitioning ? 'Verifying seller credentials and session status' : 'Please wait a moment'}
        </p>
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
        <Route path="/orders" element={<OrdersPage />} />
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
