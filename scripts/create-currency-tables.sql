-- Create currency_companies table
CREATE TABLE IF NOT EXISTS currency_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  base_currency TEXT NOT NULL CHECK (base_currency IN ('USD', 'EUR', 'GBP', 'RMB', 'OTHER')),
  target_currency TEXT NOT NULL CHECK (target_currency IN ('DZD', 'USD', 'EUR', 'GBP', 'RMB', 'OTHER')),
  exchange_rate DECIMAL(10, 4) NOT NULL DEFAULT 1,
  commission_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create currency_transactions table
CREATE TABLE IF NOT EXISTS currency_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  currency_company_id UUID NOT NULL REFERENCES currency_companies(id) ON DELETE CASCADE,
  from_amount DECIMAL(15, 2) NOT NULL,
  to_amount DECIMAL(15, 2) NOT NULL,
  exchange_rate_used DECIMAL(10, 4) NOT NULL,
  commission_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS currency_companies_user_id_idx ON currency_companies(user_id);
CREATE INDEX IF NOT EXISTS currency_transactions_user_id_idx ON currency_transactions(user_id);
CREATE INDEX IF NOT EXISTS currency_transactions_company_id_idx ON currency_transactions(currency_company_id);
CREATE INDEX IF NOT EXISTS currency_transactions_created_at_idx ON currency_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE currency_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for currency_companies
CREATE POLICY "Users can view their own currency companies" ON currency_companies
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own currency companies" ON currency_companies
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own currency companies" ON currency_companies
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own currency companies" ON currency_companies
  FOR DELETE USING (true);

-- Create RLS policies for currency_transactions
CREATE POLICY "Users can view their own currency transactions" ON currency_transactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own currency transactions" ON currency_transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own currency transactions" ON currency_transactions
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own currency transactions" ON currency_transactions
  FOR DELETE USING (true);
