import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './core/contexts/AuthContext';
import { BuyerLayout } from './layouts/BuyerLayout';
import { HomePage } from './pages/home/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { ShopPage } from './pages/discovery/ShopPage';
import { SearchPage } from './pages/discovery/SearchPage';
import { ProductDetailPage } from './pages/discovery/ProductDetailPage';
import { CartPage } from './pages/cart/CartPage';
import { CheckoutPage } from './pages/checkout/CheckoutPage';
import { ProfilePage } from './pages/account/ProfilePage';
import { WishlistPage } from './pages/account/WishlistPage';
import { AboutPage } from './pages/about/AboutPage';

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
      <Route element={<BuyerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/category/:categoryId" element={<ShopPage />} />
        <Route path="/shop/category/:categoryId/:subCategoryId" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={session ? <CheckoutPage /> : <Navigate to="/login" />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
