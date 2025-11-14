-- Add collaboration tracking fields to sections table

-- Add updated_by column to track who last modified the section
ALTER TABLE sections
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add index for better performance on realtime queries
CREATE INDEX IF NOT EXISTS sections_report_id_idx ON sections(report_id);
CREATE INDEX IF NOT EXISTS sections_updated_by_idx ON sections(updated_by);

-- Enable realtime for sections table
ALTER PUBLICATION supabase_realtime ADD TABLE sections;

-- Update the sections update trigger to set updated_by
CREATE OR REPLACE FUNCTION update_section_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_section_updated_by
  BEFORE UPDATE ON sections
  FOR EACH ROW
  EXECUTE FUNCTION update_section_updated_by();
