#!/usr/bin/env node
/**
 * Run the column rename migration using Service Role Key
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cbjjskzwcufpjceygimf.supabase.co'
const serviceRoleKey = process.argv[2]

if (!serviceRoleKey) {
  console.error('❌ Usage: node run-migration-now.js <SERVICE_ROLE_KEY>')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function runMigration() {
  try {
    console.log('🔄 Running migration: send_datetime_local → send_datetime_utc...')
    
    // Execute the ALTER TABLE
    const { error } = await supabase.rpc('exec_sql', { 
      sql: `ALTER TABLE issues RENAME COLUMN send_datetime_local TO send_datetime_utc;`
    })
    
    if (error && error.message.includes('exec_sql')) {
      // exec_sql RPC might not exist, try alternative approach
      console.log('⚠️  Trying alternative approach...')
      
      // For Supabase, we need to use the admin API
      const response = await fetch(`${supabaseUrl}/rest/v1/issues?select=id`, {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error(`Supabase API error: ${response.status}`)
      }
      
      console.log('✅ Database connection verified')
      console.log('\n📋 MANUAL STEP REQUIRED (DDL via SQL Editor):')
      console.log('   Go to: https://app.supabase.com/project/cbjjskzwcufpjceygimf/sql/new')
      console.log('   Run this SQL:\n')
      console.log('   ALTER TABLE issues RENAME COLUMN send_datetime_local TO send_datetime_utc;')
      console.log('\n   Press Ctrl+Enter to execute')
      process.exit(0)
    }
    
    if (error) {
      throw error
    }
    
    console.log('✅ Migration completed successfully!')
    console.log('   Column renamed: send_datetime_local → send_datetime_utc')
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    console.log('\n📋 MANUAL FALLBACK:')
    console.log('   Go to: https://app.supabase.com/project/cbjjskzwcufpjceygimf/sql/new')
    console.log('   Run: ALTER TABLE issues RENAME COLUMN send_datetime_local TO send_datetime_utc;')
    process.exit(1)
  }
}

runMigration()
