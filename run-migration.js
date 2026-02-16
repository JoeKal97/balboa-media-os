/**
 * Migration Runner: Rename send_datetime_local to send_datetime_utc
 * Run this once with: node run-migration.js
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment')
  console.error('   Add it to .env.local or your deployment config')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🔄 Running migration: rename send_datetime_local → send_datetime_utc...')
    
    // Read the migration SQL
    const migrationPath = path.join(process.cwd(), 'migrations', '01_rename_send_datetime.sql')
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8')
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSql })
    
    if (error) {
      // If exec_sql doesn't exist, try manual column rename
      console.log('⚠️  exec_sql RPC not available, attempting direct approach...')
      
      // Try to rename using the Supabase SQL editor endpoint
      // For now, we'll provide instructions to the user
      console.log('\n📋 MANUAL STEP REQUIRED:')
      console.log('   Go to Supabase Dashboard → SQL Editor')
      console.log('   Run this SQL:\n')
      console.log(migrationSql)
      console.log('\n   Then commit and push the code changes.')
      process.exit(0)
    }
    
    console.log('✅ Migration completed successfully!')
    console.log('   Column renamed: send_datetime_local → send_datetime_utc')
    
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  }
}

runMigration()
