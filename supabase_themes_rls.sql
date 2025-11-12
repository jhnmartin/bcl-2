-- Enable RLS on themes table (if not already enabled)
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

-- Policy for INSERT: Allow authenticated users to insert themes
CREATE POLICY "Allow authenticated users to insert themes"
ON themes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for UPDATE: Allow authenticated users to update themes
CREATE POLICY "Allow authenticated users to update themes"
ON themes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Enable real-time replication for themes table
ALTER PUBLICATION supabase_realtime ADD TABLE themes;

