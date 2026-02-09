-- Add image column to currency_companies table
ALTER TABLE currency_companies ADD COLUMN IF NOT EXISTS image TEXT DEFAULT NULL;
