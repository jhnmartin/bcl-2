-- Enable RLS on smartlinks table (if not already enabled)
ALTER TABLE smartlinks ENABLE ROW LEVEL SECURITY;

-- Policy for INSERT: Allow authenticated users to insert smartlinks
CREATE POLICY "Allow authenticated users to insert smartlinks"
ON smartlinks
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for UPDATE: Allow authenticated users to update smartlinks
CREATE POLICY "Allow authenticated users to update smartlinks"
ON smartlinks
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Enable real-time replication for smartlinks table
ALTER PUBLICATION supabase_realtime ADD TABLE smartlinks;

