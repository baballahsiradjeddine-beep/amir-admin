-- Remove foreign key constraints that reference auth.users
-- This allows the demo user to work without needing a real Supabase Auth user

ALTER TABLE companies DROP CONSTRAINT companies_user_id_fkey;
ALTER TABLE fournisseurs DROP CONSTRAINT fournisseurs_user_id_fkey;
ALTER TABLE transactions DROP CONSTRAINT transactions_user_id_fkey;
ALTER TABLE fund_capital DROP CONSTRAINT fund_capital_user_id_fkey;
