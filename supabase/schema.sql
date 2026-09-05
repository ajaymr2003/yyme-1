-- ============================================================================
-- YYME-1 PHASE 1 — CLEAN DATABASE SCHEMA
-- ============================================================================

-- 1. USERS & AUTH IDENTITY
CREATE TABLE public.users (
  user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number varchar UNIQUE,
  email varchar,
  user_type varchar NOT NULL CHECK (user_type IN ('admin', 'buyer', 'seller')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at timestamptz
);

-- 1B. ADMINS PROFILE
CREATE TABLE IF NOT EXISTS public.admins (
  admin_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(user_id) ON DELETE CASCADE,
  role varchar NOT NULL CHECK (role IN ('super_admin', 'compliance_officer', 'dispute_arbitrator', 'finance_manager')) DEFAULT 'super_admin',
  permissions jsonb NOT NULL DEFAULT '{"all": true}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. BUYERS PROFILE
CREATE TABLE public.buyers (
  buyer_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(user_id) ON DELETE CASCADE,
  full_name varchar NOT NULL,
  default_address_id uuid,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. SELLERS PROFILE + SUBSCRIPTION QUOTAS
CREATE TABLE public.sellers (
  seller_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(user_id) ON DELETE CASCADE,
  business_name varchar NOT NULL,
  owner_name varchar NOT NULL,
  whatsapp_number varchar NOT NULL,
  seller_type varchar NOT NULL DEFAULT 'standard',
  account_status varchar NOT NULL DEFAULT 'pending_verification'
    CHECK (account_status IN ('pending_verification', 'active', 'rejected', 'frozen', 'suspended')),
  is_gst_registered boolean NOT NULL DEFAULT false,
  shipping_state varchar NOT NULL,
  subscription_tier varchar NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'standard', 'premium', 'extra_premium')),
  is_disability_exempt boolean NOT NULL DEFAULT false,
  click_quota integer NOT NULL DEFAULT 20,
  remaining_click_quota integer NOT NULL DEFAULT 20,
  max_listing_quota integer NOT NULL DEFAULT 3,
  used_listing_count integer NOT NULL DEFAULT 0,
  tier_expires_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. SELLER VERIFICATIONS (KYC & IDENTITY)
CREATE TABLE public.seller_verifications (
  record_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(seller_id) ON DELETE CASCADE,
  verification_type varchar NOT NULL CHECK (verification_type IN ('GST', 'ENROLLMENT_ID', 'DISABILITY_PROOF')),
  reference_number varchar NOT NULL,
  document_url text,
  status varchar NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_on timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. SUBSCRIPTION PLANS (Master Reference)
CREATE TABLE public.subscription_plans (
  plan_id varchar PRIMARY KEY,
  name varchar NOT NULL,
  monthly_price numeric NOT NULL DEFAULT 0.00,
  click_quota integer NOT NULL,
  listing_quota integer NOT NULL,
  description text
);

INSERT INTO public.subscription_plans (plan_id, name, monthly_price, click_quota, listing_quota, description) VALUES
('free', 'Free Tier', 0.00, 20, 3, 'Kickstarter tier granted on KYC approval'),
('standard', 'Standard Tier', 499.00, 100, 10, 'For growing home-based merchants'),
('premium', 'Premium Tier', 1499.00, 500, 50, 'For high-volume artisans and stores'),
('extra_premium', 'Extra Premium Tier', 2999.00, 2000, 200, 'Unlimited growth for large enterprises');

-- 6. SUBSCRIPTION UPGRADE REQUESTS
CREATE TABLE public.subscription_upgrade_requests (
  request_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(seller_id) ON DELETE CASCADE,
  target_plan_id varchar NOT NULL REFERENCES public.subscription_plans(plan_id),
  amount_paid numeric NOT NULL,
  payment_method varchar NOT NULL DEFAULT 'UPI',
  utr_reference_number varchar NOT NULL,
  payment_receipt_url text,
  status varchar NOT NULL DEFAULT 'pending_approval'
    CHECK (status IN ('pending_approval', 'approved', 'rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. CATEGORIES (3-Level Hierarchy)
CREATE TABLE public.categories (
  category_id varchar PRIMARY KEY,
  parent_category_id varchar REFERENCES public.categories(category_id) ON DELETE CASCADE,
  level integer NOT NULL CHECK (level IN (1, 2, 3)),
  name varchar NOT NULL,
  icon_url text,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. ADDRESSES (Polymorphic: Buyer & Seller)
CREATE TABLE public.addresses (
  address_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type varchar NOT NULL CHECK (owner_type IN ('buyer', 'seller')),
  owner_id uuid NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city varchar NOT NULL,
  district varchar,
  state varchar NOT NULL,
  pincode varchar NOT NULL,
  lat numeric,
  long numeric,
  is_default boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. PRODUCTS
CREATE TABLE public.products (
  product_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(seller_id) ON DELETE CASCADE,
  category_id varchar NOT NULL REFERENCES public.categories(category_id),
  name varchar NOT NULL,
  description text,
  material varchar,
  weight_kg numeric DEFAULT 0.5,
  moq integer NOT NULL DEFAULT 1 CHECK (moq >= 1),
  base_price numeric NOT NULL CHECK (base_price >= 0.00),
  mrp numeric NOT NULL DEFAULT 0.00 CHECK (mrp >= 0.00),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  have_variants boolean NOT NULL DEFAULT false,
  image_urls text[] DEFAULT '{}'::text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. PRODUCT VARIANTS (SKU Matrix)
CREATE TABLE public.product_variants (
  variant_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
  variant_type varchar NOT NULL,
  variant_value varchar NOT NULL,
  sku varchar,
  selling_price numeric NOT NULL CHECK (selling_price >= 0.00),
  mrp numeric DEFAULT 0.00,
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  weight_override numeric,
  image_urls text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. SHOPPING CART (Single-Seller Enforced)
CREATE TABLE public.cart (
  cart_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL UNIQUE REFERENCES public.buyers(buyer_id) ON DELETE CASCADE,
  seller_id uuid REFERENCES public.sellers(seller_id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.cart_items (
  cart_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.cart(cart_id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(variant_id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. WHATSAPP CLICK LOGS (Lead Analytics & Monetization)
CREATE TABLE public.whatsapp_click_logs (
  log_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(seller_id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(variant_id) ON DELETE SET NULL,
  buyer_id uuid REFERENCES public.buyers(buyer_id) ON DELETE SET NULL,
  buyer_phone varchar,
  buyer_pincode varchar,
  item_price numeric NOT NULL,
  clicked_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. PROMOTIONAL BANNERS
CREATE TABLE public.banners (
  banner_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar NOT NULL,
  image_url text NOT NULL,
  link_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 14. ADMIN AUDIT TRAIL
CREATE TABLE public.audit_logs (
  log_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action varchar NOT NULL,
  target_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  performed_on timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX idx_products_seller ON public.products(seller_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_variants_product ON public.product_variants(product_id);
CREATE INDEX idx_click_logs_seller ON public.whatsapp_click_logs(seller_id, clicked_at);
CREATE INDEX idx_click_logs_pincode ON public.whatsapp_click_logs(buyer_pincode);
CREATE INDEX idx_sellers_status ON public.sellers(account_status);
CREATE INDEX idx_cart_buyer ON public.cart(buyer_id);
CREATE INDEX idx_cart_items_cart ON public.cart_items(cart_id);
CREATE INDEX idx_addresses_owner ON public.addresses(owner_type, owner_id);
CREATE INDEX idx_categories_parent ON public.categories(parent_category_id);
CREATE INDEX idx_upgrade_requests_seller ON public.subscription_upgrade_requests(seller_id);

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION decrement_click_quota(sid uuid)
RETURNS void AS $$
  UPDATE public.sellers SET remaining_click_quota = GREATEST(remaining_click_quota - 1, 0) WHERE seller_id = sid;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION increment_listing_count(sid uuid)
RETURNS void AS $$
  UPDATE public.sellers SET used_listing_count = used_listing_count + 1 WHERE seller_id = sid;
$$ LANGUAGE sql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_click_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Public read policies for catalog data
CREATE POLICY "public_read_categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "public_read_products" ON public.products FOR SELECT USING (true);
CREATE POLICY "public_read_product_variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "public_read_banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "public_read_subscription_plans" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "public_read_sellers" ON public.sellers FOR SELECT USING (true);

-- Authenticated full access
CREATE POLICY "auth_all_admins" ON public.admins FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_read_admins" ON public.admins FOR SELECT TO public USING (true);
CREATE POLICY "auth_all_users" ON public.users FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_all_buyers" ON public.buyers FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_all_sellers" ON public.sellers FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_all_addresses" ON public.addresses FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_all_cart" ON public.cart FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_all_cart_items" ON public.cart_items FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_all_whatsapp_logs" ON public.whatsapp_click_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_all_audit_logs" ON public.audit_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_all_seller_verifications" ON public.seller_verifications FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_all_upgrade_requests" ON public.subscription_upgrade_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_all_products" ON public.products FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_all_product_variants" ON public.product_variants FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_all_banners" ON public.banners FOR ALL TO authenticated USING (true);

-- ============================================================================
-- REALTIME PUBLICATIONS
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_variants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.banners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_click_logs;


