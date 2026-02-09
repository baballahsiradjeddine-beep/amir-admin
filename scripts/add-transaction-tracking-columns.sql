-- Add balance column to fournisseurs table to track foreign currency balance
ALTER TABLE fournisseurs ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;

-- Add companyId and fournisseurId columns to currency_transactions for linking
ALTER TABLE currency_transactions ADD COLUMN IF NOT EXISTS company_id UUID DEFAULT NULL;
ALTER TABLE currency_transactions ADD COLUMN IF NOT EXISTS fournisseur_id UUID DEFAULT NULL;
