-- Drop existing tables in correct order
DROP TABLE IF EXISTS goal_milestones CASCADE;
DROP TABLE IF EXISTS goal_progress CASCADE;
DROP TABLE IF EXISTS goal_rewards CASCADE;
DROP TABLE IF EXISTS goals CASCADE;

-- Create goals table
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'personal',
    type TEXT DEFAULT 'milestone',
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'active',
    target_date TIMESTAMPTZ,
    target_value NUMERIC,
    current_value NUMERIC DEFAULT 0,
    template_id TEXT
);

-- Create goal milestones table
CREATE TABLE goal_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    sort_order INTEGER,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ
);

-- Create goal progress table
CREATE TABLE goal_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
    value NUMERIC NOT NULL,
    note TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create goal rewards table
CREATE TABLE goal_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    unlocked_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    required_progress NUMERIC
);

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for own goals" ON goals;
DROP POLICY IF EXISTS "Enable insert access for own goals" ON goals;
DROP POLICY IF EXISTS "Enable update access for own goals" ON goals;
DROP POLICY IF EXISTS "Enable delete access for own goals" ON goals;

-- Enable RLS on all tables
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_rewards ENABLE ROW LEVEL SECURITY;

-- Create policies for goals
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

-- Create policies for goal_milestones
CREATE POLICY "Enable read access for own goal milestones"
ON goal_milestones FOR SELECT
USING (EXISTS (
    SELECT 1 FROM goals
    WHERE goals.id = goal_milestones.goal_id
    AND goals.user_id = auth.uid()
));

CREATE POLICY "Enable insert access for own goal milestones"
ON goal_milestones FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM goals
    WHERE goals.id = goal_milestones.goal_id
    AND goals.user_id = auth.uid()
));

CREATE POLICY "Enable update access for own goal milestones"
ON goal_milestones FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM goals
    WHERE goals.id = goal_milestones.goal_id
    AND goals.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM goals
    WHERE goals.id = goal_milestones.goal_id
    AND goals.user_id = auth.uid()
));

CREATE POLICY "Enable delete access for own goal milestones"
ON goal_milestones FOR DELETE
USING (EXISTS (
    SELECT 1 FROM goals
    WHERE goals.id = goal_milestones.goal_id
    AND goals.user_id = auth.uid()
));

-- Create policies for goal_progress
CREATE POLICY "Enable read access for own goal progress"
ON goal_progress FOR SELECT
USING (EXISTS (
    SELECT 1 FROM goals
    WHERE goals.id = goal_progress.goal_id
    AND goals.user_id = auth.uid()
));

CREATE POLICY "Enable insert access for own goal progress"
ON goal_progress FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM goals
    WHERE goals.id = goal_progress.goal_id
    AND goals.user_id = auth.uid()
));

CREATE POLICY "Enable update access for own goal progress"
ON goal_progress FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM goals
    WHERE goals.id = goal_progress.goal_id
    AND goals.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM goals
    WHERE goals.id = goal_progress.goal_id
    AND goals.user_id = auth.uid()
));

CREATE POLICY "Enable delete access for own goal progress"
ON goal_progress FOR DELETE
USING (EXISTS (
    SELECT 1 FROM goals
    WHERE goals.id = goal_progress.goal_id
    AND goals.user_id = auth.uid()
));

-- Create policies for goal_rewards
CREATE POLICY "Enable read access for own goal rewards"
ON goal_rewards FOR SELECT
USING (EXISTS (
    SELECT 1 FROM goals
    WHERE goals.id = goal_rewards.goal_id
    AND goals.user_id = auth.uid()
));

CREATE POLICY "Enable insert access for own goal rewards"
ON goal_rewards FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM goals
    WHERE goals.id = goal_rewards.goal_id
    AND goals.user_id = auth.uid()
));

CREATE POLICY "Enable update access for own goal rewards"
ON goal_rewards FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM goals
    WHERE goals.id = goal_rewards.goal_id
    AND goals.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM goals
    WHERE goals.id = goal_rewards.goal_id
    AND goals.user_id = auth.uid()
));

CREATE POLICY "Enable delete access for own goal rewards"
ON goal_rewards FOR DELETE
USING (EXISTS (
    SELECT 1 FROM goals
    WHERE goals.id = goal_rewards.goal_id
    AND goals.user_id = auth.uid()
));
