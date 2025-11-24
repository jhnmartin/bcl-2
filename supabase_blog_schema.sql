-- Create blog table
CREATE TABLE IF NOT EXISTS blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT,
  content JSONB NOT NULL DEFAULT '{"type":"doc","content":[]}'::jsonb,
  seo_title TEXT,
  seo_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);

-- Create index on published_at for sorting published blogs
CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON blogs(published_at DESC) WHERE published_at IS NOT NULL;

-- Create index on author_id for filtering by author
CREATE INDEX IF NOT EXISTS idx_blogs_author_id ON blogs(author_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_blogs_updated_at
  BEFORE UPDATE ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Allow public to read published blogs
CREATE POLICY "Allow public to read published blogs"
ON blogs
FOR SELECT
TO public
USING (published_at IS NOT NULL AND published_at <= NOW());

-- Policy for SELECT: Allow authenticated users to read all blogs (including drafts)
CREATE POLICY "Allow authenticated users to read all blogs"
ON blogs
FOR SELECT
TO authenticated
USING (true);

-- Policy for INSERT: Allow authenticated users to create blogs
CREATE POLICY "Allow authenticated users to insert blogs"
ON blogs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for UPDATE: Allow authenticated users to update blogs
CREATE POLICY "Allow authenticated users to update blogs"
ON blogs
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for DELETE: Allow authenticated users to delete blogs (optional - adjust as needed)
CREATE POLICY "Allow authenticated users to delete blogs"
ON blogs
FOR DELETE
TO authenticated
USING (true);

-- Enable real-time replication for blogs table
ALTER PUBLICATION supabase_realtime ADD TABLE blogs;

