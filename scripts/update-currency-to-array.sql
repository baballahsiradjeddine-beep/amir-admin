-- Migration: Update fournisseurs and currency_companies to support multiple currencies

-- Step 1: Create a new column in fournisseurs table to store currencies as JSON array
ALTER TABLE fournisseurs 
ADD COLUMN currencies TEXT[] DEFAULT ARRAY['USD'];

-- Step 2: Migrate existing currency data to the new array column
UPDATE fournisseurs 
SET currencies = ARRAY[currency] 
WHERE currencies = ARRAY['USD'];

-- Step 3: Create a new column in currency_companies for base currencies (array)
ALTER TABLE currency_companies 
ADD COLUMN base_currencies TEXT[] DEFAULT ARRAY['USD'];

-- Step 4: Create a new column in currency_companies for target currencies (array)
ALTER TABLE currency_companies 
ADD COLUMN target_currencies TEXT[] DEFAULT ARRAY['DZD'];

-- Step 5: Migrate existing currency data to the new array columns
UPDATE currency_companies 
SET base_currencies = ARRAY[base_currency],
    target_currencies = ARRAY[target_currency];

-- Step 6: Drop old CHECK constraints
ALTER TABLE fournisseurs 
DROP CONSTRAINT IF EXISTS fournisseurs_currency_check;

ALTER TABLE currency_companies 
DROP CONSTRAINT IF EXISTS base_currency_check,
DROP CONSTRAINT IF EXISTS target_currency_check;

-- Step 7: Add new CHECK constraints for array elements
ALTER TABLE fournisseurs 
ADD CONSTRAINT fournisseurs_currencies_check 
CHECK (currencies <@ ARRAY['USD', 'RMB', 'EUR', 'GBP', 'JPY', 'AED', 'SAR', 'KWD', 'DZD']);

ALTER TABLE currency_companies 
ADD CONSTRAINT base_currencies_check 
CHECK (base_currencies <@ ARRAY['USD', 'EUR', 'GBP', 'RMB', 'JPY', 'AED', 'SAR', 'KWD', 'DZD', 'OTHER']),
ADD CONSTRAINT target_currencies_check 
CHECK (target_currencies <@ ARRAY['DZD', 'USD', 'EUR', 'GBP', 'RMB', 'JPY', 'AED', 'SAR', 'KWD', 'OTHER']);

-- Step 8: Drop old columns (optional - comment out if you want to keep them for reference)
-- ALTER TABLE fournisseurs DROP COLUMN currency;
-- ALTER TABLE currency_companies DROP COLUMN base_currency;
-- ALTER TABLE currency_companies DROP COLUMN target_currency;

COMMIT;
