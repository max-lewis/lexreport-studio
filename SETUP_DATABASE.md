# Database Setup Instructions

## Apply Migration to Supabase

1. Go to your Supabase project: https://supabase.com/dashboard/project/ciwzpyvdegemugbamayx

2. Click on "SQL Editor" in the left sidebar

3. Click "New query"

4. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`

5. Paste into the SQL editor

6. Click "Run" or press Cmd/Ctrl + Enter

7. You should see success messages for all tables, policies, and triggers

## Verify Setup

After running the migration, you should see these tables in the Table Editor:
- users
- reports
- sections
- citations
- visual_assets
- theme_configs
- audit_logs

All tables should have Row Level Security (RLS) enabled.
