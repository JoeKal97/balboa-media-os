/**
 * Nuclear option: Delete ALL Zootown issues so app regenerates them fresh
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

async function nuke() {
  try {
    console.log('🔥 CLEARING ALL ZOOTOWN ISSUES...')
    
    // Get publication
    const { data: pub } = await supabase
      .from('publications')
      .select('*')
      .eq('name', 'Zootown Lowdown')
      .single()
    
    if (!pub) {
      console.log('Publication not found')
      process.exit(0)
    }
    
    // Get all issues
    const { data: issues } = await supabase
      .from('issues')
      .select('*')
      .eq('publication_id', pub.id)
    
    console.log(`Found ${issues?.length || 0} issues`)
    
    // Delete all slots and checklists for these issues
    if (issues && issues.length > 0) {
      for (const issue of issues) {
        console.log(`Deleting issue ${issue.issue_date}...`)
        await supabase.from('issue_article_slots').delete().eq('issue_id', issue.id)
        await supabase.from('issue_checklists').delete().eq('issue_id', issue.id)
        await supabase.from('issues').delete().eq('id', issue.id)
      }
    }
    
    console.log('✅ All issues cleared')
    console.log('   App will regenerate on next load with fresh 2/20 Friday schedule')
    
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

nuke()
