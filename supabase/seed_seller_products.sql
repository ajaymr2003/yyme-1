-- ============================================================================
-- YYME MARKETPLACE: SELLER PRODUCTS SEED SCRIPT
-- Seller: Linto' Achayans (ID: 635160dd-df75-4fac-b07a-c7f2b526e32b)
-- Products: 6 (3 Multi-Variant + 3 Single-Variant)
-- ============================================================================

DO $$
DECLARE
  v_seller_id uuid := '635160dd-df75-4fac-b07a-c7f2b526e32b';
  v_p1_id uuid := 'feee5425-cbf2-4cb2-a789-fd2a77944507';
  v_p2_id uuid := 'a2981395-f4e5-4bac-9a80-375772fdc5f1';
  v_p3_id uuid := '52357388-435a-4c7f-9fa7-3d192bc70745';
  v_p4_id uuid := 'fb817a8d-1959-4fd5-88f7-a97c36051f9d';
  v_p5_id uuid := '075e55fb-b6af-4f97-bed4-16da1bce8af9';
  v_p6_id uuid := 'de5cc919-4b9d-4d39-8134-a5c8014023c6';
BEGIN

  -- --------------------------------------------------------------------------
  -- 1. MULTI-VARIANT: Premium Wayanad Whole Black Pepper (Verified / Live)
  -- --------------------------------------------------------------------------
  INSERT INTO public.products (
    product_id, seller_id, category_id, name, description, material,
    weight_kg, moq, base_price, mrp, stock_quantity, have_variants,
    image_urls, is_active, qc_status, status
  ) VALUES (
    v_p1_id,
    v_seller_id,
    'l3-spices-wayanad-black-pepper',
    'Premium Wayanad Whole Black Pepper',
    'Hand-harvested single-origin Malabar black pepper from the high-altitude hills of Wayanad, Kerala. Rich in piperine and essential oils with bold aroma and pungent heat.',
    'Natural & Sun-Dried',
    0.25, 1, 140, 180, true, true,
    ARRAY['https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&q=80', 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800&q=80'],
    true, 'verified', 'active'
  )
  ON CONFLICT (product_id) DO UPDATE SET
    name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variants for Wayanad Black Pepper
  INSERT INTO public.product_variants (product_id, variant_type, variant_value, sku, selling_price, mrp, stock_quantity, image_urls)
  VALUES
    (v_p1_id, 'Weight', '100g', 'LA-WBP-100G', 140, 180, true, ARRAY['https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&q=80']),
    (v_p1_id, 'Weight', '250g', 'LA-WBP-250G', 320, 399, true, ARRAY['https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&q=80']),
    (v_p1_id, 'Weight', '500g', 'LA-WBP-500G', 590, 750, true, ARRAY['https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&q=80'])
  ON CONFLICT DO NOTHING;

  -- --------------------------------------------------------------------------
  -- 2. MULTI-VARIANT: Authentic Kerala Sharkara Varatti (Verified / Live)
  -- --------------------------------------------------------------------------
  INSERT INTO public.products (
    product_id, seller_id, category_id, name, description, material,
    weight_kg, moq, base_price, mrp, stock_quantity, have_variants,
    image_urls, is_active, qc_status, status
  ) VALUES (
    v_p2_id,
    v_seller_id,
    'l3-sweets-sharkara-varatti',
    'Authentic Kerala Sharkara Varatti (Jaggery Banana Chips)',
    'Crispy thick-cut Nendran banana chunks slow-fried in pure coconut oil and generously coated with organic spiced jaggery, dry ginger (chukku), and ground cardamom.',
    'Traditional Sweet Recipe',
    0.5, 1, 160, 220, true, true,
    ARRAY['https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&q=80', 'https://images.unsplash.com/photo-1628102491629-778571d893a3?w=800&q=80'],
    true, 'verified', 'active'
  )
  ON CONFLICT (product_id) DO UPDATE SET
    name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    stock_quantity = EXCLUDED.stock_quantity;

  -- Variants for Sharkara Varatti
  INSERT INTO public.product_variants (product_id, variant_type, variant_value, sku, selling_price, mrp, stock_quantity, image_urls)
  VALUES
    (v_p2_id, 'Weight', '250g', 'LA-SV-250G', 160, 220, true, ARRAY['https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&q=80']),
    (v_p2_id, 'Weight', '500g', 'LA-SV-500G', 299, 399, true, ARRAY['https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&q=80']),
    (v_p2_id, 'Weight', '1kg',  'LA-SV-1KG',  560, 720, true, ARRAY['https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&q=80'])
  ON CONFLICT DO NOTHING;

  -- --------------------------------------------------------------------------
  -- 3. MULTI-VARIANT: Cold-Pressed Virgin Coconut Oil (Submitted / QC Pending)
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
  -- 4. SINGLE-VARIANT: Traditional Kozhikode Black Halwa (Verified / Live)
  -- --------------------------------------------------------------------------
  INSERT INTO public.products (
    product_id, seller_id, category_id, name, description, material,
    weight_kg, moq, base_price, mrp, stock_quantity, have_variants,
    image_urls, is_active, qc_status, status
  ) VALUES (
    v_p4_id,
    v_seller_id,
    'l3-sweets-kozhikode-halwa',
    'Traditional Kozhikode Black Halwa (500g)',
    'Mouth-watering black halwa prepared in slow firewood stoves using pure coconut oil, roasted jaggery, cardamom powder, and cashew nuts.',
    'Authentic Calicut Recipe',
    0.5, 1, 340, 450, true, false,
    ARRAY['https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=800&q=80'],
    true, 'verified', 'active'
  )
  ON CONFLICT (product_id) DO UPDATE SET
    name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    stock_quantity = EXCLUDED.stock_quantity;

  -- --------------------------------------------------------------------------
  -- 5. SINGLE-VARIANT: Palakkadan Vadi Matta Red Rice (Verified / Live)
  -- --------------------------------------------------------------------------
  INSERT INTO public.products (
    product_id, seller_id, category_id, name, description, material,
    weight_kg, moq, base_price, mrp, stock_quantity, have_variants,
    image_urls, is_active, qc_status, status
  ) VALUES (
    v_p5_id,
    v_seller_id,
    'l3-rice-palakkadan-matta-rice',
    'Palakkadan Vadi Matta Red Rice (5kg)',
    'Farm-fresh indigenous red rice from the fertile paddy fields of Palakkad. Naturally unpolished, rich in fibre and minerals.',
    'Natural Red Rice',
    5.0, 1, 350, 420, true, false,
    ARRAY['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80'],
    true, 'verified', 'active'
  )
  ON CONFLICT (product_id) DO UPDATE SET
    name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    stock_quantity = EXCLUDED.stock_quantity;

  -- --------------------------------------------------------------------------
  -- 6. SINGLE-VARIANT: Malabar Spicy Prawns Pickle (Submitted / QC Pending)
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
