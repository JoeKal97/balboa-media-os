/**
 * Recreate all issues with CORRECT send times
 * Tuesday 2/17 10:00 AM Denver
 * Wednesday 2/18 1:00 PM Denver
 * Thursday 2/19 10:00 AM Denver
 * Friday 2/20 11:00 AM Denver
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
  envContent.split('\n').filter(line => line && !line.startsWith('#')).map(line => {
    const [key, ...rest] = line.split('=')
    return [key, rest.join('=')]
  })
)

const supabase = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], envVars['SUPABASE_SERVICE_ROLE_KEY'])
const TZ = 'America/Denver'

const fixes = [
  { name: 'SaveOurDoggy', date: 17, hour: 10, min: 0 },     // Tue 2/17 10am
  { name: 'Missoula Business Hub', date: 18, hour: 13, min: 0 }, // Wed 2/18 1pm
  { name: 'Missoula Eats & Treats', date: 19, hour: 10, min: 0 }, // Thu 2/19 10am
  { name: 'Zootown Lowdown', date: 20, hour: 11, min: 0 },   // Fri 2/20 11am
]

async function recreate() {
  try {
    for (const item of fixes) {
      console.log(`🔧 Fixing ${item.name}...`)
      
      const { data: pub } = await supabase.from('publications').select('*').eq('name', item.name).single()
      if (!pub) {
        console.log(`  ✗ Not found`)
        continue
      }
      
      // Delete existing issues for this publication
      await supabase.from('issues').delete().eq('publication_id', pub.id)
      
      // Create correct issue
      const denverTime = new Date(2026, 1, item.date, item.hour, item.min, 0)
      const utcTime = fromZonedTime(denverTime, TZ)
      
      const { data: issue, error } = await supabase.from('issues').insert({
        publication_id: pub.id,
        issue_date: `2026-02-${String(item.date).padStart(2, '0')}`,
        send_datetime_utc: utcTime.toISOString(),
        status: 'draft',
        risk_score: 10,
      }).select().single()
      
      if (error) throw error
      
      // Create slots
      const slots = Array.from({ length: pub.articles_required_per_issue }, (_, i) => ({
        issue_id: issue.id,
        slot_index: i + 1,
        status: 'missing',
      }))
      await supabase.from('issue_article_slots').insert(slots)
      
      // Create checklist
      await supabase.from('issue_checklists').insert({
        issue_id: issue.id,
        articles_complete: false,
        seo_verified: false,
        internal_links_verified: false,
        formatted: false,
        sent: false,
      })
      
      console.log(`  ✅ Created: ${issue.issue_date} @ ${denverTime.toLocaleTimeString()} Denver = ${utcTime.toISOString()}`)
    }
    
    console.log('\n✅ All issues recreated with correct times!')
    
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

recreate()
