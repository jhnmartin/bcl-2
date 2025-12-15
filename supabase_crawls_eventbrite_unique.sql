-- Add unique constraint on eventbrite_id for crawls table
-- This allows upsert operations to work with onConflict: 'eventbrite_id'

-- First, ensure there are no duplicate eventbrite_id values
-- (You may need to clean up duplicates manually if they exist)

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS crawls_eventbrite_id_unique 
ON crawls(eventbrite_id) 
WHERE eventbrite_id IS NOT NULL;

-- Alternative: If you want to use a constraint instead of an index
-- ALTER TABLE crawls ADD CONSTRAINT crawls_eventbrite_id_unique UNIQUE (eventbrite_id);

