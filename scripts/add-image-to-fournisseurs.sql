-- Add image column to fournisseurs table
ALTER TABLE fournisseurs ADD COLUMN IF NOT EXISTS image TEXT;

-- Create index on image column for better performance
CREATE INDEX IF NOT EXISTS idx_fournisseurs_image ON fournisseurs(id) WHERE image IS NOT NULL;

-- Add comment to describe the column
COMMENT ON COLUMN fournisseurs.image IS 'URL to the supplier logo/image stored in Vercel Blob';
