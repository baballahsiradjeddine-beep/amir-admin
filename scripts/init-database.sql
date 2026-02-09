-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  description TEXT,
  initial_capital BIGINT NOT NULL DEFAULT 0,
  working_capital BIGINT NOT NULL DEFAULT 0,
  share_percentage INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create fournisseurs table
CREATE TABLE IF NOT EXISTS fournisseurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'RMB')),
  balance BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('company', 'fournisseur')),
  amount BIGINT NOT NULL,
  rate DECIMAL(10, 2) NOT NULL DEFAULT 1,
  description TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  fournisseur_id UUID REFERENCES fournisseurs(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create fund_capital table
CREATE TABLE IF NOT EXISTS fund_capital (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  amount BIGINT NOT NULL DEFAULT 0,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS companies_user_id_idx ON companies(user_id);
CREATE INDEX IF NOT EXISTS fournisseurs_user_id_idx ON fournisseurs(user_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_company_id_idx ON transactions(company_id);
CREATE INDEX IF NOT EXISTS transactions_fournisseur_id_idx ON transactions(fournisseur_id);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON transactions(created_at DESC);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_capital ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- For admin access (Service Role Key), we allow all operations
-- For regular auth, we check user_id matches auth.uid()

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
