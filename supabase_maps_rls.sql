-- Enable RLS on maps table (if not already enabled)
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;

-- Policy for INSERT: Allow authenticated users to insert maps
CREATE POLICY "Allow authenticated users to insert maps"
ON maps
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for UPDATE: Allow authenticated users to update maps
CREATE POLICY "Allow authenticated users to update maps"
ON maps
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Enable real-time replication for maps table
ALTER PUBLICATION supabase_realtime ADD TABLE maps;

