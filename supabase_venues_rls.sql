-- Enable RLS on venues table (if not already enabled)
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Allow public users to read venues
CREATE POLICY "Allow public users to read venues"
ON venues
FOR SELECT
TO public
USING (true);

-- Policy for INSERT: Allow authenticated users to insert venues
CREATE POLICY "Allow authenticated users to insert venues"
ON venues
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for UPDATE: Allow authenticated users to update venues
CREATE POLICY "Allow authenticated users to update venues"
ON venues
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Enable real-time replication for venues table
ALTER PUBLICATION supabase_realtime ADD TABLE venues;

