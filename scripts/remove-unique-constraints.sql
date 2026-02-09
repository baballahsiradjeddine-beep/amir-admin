-- Remove unique constraints on (user_id, name) from companies and fournisseurs
-- This allows users to have multiple companies or suppliers with the same name if needed
-- The constraints were preventing duplicate entries

ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_user_id_name_key;
ALTER TABLE fournisseurs DROP CONSTRAINT IF EXISTS fournisseurs_user_id_name_key;
