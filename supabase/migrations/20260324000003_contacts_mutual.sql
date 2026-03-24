-- Add mutual column to contacts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS mutual boolean DEFAULT false;
