-- Update active_projects table to ensure it has all fields needed for Gantt chart
ALTER TABLE public.active_projects
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS notes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS team JSONB DEFAULT '[]'::jsonb;

-- Convert target_launch_date to timestamp with time zone if it's a date
ALTER TABLE public.active_projects
ALTER COLUMN target_launch_date TYPE TIMESTAMP WITH TIME ZONE USING target_launch_date::TIMESTAMP WITH TIME ZONE;

-- Update mentor_to_launch_projects table
ALTER TABLE public.mentor_to_launch_projects
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active'::text,
ADD COLUMN IF NOT EXISTS target_launch_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS team JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- Update pro_bono_projects table
ALTER TABLE public.pro_bono_projects
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active'::text,
ADD COLUMN IF NOT EXISTS target_launch_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS team JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS active_projects_created_at_idx ON public.active_projects(created_at);
CREATE INDEX IF NOT EXISTS mentor_to_launch_projects_created_at_idx ON public.mentor_to_launch_projects(created_at);
CREATE INDEX IF NOT EXISTS pro_bono_projects_created_at_idx ON public.pro_bono_projects(created_at);

-- Ensure Row Level Security is enabled for all project tables
ALTER TABLE public.active_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_to_launch_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_bono_projects ENABLE ROW LEVEL SECURITY;

-- Create policies for active_projects if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'active_projects' AND policyname = 'Allow authenticated users to select active projects') THEN
        CREATE POLICY "Allow authenticated users to select active projects"
        ON public.active_projects
        FOR SELECT
        USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'active_projects' AND policyname = 'Allow authenticated users to insert active projects') THEN
        CREATE POLICY "Allow authenticated users to insert active projects"
        ON public.active_projects
        FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'active_projects' AND policyname = 'Allow authenticated users to update active projects') THEN
        CREATE POLICY "Allow authenticated users to update active projects"
        ON public.active_projects
        FOR UPDATE
        USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'active_projects' AND policyname = 'Allow authenticated users to delete active projects') THEN
        CREATE POLICY "Allow authenticated users to delete active projects"
        ON public.active_projects
        FOR DELETE
        USING (auth.role() = 'authenticated');
    END IF;
END
$$;

-- Create policies for mentor_to_launch_projects if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mentor_to_launch_projects' AND policyname = 'Allow authenticated users to select mentor to launch projects') THEN
        CREATE POLICY "Allow authenticated users to select mentor to launch projects"
        ON public.mentor_to_launch_projects
        FOR SELECT
        USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mentor_to_launch_projects' AND policyname = 'Allow authenticated users to insert mentor to launch projects') THEN
        CREATE POLICY "Allow authenticated users to insert mentor to launch projects"
        ON public.mentor_to_launch_projects
        FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mentor_to_launch_projects' AND policyname = 'Allow authenticated users to update mentor to launch projects') THEN
        CREATE POLICY "Allow authenticated users to update mentor to launch projects"
        ON public.mentor_to_launch_projects
        FOR UPDATE
        USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mentor_to_launch_projects' AND policyname = 'Allow authenticated users to delete mentor to launch projects') THEN
        CREATE POLICY "Allow authenticated users to delete mentor to launch projects"
        ON public.mentor_to_launch_projects
        FOR DELETE
        USING (auth.role() = 'authenticated');
    END IF;
END
$$;

-- Create policies for pro_bono_projects if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pro_bono_projects' AND policyname = 'Allow authenticated users to select pro bono projects') THEN
        CREATE POLICY "Allow authenticated users to select pro bono projects"
        ON public.pro_bono_projects
        FOR SELECT
        USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pro_bono_projects' AND policyname = 'Allow authenticated users to insert pro bono projects') THEN
        CREATE POLICY "Allow authenticated users to insert pro bono projects"
        ON public.pro_bono_projects
        FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pro_bono_projects' AND policyname = 'Allow authenticated users to update pro bono projects') THEN
        CREATE POLICY "Allow authenticated users to update pro bono projects"
        ON public.pro_bono_projects
        FOR UPDATE
        USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pro_bono_projects' AND policyname = 'Allow authenticated users to delete pro bono projects') THEN
        CREATE POLICY "Allow authenticated users to delete pro bono projects"
        ON public.pro_bono_projects
        FOR DELETE
        USING (auth.role() = 'authenticated');
    END IF;
END
$$;
