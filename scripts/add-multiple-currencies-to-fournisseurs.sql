-- Add support for multiple currencies per fournisseur
ALTER TABLE fournisseurs ADD COLUMN currencies TEXT[] DEFAULT ARRAY['USD'];

-- Migrate existing data: if fournisseur has a currency, add it to currencies array
UPDATE fournisseurs 
SET currencies = ARRAY[currency] 
WHERE currencies = ARRAY['USD'] AND currency != 'USD';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS fournisseurs_currencies_idx ON fournisseurs USING GIN(currencies);
