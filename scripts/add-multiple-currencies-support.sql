-- Add JSON columns for storing multiple currencies
ALTER TABLE currency_companies 
ADD COLUMN IF NOT EXISTS base_currencies TEXT[] DEFAULT ARRAY['USD'],
ADD COLUMN IF NOT EXISTS target_currencies TEXT[] DEFAULT ARRAY['DZD'];

-- Update existing records
UPDATE currency_companies 
SET base_currencies = ARRAY[base_currency]
WHERE base_currencies IS NULL OR base_currencies = ARRAY[]::TEXT[];

UPDATE currency_companies 
SET target_currencies = ARRAY[target_currency]
WHERE target_currencies IS NULL OR target_currencies = ARRAY[]::TEXT[];

-- Create index for better performance
CREATE INDEX IF NOT EXISTS currency_companies_base_currencies_idx ON currency_companies USING GIN(base_currencies);
CREATE INDEX IF NOT EXISTS currency_companies_target_currencies_idx ON currency_companies USING GIN(target_currencies);
