-- Add columns to currency_transactions for tracking supplier and company
ALTER TABLE currency_transactions 
ADD COLUMN IF NOT EXISTS usd_fournisseur_id UUID REFERENCES fournisseurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS dzd_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS usd_description TEXT,
ADD COLUMN IF NOT EXISTS dzd_description TEXT;
