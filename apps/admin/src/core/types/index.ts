export interface Seller {
  seller_id: string;
  user_id: string;
  business_name: string;
  owner_name: string;
  whatsapp_number: string;
  phone_number?: string | null;
  account_status: string;
  is_gst_registered: boolean;
  shipping_state?: string | null;
  subscription_tier: string;
  remaining_click_quota: number;
  click_quota: number;
  max_listing_quota: number;
  used_listing_count: number;
  rejection_reason: string | null;
  tier_expires_at: string | null;
  is_disability_exempt?: boolean;
  created_at: string;
}

export interface SellerVerification {
  record_id: string;
  seller_id: string;
  verification_type: string;
  reference_number: string;
  document_url: string | null;
  status: string;
  verified_on: string | null;
  rejection_reason: string | null;
  created_at: string;
  seller?: Seller;
}

export interface UpgradeRequest {
  request_id: string;
  seller_id: string;
  target_plan_id: string;
  amount_paid: number;
  payment_method: string;
  utr_reference_number: string;
  payment_receipt_url: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  seller?: Seller;
  plan?: { name: string; monthly_price: number; click_quota: number; listing_quota: number; description: string };
}

export interface ClickLog {
  log_id: string;
  seller_id: string;
  product_id: string;
  variant_id: string | null;
  buyer_id: string | null;
  buyer_phone: string | null;
  buyer_pincode: string | null;
  item_price: number;
  clicked_at: string;
  seller?: { business_name: string };
  product?: { name: string };
}

export interface Category {
  category_id: string;
  parent_category_id: string | null;
  level: number;
  name: string;
  icon_url: string | null;
  display_order: number;
}

export interface Banner {
  banner_id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface QCProduct {
  product_id: string;
  seller_id: string;
  category_id: string;
  name: string;
  description: string;
  base_price: number;
  mrp?: number;
  weight_kg?: number;
  stock_quantity: boolean;
  moq: number;
  qc_status: string;
  have_variants?: boolean;
  image_urls?: string[];
  material?: string | null;
  created_at: string;
  categories?: { name: string };
  sellers?: { business_name: string; owner_name: string };
  cover_image?: string | null;
  variants: QCVariant[];
  minPrice: number;
  maxPrice: number;
  minMrp: number;
  maxMrp: number;
  totalStock?: number;
  isInStock: boolean;
}

export interface QCVariant {
  variant_id: string;
  product_id: string;
  variant_type: string;
  variant_value: string;
  sku: string;
  selling_price: number;
  mrp: number;
  stock_quantity: boolean;
  weight_override: number | null;
  image_urls: string[];
}
