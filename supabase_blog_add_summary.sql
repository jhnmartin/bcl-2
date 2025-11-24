-- Add summary column to blogs table (if table already exists)
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS summary TEXT;



