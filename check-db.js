const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cbjjskzwcufpjceygimf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiampza3p3Y3VmcGpjZXlnaW1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzY0MiwiZXhwIjoyMDg2NzUzNjQyfQ.QdA_E7axzb3bxyOTcK_10DpDEaUigWbeD4sco_JQyL0'
);

async function checkDatabase() {
  console.log('\n=== PUBLICATIONS ===');
  const { data: pubs, error: pubError } = await supabase
    .from('publications')
    .select('id, name, send_day_of_week, send_time_local')
    .eq('is_active', true);
  
  if (pubError) {
    console.error('Publications Error:', pubError);
  } else {
    console.log(JSON.stringify(pubs, null, 2));
  }

  console.log('\n=== ISSUES (Next 10) ===');
  const { data: issues, error: issueError } = await supabase
    .from('issues')
    .select('id, publication_id, issue_date, send_datetime_utc')
    .order('issue_date', { ascending: true })
    .limit(10);
  
  if (issueError) {
    console.error('Issues Error:', issueError);
  } else {
    console.log(JSON.stringify(issues, null, 2));
  }

  process.exit(0);
}

checkDatabase().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
