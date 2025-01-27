-- Modify the title column to have a character limit
ALTER TABLE brain_dump 
ALTER COLUMN title TYPE varchar(100);

-- Make the content column wider
ALTER TABLE brain_dump 
ALTER COLUMN content TYPE text;

-- Add an index on the title for better performance
CREATE INDEX IF NOT EXISTS idx_brain_dump_title ON brain_dump(title);

-- Add comment to explain the column constraints
COMMENT ON COLUMN brain_dump.title IS 'Limited to 100 characters for display purposes';
COMMENT ON COLUMN brain_dump.content IS 'Stores the full content of the note without length restriction';
