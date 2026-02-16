/**
 * Check all publications and their send schedules
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

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

async function check() {
  try {
    console.log('📋 ALL PUBLICATIONS:\n')
    
    const { data: pubs } = await supabase
      .from('publications')
      .select('*')
      .order('name')
    
    if (!pubs || pubs.length === 0) {
      console.log('No publications found')
      process.exit(0)
    }
    
    for (const pub of pubs) {
      console.log(`${pub.name}:`)
      console.log(`  Send day: ${pub.send_day_of_week} (${dayNames[pub.send_day_of_week]})`)
      console.log(`  Send time: ${pub.send_time_local}`)
      
      // Get next issue for this pub
      const { data: issues } = await supabase
        .from('issues')
        .select('*')
        .eq('publication_id', pub.id)
        .order('send_datetime_local', { ascending: false })
        .limit(1)
      
      if (issues && issues.length > 0) {
        console.log(`  Next issue: ${issues[0].issue_date}`)
      } else {
        console.log(`  Next issue: (none - will be created on app load)`)
      }
      console.log()
    }
    
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

check()
