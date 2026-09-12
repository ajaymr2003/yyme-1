-- Migration: Add logo_url and banner_url to public.sellers
-- Run this script in your Supabase SQL Editor

ALTER TABLE public.sellers 
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS banner_url text;

-- Optional: If you want to create a dedicated public bucket for seller assets
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('seller-assets', 'seller-assets', true)
-- ON CONFLICT (id) DO NOTHING;
