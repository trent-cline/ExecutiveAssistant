-- Add new columns to goals table
ALTER TABLE goals
ADD COLUMN IF NOT EXISTS deadline timestamptz,
ADD COLUMN IF NOT EXISTS completed_at timestamptz,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS current_value integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_value integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add comment for the status column to document valid values
COMMENT ON COLUMN goals.status IS 'Valid values: active, completed, paused';

-- Create an index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

-- Create an index on completed_at for faster completed goals queries
CREATE INDEX IF NOT EXISTS idx_goals_completed_at ON goals(completed_at);
