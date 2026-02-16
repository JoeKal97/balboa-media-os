/**
 * Startup Migration Handler
 * 
 * Runs on app startup to check if schema migrations are needed.
 * This is the approach when direct DDL execution isn't available.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function runStartupMigrations() {
  if (!supabaseServiceKey) {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set - skipping migrations')
    return
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('🔄 Checking for pending migrations...')
    
    // Check if send_datetime_local column still exists
    const { data, error } = await supabase
      .from('issues')
      .select('send_datetime_local')
      .limit(1)
    
    if (error && error.message.includes('send_datetime_local')) {
      // Column doesn't exist - migration already done or table structure is new
      console.log('✅ Migration status: Column send_datetime_utc exists (or table is new)')
      return
    }
    
    if (!error && data && data.length > 0 && 'send_datetime_local' in data[0]) {
      // Old column exists - we need to migrate
      console.log('⚠️  Found old column send_datetime_local - migration needed')
      console.log('   This requires manual DDL execution (one-time setup)')
      console.warn(`
╔═══════════════════════════════════════════════════════════════╗
║  MIGRATION REQUIRED: Column Rename                            ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  The database schema needs to be updated manually.            ║
║  This is a one-time setup required for timezone support.      ║
║                                                               ║
║  Go to: https://app.supabase.com/project/cbjjskzwcufpjceygimf/sql/new
║                                                               ║
║  Run this SQL:                                               ║
║  ────────────────────────────────────────────────────────   ║
║  ALTER TABLE issues                                          ║
║  RENAME COLUMN send_datetime_local TO send_datetime_utc;     ║
║  ────────────────────────────────────────────────────────   ║
║                                                               ║
║  After running: refresh the page and the app will work       ║
║  correctly with timezone-aware countdown timers.             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `)
      return
    }
    
    console.log('✅ All migrations completed')
    
  } catch (error) {
    console.error('Migration check error:', error)
  }
}
