/**
 * Fix: Update Zootown Lowdown send_day_of_week to Friday (6)
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

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function fix() {
  try {
    console.log('🔄 Fixing Zootown Lowdown send_day_of_week to Friday (6)...')
    
    const { data, error } = await supabase
      .from('publications')
      .update({ send_day_of_week: 6 })
      .eq('name', 'Zootown Lowdown')
      .select()
    
    if (error) throw error
    
    console.log('✅ Updated successfully')
    console.log(`   send_day_of_week: ${data[0].send_day_of_week}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

fix()
