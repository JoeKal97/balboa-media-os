/**
 * Check what's stored for Zootown Lowdown publication
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

async function check() {
  try {
    console.log('🔍 Checking Zootown Lowdown publication...')
    
    const { data, error } = await supabase
      .from('publications')
      .select('*')
      .eq('name', 'Zootown Lowdown')
      .single()
    
    if (error) throw error
    
    console.log('\n📋 Publication Details:')
    console.log(`   Name: ${data.name}`)
    console.log(`   Send day of week: ${data.send_day_of_week} (0=Sun, 5=Fri)`)
    console.log(`   Send time local: ${data.send_time_local}`)
    console.log(`   Articles required: ${data.articles_required_per_issue}`)
    console.log(`   Is active: ${data.is_active}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

check()
