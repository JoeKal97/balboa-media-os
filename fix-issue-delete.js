/**
 * Delete the incorrect issue so it regenerates with correct Friday date
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
    console.log('🔄 Fetching Zootown Lowdown publication...')
    
    const { data: pubs, error: pubError } = await supabase
      .from('publications')
      .select('*')
      .eq('name', 'Zootown Lowdown')
      .single()
    
    if (pubError) throw pubError
    
    const pub = pubs
    console.log(`✅ Found: ${pub.name}`)
    
    console.log('🔄 Finding issue to delete...')
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
    console.log(`🗑️  Deleting issue: ${issue.issue_date}`)
    
    // Delete the issue
    const { error: deleteError } = await supabase
      .from('issues')
      .delete()
      .eq('id', issue.id)
    
    if (deleteError) throw deleteError
    
    // Also delete related slots and checklist
    await supabase.from('issue_article_slots').delete().eq('issue_id', issue.id)
    await supabase.from('issue_checklists').delete().eq('issue_id', issue.id)
    
    console.log('✅ Issue deleted successfully')
    console.log('   The app will regenerate it with the correct Friday date on next load')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

fix()
