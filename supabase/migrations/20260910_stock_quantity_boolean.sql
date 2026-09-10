-- ============================================================================
-- Migration: Convert stock_quantity to boolean
-- Target: public.products & public.product_variants
-- Default: true
-- All existing values converted to: true
-- ============================================================================

-- 1. Drop integer check constraints if they exist
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_stock_quantity_check;
ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS product_variants_stock_quantity_check;

-- 2. Alter products.stock_quantity to boolean, default true, existing rows to true
ALTER TABLE public.products 
  ALTER COLUMN stock_quantity DROP DEFAULT,
  ALTER COLUMN stock_quantity TYPE boolean USING true,
  ALTER COLUMN stock_quantity SET DEFAULT true;

-- 3. Alter product_variants.stock_quantity to boolean, default true, existing rows to true
ALTER TABLE public.product_variants 
  ALTER COLUMN stock_quantity DROP DEFAULT,
  ALTER COLUMN stock_quantity TYPE boolean USING true,
  ALTER COLUMN stock_quantity SET DEFAULT true;
