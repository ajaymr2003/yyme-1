-- Add is_both column to public.users to flag accounts holding both Buyer and Seller profiles
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_both boolean NOT NULL DEFAULT false;

-- Backfill is_both = true for any users currently holding both buyer and seller records
UPDATE public.users 
SET is_both = true 
WHERE user_id IN (
  SELECT b.user_id 
  FROM public.buyers b
  INNER JOIN public.sellers s ON b.user_id = s.user_id
);

-- Grant all permissions on users table
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
