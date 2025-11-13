const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function setupDatabase() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('📦 Reading migration file...');
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('🚀 Applying migration to Supabase...');
  console.log('⚠️  Note: Execute this SQL manually in Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/ciwzpyvdegemugbamayx/sql');
  console.log('');
  console.log('Or copy from: supabase/migrations/001_initial_schema.sql');
  console.log('');
  console.log('✨ Migration SQL is ready to apply!');
}

setupDatabase().catch(console.error);
