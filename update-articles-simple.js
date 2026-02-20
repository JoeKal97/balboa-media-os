const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cbjjskzwcufpjceygimf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiampza3p3Y3VmcGpjZXlnaW1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzY0MiwiZXhwIjoyMDg2NzUzNjQyfQ.QdA_E7axzb3bxyOTcK_10DpDEaUigWbeD4sco_JQyL0'
);

async function update() {
  console.log('Finding Zootown issue...\n');
  
  // Get Zootown publication
  const { data: pub } = await supabase
    .from('publications')
    .select('*')
    .eq('name', 'Zootown Lowdown')
    .single();
  
  // Get next issue
  const { data: issues } = await supabase
    .from('issues')
    .select('*')
    .eq('publication_id', pub.id)
    .order('send_datetime_utc', { ascending: true })
    .limit(1);
  
  const issue = issues[0];
  
  console.log('Found issue:', issue.id);
  console.log('Current columns:', Object.keys(issue).join(', '));
  console.log('');
  
  // Update with article URLs
  const { data, error } = await supabase
    .from('issues')
    .update({
      article1_url: 'https://zootownlowdown.com/a/best-coffee-shops-missoula',
      article2_url: 'https://zootownlowdown.com/a/best-restaurants-in-missoula-where-locals-actually-eat',
      article3_url: 'https://zootownlowdown.com/a/things-to-do-in-missoula-this-weekend',
      article4_url: 'https://zootownlowdown.com/a/best-breweries-bars-missoula',
      article5_url: 'https://zootownlowdown.com/a/weekend-getaway-missoula',
      article6_url: 'https://zootownlowdown.com/a/best-breakfast-brunch-missoula',
      article7_url: 'https://zootownlowdown.com/a/things-to-do-missoula-spring'
    })
    .eq('id', issue.id)
    .select();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('✅ Updated successfully!');
  console.log('All 7 article URLs added to Command Center');
}

update();
