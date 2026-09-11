import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './core/contexts/AuthContext';
import { BuyerLayout } from './layouts/BuyerLayout';
import { HomePage } from './pages/home/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { ShopPage } from './pages/discovery/ShopPage';
import { CategoriesPage } from './pages/discovery/CategoriesPage';
import { SearchPage } from './pages/discovery/SearchPage';
import { ProductDetailPage } from './pages/discovery/ProductDetailPage';
import { CartPage } from './pages/cart/CartPage';
import { CheckoutPage } from './pages/checkout/CheckoutPage';
import { ProfilePage } from './pages/account/ProfilePage';
import { WishlistPage } from './pages/account/WishlistPage';
import { AboutPage } from './pages/about/AboutPage';
import { SellerStorefront } from './pages/discovery/SellerStorefront';

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
        <Route path="/shop" element={<CategoriesPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/shop/category/:categoryId" element={<ShopPage />} />
        <Route path="/shop/category/:categoryId/:subCategoryId" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/seller/:id" element={<SellerStorefront />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/cart" element={session ? <CartPage /> : <Navigate to="/login?redirect=/cart" />} />
        <Route path="/checkout" element={session ? <CheckoutPage /> : <Navigate to="/login?redirect=/checkout" />} />
        <Route path="/profile" element={session ? <ProfilePage defaultTab="profile" /> : <Navigate to="/login?redirect=/profile" />} />
        <Route path="/orders" element={session ? <ProfilePage defaultTab="orders" /> : <Navigate to="/login?redirect=/orders" />} />
        <Route path="/wishlist" element={session ? <ProfilePage defaultTab="wishlist" /> : <Navigate to="/login?redirect=/wishlist" />} />
        <Route path="/notifications" element={session ? <ProfilePage defaultTab="notifications" /> : <Navigate to="/login?redirect=/notifications" />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
