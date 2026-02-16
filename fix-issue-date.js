/**
 * Fix: Update the Zootown Lowdown issue to Friday 2/21 at 11 PM Denver time
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

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
const TIMEZONE = 'America/Denver'

async function fixIssue() {
  try {
    console.log('🔄 Fetching Zootown Lowdown publication...')
    
    // Get the publication
    const { data: pubs, error: pubError } = await supabase
      .from('publications')
      .select('*')
      .eq('name', 'Zootown Lowdown')
      .single()
    
    if (pubError) throw pubError
    
    const pub = pubs
    console.log(`✅ Found: ${pub.name}`)
    
    // Get the current issue
    console.log('🔄 Fetching next issue...')
    const { data: issues, error: issueError } = await supabase
      .from('issues')
      .select('*')
      .eq('publication_id', pub.id)
      .order('send_datetime_local', { ascending: false })
      .limit(1)
    
    if (issueError) throw issueError
    
    if (!issues || issues.length === 0) {
      console.log('⚠️  No issue found')
      process.exit(0)
    }
    
    const issue = issues[0]
    console.log(`✅ Found issue: ${issue.issue_date}`)
    
    // Calculate correct send time: Friday 2/21/2026 at 11:00 PM Denver time
    const correctDenver = new Date(2026, 1, 21, 23, 0, 0) // Feb 21, 11 PM
    const correctUTC = fromZonedTime(correctDenver, TIMEZONE)
    
    console.log(`📅 Current send date: ${issue.send_datetime_local}`)
    console.log(`📅 Correct send date: ${correctUTC.toISOString()}`)
    
    // Update the issue
    console.log('🔄 Updating issue...')
    const { data: updated, error: updateError } = await supabase
      .from('issues')
      .update({ 
        issue_date: '2026-02-21',
        send_datetime_local: correctUTC.toISOString()
      })
      .eq('id', issue.id)
      .select()
    
    if (updateError) throw updateError
    
    console.log('✅ Issue updated successfully')
    console.log(`   New date: ${updated[0].issue_date}`)
    console.log(`   New send time (UTC): ${updated[0].send_datetime_local}`)
    console.log(`   Denver time: Friday, February 21, 2026 at 11:00 PM`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

fixIssue()
