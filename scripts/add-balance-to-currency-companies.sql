-- Add balance column to currency_companies table
ALTER TABLE currency_companies 
ADD COLUMN balance DECIMAL(15, 2) NOT NULL DEFAULT 0;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS currency_companies_balance_idx ON currency_companies(balance);
