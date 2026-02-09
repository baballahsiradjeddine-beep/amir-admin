-- Add image column to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS image TEXT DEFAULT NULL;

-- Create index on image column for faster queries
CREATE INDEX IF NOT EXISTS idx_companies_image ON companies(image);

-- Add RLS policy for image column
CREATE POLICY "Allow users to view company images" ON companies
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Allow users to update company images" ON companies
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
