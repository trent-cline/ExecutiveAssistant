-- First, ensure RLS is enabled
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for own goals" ON goals;
DROP POLICY IF EXISTS "Enable insert access for own goals" ON goals;
DROP POLICY IF EXISTS "Enable update access for own goals" ON goals;
DROP POLICY IF EXISTS "Enable delete access for own goals" ON goals;

-- Create basic policies
CREATE POLICY "Enable read access for own goals"
ON goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for own goals"
ON goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update access for own goals"
ON goals FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete access for own goals"
ON goals FOR DELETE
USING (auth.uid() = user_id);