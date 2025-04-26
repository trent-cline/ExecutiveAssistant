-- Create steel_trap table
CREATE TABLE IF NOT EXISTS public.steel_trap (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    summary TEXT,
    status TEXT DEFAULT 'Active',
    priority TEXT DEFAULT 'Medium',
    checked BOOLEAN DEFAULT FALSE,
    original_note_id UUID
);

-- Set up Row Level Security
ALTER TABLE public.steel_trap ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to select their own steel trap items"
ON public.steel_trap
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert their own steel trap items"
ON public.steel_trap
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update their own steel trap items"
ON public.steel_trap
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete their own steel trap items"
ON public.steel_trap
FOR DELETE
USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS steel_trap_user_id_idx ON public.steel_trap(user_id);
CREATE INDEX IF NOT EXISTS steel_trap_created_at_idx ON public.steel_trap(created_at);
