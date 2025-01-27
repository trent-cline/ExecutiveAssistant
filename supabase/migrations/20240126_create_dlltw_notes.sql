-- Create the dlltw_notes table
CREATE TABLE IF NOT EXISTS dlltw_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    content TEXT,
    summary TEXT,
    status TEXT DEFAULT 'Not Started',
    priority TEXT DEFAULT 'Medium',
    category TEXT DEFAULT 'Note',
    chapter TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE dlltw_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notes" ON dlltw_notes
    FOR SELECT
    USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own notes" ON dlltw_notes
    FOR INSERT
    WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own notes" ON dlltw_notes
    FOR UPDATE
    USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete their own notes" ON dlltw_notes
    FOR DELETE
    USING (auth.uid()::uuid = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_dlltw_notes_updated_at
    BEFORE UPDATE ON dlltw_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
