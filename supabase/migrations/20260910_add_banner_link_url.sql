-- Add link_url column to public.banners if link functionality is desired in the future
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS link_url text;
