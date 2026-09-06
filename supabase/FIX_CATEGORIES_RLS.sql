-- Fix Row Level Security (RLS) 403 Forbidden for categories table
-- Run this in your Supabase Dashboard -> SQL Editor

-- 1. Drop any conflicting or restrictive category policies if needed
DROP POLICY IF EXISTS "auth_all_categories" ON public.categories;
DROP POLICY IF EXISTS "allow_all_categories" ON public.categories;

-- 2. Allow all operations (SELECT, INSERT, UPDATE, DELETE) on categories
CREATE POLICY "allow_all_categories" 
ON public.categories 
FOR ALL 
USING (true) 
WITH CHECK (true);
