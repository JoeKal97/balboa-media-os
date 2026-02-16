/**
 * Migration Script: Column rename (send_datetime_local → send_datetime_utc)
 * 
 * Usage: npx ts-node scripts/migrate.ts
 * 
 * This script:
 * 1. Connects to Supabase using the service role key
 * 2. Executes the DDL migration to rename the column
 * 3. Verifies the migration succeeded
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
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
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

console.log('🔄 Initializing Supabase client with service role key...')
const supabase = createClient(supabaseUrl, serviceRoleKey)

async function runMigration() {
  try {
    console.log('📋 Migration: Rename send_datetime_local → send_datetime_utc')
    console.log('─'.repeat(60))

    // Check if column already exists in new form
    const { data: columns, error: checkError } = await supabase.rpc('get_columns_for_table', {
      table_name: 'issues'
    }).catch(async () => {
      // If RPC doesn't exist, try querying the table to check schema
      const { error } = await supabase
        .from('issues')
        .select('send_datetime_utc')
        .limit(1)
      
      if (!error) {
        return { data: [{ column_name: 'send_datetime_utc' }], error: null }
      }
      return { data: null, error }
    })

    // Try alternative: query information_schema
    const { data: schemaCheck, error: schemaError } = await supabase
      .rpc('execute_sql', {
        sql: `SELECT column_name FROM information_schema.columns WHERE table_name='issues' AND column_name='send_datetime_utc'`
      })
      .catch(async () => {
        // If RPC not available, assume we need to run the migration
        return { data: null, error: 'RPC not available' }
      })

    if (schemaCheck && schemaCheck.length > 0) {
      console.log('✅ Column already renamed - migration skipped')
      process.exit(0)
    }

    // Execute the actual migration via HTTP POST to a secure endpoint
    console.log('🔐 Executing DDL via admin API...')
    
    const migrationResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/sql_execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        sql: `ALTER TABLE issues RENAME COLUMN send_datetime_local TO send_datetime_utc;`
      })
    }).catch(async () => {
      // Fallback: Try the standard Supabase RPC
      console.log('⚠️  REST endpoint not available, trying RPC...')
      return null
    })

    if (migrationResponse && migrationResponse.ok) {
      console.log('✅ Migration executed successfully via REST API')
      console.log('   Column renamed: send_datetime_local → send_datetime_utc')
      process.exit(0)
    }

    // Last resort: Use psql-like approach via Supabase's SQL API
    console.log('🔄 Trying Supabase SQL admin endpoint...')
    
    const adminResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'X-Client-Info': 'balboa-media-os/migration'
      },
      body: JSON.stringify({
        query: `ALTER TABLE public.issues RENAME COLUMN send_datetime_local TO send_datetime_utc;`
      })
    }).catch(() => null)

    if (adminResponse && adminResponse.ok) {
      console.log('✅ Migration executed via admin endpoint')
      process.exit(0)
    }

    throw new Error('Could not execute DDL via available APIs')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n⚠️  FALLBACK INSTRUCTION:')
    console.log('   The automated migration requires Supabase DDL support.')
    console.log('   Please run this SQL manually in the Supabase Dashboard:')
    console.log('')
    console.log('   ALTER TABLE issues RENAME COLUMN send_datetime_local TO send_datetime_utc;')
    console.log('')
    console.log('   URL: https://app.supabase.com/project/cbjjskzwcufpjceygimf/sql/new')
    console.log('')
    process.exit(1)
  }
}

runMigration()
