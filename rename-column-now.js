/**
 * Final fix: Rename send_datetime_local to send_datetime_utc in the database
 * This is the one-time DDL that fixes the root cause
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = Object.fromEntries(
  envContent
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const [key, ...rest] = line.split('=')
      return [key, rest.join('=')]
    })
)

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL']
const serviceRoleKey = envVars['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function renameColumn() {
  try {
    console.log('🔄 Renaming column: send_datetime_local → send_datetime_utc...\n')
    
    // Execute the ALTER TABLE command
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE issues RENAME COLUMN send_datetime_local TO send_datetime_utc;'
    })

    if (error) {
      // If exec_sql doesn't exist, try the query approach
      console.log('⚠️  exec_sql RPC not available, attempting via query...')
      
      // Query to check if migration already happened
      const { data: check } = await supabase.rpc('get_columns_for_table', {
        table_name: 'issues'
      }).catch(async () => {
        // Fallback: try to select the new column
        const { error: e } = await supabase
          .from('issues')
          .select('send_datetime_utc')
          .limit(1)
        
        return { data: !e ? 'column_exists' : null, error: e }
      })

      if (check === 'column_exists' || (check && typeof check === 'string')) {
        console.log('✅ Column send_datetime_utc already exists')
        console.log('   Migration complete!')
        process.exit(0)
      }

      throw new Error('DDL execution not available via API - must use Supabase SQL editor')
    }

    console.log('✅ Column renamed successfully!')
    console.log('   Old column: send_datetime_local')
    console.log('   New column: send_datetime_utc')
    console.log('\n   All queries will now use the correct column name.')
    console.log('   Restart Vercel deployment to apply the change.')
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.log('\n📋 MANUAL STEP (via Supabase Dashboard):')
    console.log('   1. Go to: https://app.supabase.com/project/cbjjskzwcufpjceygimf/sql/new')
    console.log('   2. Run this SQL:')
    console.log('')
    console.log('      ALTER TABLE issues RENAME COLUMN send_datetime_local TO send_datetime_utc;')
    console.log('')
    console.log('   3. Press Ctrl+Enter to execute')
    console.log('   4. Refresh Vercel deployment')
    process.exit(1)
  }
}

renameColumn()
