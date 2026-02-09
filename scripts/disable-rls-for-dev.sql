-- Disable RLS for development
-- This allows all operations without authentication checks
-- WARNING: Only for development/testing. Use proper RLS in production.

ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE fournisseurs DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE fund_capital DISABLE ROW LEVEL SECURITY;
