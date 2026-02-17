import { createClient } from '@supabase/supabase-js'
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

async function verify() {
  const { data: pubs } = await supabase.from('publications').select('*')
  
  for (const pub of pubs) {
    const { data: issues } = await supabase.from('issues').select('*').eq('publication_id', pub.id)
    
    console.log(`${pub.name} (ID: ${pub.id}):`)
    if (issues && issues.length > 0) {
      issues.forEach(i => {
        console.log(`  ${i.issue_date} @ ${i.send_datetime_utc}`)
      })
    } else {
      console.log(`  (no issues)`)
    }
  }
}

verify()
