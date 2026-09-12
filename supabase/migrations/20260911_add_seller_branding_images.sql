-- Add logo_url and banner_url to public.sellers
ALTER TABLE public.sellers 
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS banner_url text;

-- Ensure RLS policies and grants allow anon/authenticated read and write
GRANT ALL ON TABLE public.sellers TO anon, authenticated, service_role;
