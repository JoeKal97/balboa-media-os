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

async function check() {
  const { data: pub } = await supabase.from('publications').select('*').eq('name', 'Zootown Lowdown').single()
  const { data: issues } = await supabase.from('issues').select('*').eq('publication_id', pub.id)
  
  console.log('Zootown Issues:')
  issues.forEach(i => {
    console.log(`  Date: ${i.issue_date}`)
    console.log(`  Send (UTC): ${i.send_datetime_utc}`)
  })
}

check()
