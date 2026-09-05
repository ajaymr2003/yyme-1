import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './core/contexts/AuthContext';
import { BuyerLayout } from './layouts/BuyerLayout';
import { HomePage } from './pages/home/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ShopPage } from './pages/discovery/ShopPage';
import { SearchPage } from './pages/discovery/SearchPage';
import { CartPage } from './pages/cart/CartPage';
import { CheckoutPage } from './pages/checkout/CheckoutPage';

export function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
        <p className="text-sm text-neutral-500 font-medium">Loading YYME...</p>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/signup" element={session ? <Navigate to="/" /> : <SignupPage />} />
      <Route element={session ? <BuyerLayout /> : <Navigate to="/login" />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/category/:categoryId" element={<ShopPage />} />
        <Route path="/shop/category/:categoryId/:subCategoryId" element={<ShopPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
