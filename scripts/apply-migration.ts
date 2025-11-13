import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function applyMigration() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('📦 Reading migration file...')
  const migrationPath = join(process.cwd(), 'supabase', 'migrations', '001_initial_schema.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  console.log('🚀 Applying migration to Supabase...')

  // Split by semicolons and execute each statement
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    if (statement) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message)
          console.error('Statement:', statement.substring(0, 100))
        } else {
          console.log(`✅ Executed statement ${i + 1}/${statements.length}`)
        }
      } catch (err) {
        console.error(`❌ Failed to execute statement ${i + 1}:`, err)
      }
    }
  }

  console.log('✨ Migration complete!')
}

applyMigration().catch(console.error)
