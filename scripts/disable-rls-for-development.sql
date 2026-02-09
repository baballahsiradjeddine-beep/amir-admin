-- This script disables or modifies RLS policies for development purposes
-- It allows the app to work without real Supabase Auth

-- Drop existing RLS policies for companies
DROP POLICY IF EXISTS "Users can view their own companies" ON companies;
DROP POLICY IF EXISTS "Users can insert their own companies" ON companies;
DROP POLICY IF EXISTS "Users can update their own companies" ON companies;
DROP POLICY IF EXISTS "Users can delete their own companies" ON companies;

-- Create permissive policies for development
-- These allow all operations (suitable for demo/development only)
CREATE POLICY "Allow all operations on companies" ON companies
  FOR ALL USING (true);

-- Drop existing RLS policies for fournisseurs
DROP POLICY IF EXISTS "Users can view their own fournisseurs" ON fournisseurs;
DROP POLICY IF EXISTS "Users can insert their own fournisseurs" ON fournisseurs;
DROP POLICY IF EXISTS "Users can update their own fournisseurs" ON fournisseurs;
DROP POLICY IF EXISTS "Users can delete their own fournisseurs" ON fournisseurs;

-- Create permissive policies for fournisseurs
CREATE POLICY "Allow all operations on fournisseurs" ON fournisseurs
  FOR ALL USING (true);

-- Drop existing RLS policies for transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

-- Create permissive policies for transactions
CREATE POLICY "Allow all operations on transactions" ON transactions
  FOR ALL USING (true);

-- Drop existing RLS policies for fund_capital
DROP POLICY IF EXISTS "Users can view their own fund_capital" ON fund_capital;
DROP POLICY IF EXISTS "Users can insert their own fund_capital" ON fund_capital;
DROP POLICY IF EXISTS "Users can update their own fund_capital" ON fund_capital;
DROP POLICY IF EXISTS "Users can delete their own fund_capital" ON fund_capital;

-- Create permissive policies for fund_capital
CREATE POLICY "Allow all operations on fund_capital" ON fund_capital
  FOR ALL USING (true);
