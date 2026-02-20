const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cbjjskzwcufpjceygimf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiampza3p3Y3VmcGpjZXlnaW1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzY0MiwiZXhwIjoyMDg2NzUzNjQyfQ.QdA_E7axzb3bxyOTcK_10DpDEaUigWbeD4sco_JQyL0'
);

const articles = [
  { url: 'https://zootownlowdown.com/a/best-coffee-shops-missoula', status: 'Draft' },
  { url: 'https://zootownlowdown.com/a/best-restaurants-in-missoula-where-locals-actually-eat', status: 'Draft' },
  { url: 'https://zootownlowdown.com/a/things-to-do-in-missoula-this-weekend', status: 'Draft' },
  { url: 'https://zootownlowdown.com/a/best-breweries-bars-missoula', status: 'Draft' },
  { url: 'https://zootownlowdown.com/a/weekend-getaway-missoula', status: 'Draft' },
  { url: 'https://zootownlowdown.com/a/best-breakfast-brunch-missoula', status: 'Draft' },
  { url: 'https://zootownlowdown.com/a/things-to-do-missoula-spring', status: 'Draft' }
];

async function updateCommandCenter() {
  console.log('Updating Command Center for Zootown Lowdown Friday 2/20...\n');
  
  // Get all publications
  const { data: pubs, error: pubError } = await supabase
    .from('publications')
    .select('*');
  
  if (pubError) {
    console.error('Error fetching publications:', pubError);
    return;
  }
  
  // Find Zootown Lowdown
  const zootown = pubs.find(p => p.name === 'Zootown Lowdown');
  
  if (!zootown) {
    console.log('Could not find Zootown Lowdown publication');
    return;
  }
  
  console.log('Found Zootown Lowdown:', zootown.id);
  
  // Get all issues for Zootown
  const { data: issues, error: issueError } = await supabase
    .from('issues')
    .select('*')
    .eq('publication_id', zootown.id)
    .order('send_datetime_utc', { ascending: true });
  
  if (issueError) {
    console.error('Error fetching issues:', issueError);
    return;
  }
  
  console.log('Found', issues.length, 'issues\n');
  
  // Find the next Friday issue (Feb 20/21 depending on timezone)
  const nextIssue = issues.find(i => {
    const date = new Date(i.send_datetime_utc);
    return date.getDate() >= 20 && date.getDate() <= 21 && date.getMonth() === 1; // February
  });
  
  if (!nextIssue) {
    console.log('No Friday 2/20 issue found. Available issues:');
    issues.forEach(i => console.log(' -', i.send_datetime_utc));
    return;
  }
  
  console.log('Updating issue:', nextIssue.id);
  console.log('Send date:', nextIssue.send_datetime_utc);
  console.log('');
  
  // Build update object
  const updateData = {};
  articles.forEach((article, i) => {
    const slotNum = i + 1;
    updateData[`article${slotNum}_url`] = article.url;
    updateData[`article${slotNum}_status`] = article.status;
  });
  
  const { data, error } = await supabase
    .from('issues')
    .update(updateData)
    .eq('id', nextIssue.id)
    .select();
  
  if (error) {
    console.error('Error updating issue:', error);
    return;
  }
  
  console.log('✅ Command Center Updated!');
  console.log('='.repeat(70));
  articles.forEach((article, i) => {
    const title = article.url.split('/').pop().replace(/-/g, ' ');
    console.log(`Slot ${i+1}: [Draft] ${title}`);
  });
  console.log('='.repeat(70));
  console.log('\n✅ All 7 articles marked as Draft in Command Center');
  console.log('✅ Ready for Joe to publish and sync from Letterman');
  console.log('✅ Risk factor will change to yellow after completion checklist');
}

updateCommandCenter();
