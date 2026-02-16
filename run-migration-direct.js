#!/usr/bin/env node
/**
 * Direct Postgres Migration Runner
 * 
 * This runs the column rename migration by connecting directly to the Postgres database.
 * It constructs the connection string from Supabase configuration and executes the DDL.
 * 
 * Usage: 
 *   POSTGRES_PASSWORD=... node run-migration-direct.js
 * 
 * Or if you have DB connection string:
 *   DATABASE_URL=postgresql://... node run-migration-direct.js
 */

import pg from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const { Client } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Try to load from .env.local
const envPath = path.join(__dirname, '.env.local')
let dbConfig = null

// Option 1: Use DATABASE_URL if provided
if (process.env.DATABASE_URL) {
  dbConfig = { connectionString: process.env.DATABASE_URL }
  console.log('📡 Using DATABASE_URL from environment')
} 
// Option 2: Construct from Supabase details + postgres password
else if (process.env.POSTGRES_PASSWORD) {
  dbConfig = {
    host: 'cbjjskzwcufpjceygimf.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    ssl: { rejectUnauthorized: false }
  }
  console.log('📡 Using Postgres credentials from environment')
}
// Option 3: Try pgBouncer (connection pooling)
else if (process.env.POSTGRES_PASSWORD) {
  dbConfig = {
    host: 'cbjjskzwcufpjceygimf.supabase.co',
    port: 6543,
    database: 'postgres',
    user: 'postgres.AAAAAABBBBBBCCCCCCDDDDDD', // pgBouncer format
    password: process.env.POSTGRES_PASSWORD,
    ssl: { rejectUnauthorized: false }
  }
  console.log('📡 Trying pgBouncer connection pool')
}
else {
  console.error('❌ Database connection not configured')
  console.error('\nTo run this migration, you need one of:')
  console.error('  1. DATABASE_URL environment variable')
  console.error('  2. POSTGRES_PASSWORD environment variable')
  console.error('\nExample:')
  console.error('  POSTGRES_PASSWORD=your_password node run-migration-direct.js')
  process.exit(1)
}

async function runMigration() {
  const client = new Client(dbConfig)

  try {
    console.log('🔄 Connecting to database...')
    await client.connect()
    console.log('✅ Connected')

    console.log('📋 Checking current schema...')
    
    // Check if old column exists
    const checkOld = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'issues' 
        AND column_name = 'send_datetime_local'
      )
    `)
    
    const hasOldColumn = checkOld.rows[0].exists
    
    if (!hasOldColumn) {
      console.log('✅ Migration already complete - old column does not exist')
      await client.end()
      process.exit(0)
    }
    
    // Check if new column already exists
    const checkNew = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'issues' 
        AND column_name = 'send_datetime_utc'
      )
    `)
    
    const hasNewColumn = checkNew.rows[0].exists
    
    if (hasNewColumn) {
      console.log('✅ Migration already complete - new column already exists')
      await client.end()
      process.exit(0)
    }

    // Execute the migration
    console.log('🚀 Executing migration...')
    console.log('   ALTER TABLE issues RENAME COLUMN send_datetime_local TO send_datetime_utc;')
    
    await client.query(`
      ALTER TABLE issues 
      RENAME COLUMN send_datetime_local TO send_datetime_utc;
    `)
    
    console.log('✅ Migration executed successfully!')
    
    // Verify
    const verify = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'issues' 
      AND column_name = 'send_datetime_utc'
    `)
    
    if (verify.rows.length > 0) {
      console.log('✅ Verification: Column send_datetime_utc exists')
      console.log('\n🎉 Migration complete! Your Balboa Media OS is ready.')
      console.log('   Refresh the app: https://balboa-media-os-of6g.vercel.app')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  Could not connect to database')
      console.log('   Ensure POSTGRES_PASSWORD is correct and network access is allowed')
    }
    
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()
