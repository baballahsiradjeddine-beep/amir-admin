-- Completely disable RLS for development
-- This allows all operations without any restrictions

ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE fournisseurs DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE fund_capital DISABLE ROW LEVEL SECURITY;
