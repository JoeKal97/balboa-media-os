/**
 * Fix: Update Zootown Lowdown send_day_of_week to Friday (5)
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load from .env.local
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
  console.error('❌ Missing credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function fix() {
  try {
    console.log('🔄 Fixing Zootown Lowdown send_day_of_week...')
    
    // Update to Friday (5)
    const { data, error } = await supabase
      .from('publications')
      .update({ send_day_of_week: 5 })
      .eq('name', 'Zootown Lowdown')
      .select()
    
    if (error) throw error
    
    if (data && data.length > 0) {
      console.log('✅ Updated successfully')
      console.log(`   Publication: ${data[0].name}`)
      console.log(`   Send day: Friday (5)`)
      console.log(`   Send time: ${data[0].send_time_local}`)
    } else {
      console.log('⚠️  No publication found with name "Zootown Lowdown"')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

fix()
