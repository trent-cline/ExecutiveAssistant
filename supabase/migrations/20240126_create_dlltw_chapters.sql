-- Create the dlltw_chapters table
CREATE TABLE IF NOT EXISTS dlltw_chapters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    content TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE dlltw_chapters ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own chapters" ON dlltw_chapters
    FOR SELECT
    USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own chapters" ON dlltw_chapters
    FOR INSERT
    WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own chapters" ON dlltw_chapters
    FOR UPDATE
    USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete their own chapters" ON dlltw_chapters
    FOR DELETE
    USING (auth.uid()::uuid = user_id);

-- Add chapter_id to dlltw_notes
ALTER TABLE dlltw_notes
ADD COLUMN chapter_id UUID REFERENCES dlltw_chapters(id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_dlltw_chapters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_dlltw_chapters_updated_at
    BEFORE UPDATE ON dlltw_chapters
    FOR EACH ROW
    EXECUTE FUNCTION update_dlltw_chapters_updated_at();
