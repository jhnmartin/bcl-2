-- Enable RLS on specials table (if not already enabled)
ALTER TABLE specials ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Allow public users to read specials
CREATE POLICY "Allow public users to read specials"
ON specials
FOR SELECT
TO public
USING (true);

-- Policy for INSERT: Allow authenticated users to insert specials
CREATE POLICY "Allow authenticated users to insert specials"
ON specials
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for UPDATE: Allow authenticated users to update specials
CREATE POLICY "Allow authenticated users to update specials"
ON specials
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for DELETE: Allow authenticated users to delete specials
CREATE POLICY "Allow authenticated users to delete specials"
ON specials
FOR DELETE
TO authenticated
USING (true);

-- Enable real-time replication for specials table
ALTER PUBLICATION supabase_realtime ADD TABLE specials;

