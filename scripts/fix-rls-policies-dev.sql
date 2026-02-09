-- Create new RLS policies that work for development
-- These policies allow inserts/updates/deletes for authenticated users regardless of user_id matching

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own companies" ON companies;
DROP POLICY IF EXISTS "Users can insert their own companies" ON companies;
DROP POLICY IF EXISTS "Users can update their own companies" ON companies;
DROP POLICY IF EXISTS "Users can delete their own companies" ON companies;

-- Create new development-friendly policies for companies
CREATE POLICY "Anyone authenticated can manage companies" ON companies
  FOR ALL USING (true);

-- Drop old policies for fournisseurs
DROP POLICY IF EXISTS "Users can view their own fournisseurs" ON fournisseurs;
DROP POLICY IF EXISTS "Users can insert their own fournisseurs" ON fournisseurs;
DROP POLICY IF EXISTS "Users can update their own fournisseurs" ON fournisseurs;
DROP POLICY IF EXISTS "Users can delete their own fournisseurs" ON fournisseurs;

-- Create new policies for fournisseurs
CREATE POLICY "Anyone authenticated can manage fournisseurs" ON fournisseurs
  FOR ALL USING (true);

-- Drop old policies for transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

-- Create new policies for transactions
CREATE POLICY "Anyone authenticated can manage transactions" ON transactions
  FOR ALL USING (true);

-- Drop old policies for fund_capital
DROP POLICY IF EXISTS "Users can view their own fund capital" ON fund_capital;
DROP POLICY IF EXISTS "Users can insert their own fund capital" ON fund_capital;
DROP POLICY IF EXISTS "Users can update their own fund capital" ON fund_capital;

-- Create new policies for fund_capital
CREATE POLICY "Anyone authenticated can manage fund_capital" ON fund_capital
  FOR ALL USING (true);
