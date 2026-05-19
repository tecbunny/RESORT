-- Supabase Database Migration for Resort Management System
-- Paste this script into your Supabase SQL Editor (https://database.new)

-- 1. Create the collections sync table
CREATE TABLE IF NOT EXISTS resort_collections (
    name TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable row-level security (RLS)
ALTER TABLE resort_collections ENABLE ROW LEVEL SECURITY;

-- 3. Create a public read/write policy (suitable for team collaboration)
-- You can restrict this based on authenticated users in production.
CREATE POLICY "Allow public read access"
    ON resort_collections FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert/update access"
    ON resort_collections FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4. Enable Realtime subscription for the collections table
-- This allows different screens (Reception, Kitchen, Owner) to stay in sync instantly
ALTER TABLE resort_collections REPLICA IDENTITY FULL;

-- Check if publication exists, if not create it, else add table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    ALTER PUBLICATION supabase_realtime ADD TABLE resort_collections;
EXCEPTION
    WHEN OTHERS THEN
        -- If already in publication, ignore
        NULL;
END $$;
