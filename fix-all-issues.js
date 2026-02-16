/**
 * Fix all publication issues
 * - SaveOurDoggy: Tuesday 2/17 @ 10:00 AM
 * - Missoula Business Hub: Wednesday 2/19 @ 1:00 PM (13:00)
 * - Missoula Eats & Treats: Thursday 2/19 @ 10:00 AM
 */

import { createClient } from '@supabase/supabase-js'
import { fromZonedTime } from 'date-fns-tz'
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
const TIMEZONE = 'America/Denver'

const fixes = [
  { name: 'SaveOurDoggy', date: '2026-02-17', time: '10:00:00' },        // Tuesday
  { name: 'Missoula Business Hub', date: '2026-02-18', time: '13:00:00' }, // Wednesday
  { name: 'Missoula Eats & Treats', date: '2026-02-19', time: '10:00:00' }, // Thursday
]

async function fix() {
  try {
    for (const item of fixes) {
      console.log(`🔧 Fixing ${item.name}...`)
      
      // Get publication
      const { data: pub } = await supabase
        .from('publications')
        .select('*')
        .eq('name', item.name)
        .single()
      
      if (!pub) {
        console.log(`  ✗ Publication not found`)
        continue
      }
      
      // Parse send time
      const [h, m, s] = item.time.split(':').map(Number)
      const denverTime = new Date(2026, 1, parseInt(item.date.split('-')[2]), h, m, 0)
      const utcTime = fromZonedTime(denverTime, TIMEZONE)
      
      // Get existing issue
      const { data: issues } = await supabase
        .from('issues')
        .select('*')
        .eq('publication_id', pub.id)
        .limit(1)
      
      if (issues && issues.length > 0) {
        // Update it
        const issue = issues[0]
        const { error } = await supabase
          .from('issues')
          .update({
            issue_date: item.date,
            send_datetime_local: utcTime.toISOString()
          })
          .eq('id', issue.id)
        
        if (error) throw error
        console.log(`  ✅ Updated: ${item.date} @ ${item.time}`)
      } else {
        console.log(`  ✗ No issue found`)
      }
    }
    
    console.log('\n✅ All publications fixed!')
    
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

fix()
