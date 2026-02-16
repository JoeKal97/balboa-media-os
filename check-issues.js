/**
 * Check the current issue for Zootown
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
    console.log('🔍 Checking issues for Zootown Lowdown...')
    
    // Get publication first
    const { data: pub, error: pubError } = await supabase
      .from('publications')
      .select('*')
      .eq('name', 'Zootown Lowdown')
      .single()
    
    if (pubError) throw pubError
    
    // Get all issues for this publication
    const { data: issues, error: issueError } = await supabase
      .from('issues')
      .select('*')
      .eq('publication_id', pub.id)
      .order('send_datetime_local', { ascending: false })
    
    if (issueError) throw issueError
    
    console.log(`\n📋 Found ${issues.length} issue(s):\n`)
    
    issues.forEach((issue, i) => {
      console.log(`Issue ${i + 1}:`)
      console.log(`   Issue date: ${issue.issue_date}`)
      console.log(`   Send datetime: ${issue.send_datetime_local}`)
      console.log(`   Status: ${issue.status}`)
      console.log(`   Created: ${issue.created_at}`)
      console.log()
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

check()
