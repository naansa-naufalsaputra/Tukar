-- Migration to add budget_limit column to categories table
-- Run this in Supabase SQL Editor

ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS budget_limit NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.categories.budget_limit IS 'Monthly budget limit for this category (0 = no limit)';
