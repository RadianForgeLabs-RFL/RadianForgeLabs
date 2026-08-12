-- Add link_with_google column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS link_with_google boolean;
