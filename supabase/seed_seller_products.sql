-- ============================================================================
-- YYME MARKETPLACE: SELLER PRODUCTS SEED SCRIPT
-- Seller: Linto' Achayans (ID: 635160dd-df75-4fac-b07a-c7f2b526e32b)
-- Products: 2 (1 Multi-Variant + 1 Single-Variant)
-- ============================================================================

DO $$
DECLARE
  v_seller_id uuid := '635160dd-df75-4fac-b07a-c7f2b526e32b';
  v_p3_id uuid := '52357388-435a-4c7f-9fa7-3d192bc70745';
  v_p6_id uuid := 'de5cc919-4b9d-4d39-8134-a5c8014023c6';
BEGIN

  -- --------------------------------------------------------------------------
  -- 1. MULTI-VARIANT: Cold-Pressed Virgin Coconut Oil (Submitted / QC Pending)
  -- --------------------------------------------------------------------------
  INSERT INTO public.products (
    product_id, seller_id, category_id, name, description, material,
    weight_kg, moq, base_price, mrp, stock_quantity, have_variants,
    image_urls, is_active, qc_status, status
  ) VALUES (
    v_p3_id,
    v_seller_id,
    'l3-oils-pure-coconut-oil',
    'Cold-Pressed Virgin Coconut Oil (Vellichenna)',
    '100% pure raw virgin coconut oil cold-pressed from fresh Kerala coconut milk. Unrefined, unbleached, with natural coconut aroma.',
    'Cold-Pressed & Wood-Churned',
    1.0, 1, 240, 299, true, true,
    ARRAY['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80'],
    true, 'submitted', 'active'
  )
  ON CONFLICT (product_id) DO UPDATE SET
    name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variants for Virgin Coconut Oil
  INSERT INTO public.product_variants (product_id, variant_type, variant_value, sku, selling_price, mrp, stock_quantity, image_urls)
  VALUES
    (v_p3_id, 'Pack Size', '500ml',    'LA-VCO-500ML', 240,  299,  true, ARRAY['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80']),
    (v_p3_id, 'Pack Size', '1 Litre',  'LA-VCO-1L',    450,  550,  true, ARRAY['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80']),
    (v_p3_id, 'Pack Size', '5 Litres', 'LA-VCO-5L',    2100, 2500, true, ARRAY['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80'])
  ON CONFLICT DO NOTHING;

  -- --------------------------------------------------------------------------
  -- 2. SINGLE-VARIANT: Malabar Spicy Prawns Pickle (Submitted / QC Pending)
  -- --------------------------------------------------------------------------
  INSERT INTO public.products (
    product_id, seller_id, category_id, name, description, material,
    weight_kg, moq, base_price, mrp, stock_quantity, have_variants,
    image_urls, is_active, qc_status, status
  ) VALUES (
    v_p6_id,
    v_seller_id,
    'l3-pickles-prawns-pickle',
    'Malabar Spicy Prawns Pickle (Chemmeen Achar 350g)',
    'Authentic Kerala coast prawns pickle made with tender sun-dried ocean prawns, gingelly oil, mustard, green chilies, garlic, and home-ground masala blend.',
    'Seafood Pickle',
    0.35, 1, 390, 499, true, false,
    ARRAY['https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80'],
    true, 'submitted', 'active'
  )
  ON CONFLICT (product_id) DO UPDATE SET
    name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    stock_quantity = EXCLUDED.stock_quantity;

  -- --------------------------------------------------------------------------
  -- 7. UPDATE SELLER LISTING USAGE
  -- --------------------------------------------------------------------------
  UPDATE public.sellers
  SET used_listing_count = 11,
      updated_at = CURRENT_TIMESTAMP
  WHERE seller_id = v_seller_id;

END $$;
