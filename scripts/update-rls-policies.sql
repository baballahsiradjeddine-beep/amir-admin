-- Update RLS Policies to allow Service Role Key (admin) operations
-- This script drops and recreates all RLS policies to include admin access

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own companies" ON companies;
DROP POLICY IF EXISTS "Users can insert their own companies" ON companies;
DROP POLICY IF EXISTS "Users can update their own companies" ON companies;
DROP POLICY IF EXISTS "Users can delete their own companies" ON companies;
DROP POLICY IF EXISTS "Users can view their own fournisseurs" ON fournisseurs;
DROP POLICY IF EXISTS "Users can insert their own fournisseurs" ON fournisseurs;
DROP POLICY IF EXISTS "Users can update their own fournisseurs" ON fournisseurs;
DROP POLICY IF EXISTS "Users can delete their own fournisseurs" ON fournisseurs;
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view their own fund capital" ON fund_capital;
DROP POLICY IF EXISTS "Users can insert their own fund capital" ON fund_capital;
DROP POLICY IF EXISTS "Users can update their own fund capital" ON fund_capital;

-- Create new policies that allow admin access
CREATE POLICY "Users can view their own companies" ON companies
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can insert their own companies" ON companies
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can update their own companies" ON companies
  FOR UPDATE USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can delete their own companies" ON companies
  FOR DELETE USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view their own fournisseurs" ON fournisseurs
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can insert their own fournisseurs" ON fournisseurs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can update their own fournisseurs" ON fournisseurs
  FOR UPDATE USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can delete their own fournisseurs" ON fournisseurs
  FOR DELETE USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can delete their own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view their own fund capital" ON fund_capital
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can insert their own fund capital" ON fund_capital
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can update their own fund capital" ON fund_capital
  FOR UPDATE USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');
