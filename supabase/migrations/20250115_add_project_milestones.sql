-- Add milestone columns to active_projects table
ALTER TABLE active_projects
ADD COLUMN IF NOT EXISTS industry_identified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS partner_ided BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prototype_created BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deal_signed BOOLEAN DEFAULT false;
