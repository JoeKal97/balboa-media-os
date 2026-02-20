const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cbjjskzwcufpjceygimf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiampza3p3Y3VmcGpjZXlnaW1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzY0MiwiZXhwIjoyMDg2NzUzNjQyfQ.QdA_E7axzb3bxyOTcK_10DpDEaUigWbeD4sco_JQyL0'
);

const articles = [
  { url: 'https://zootownlowdown.com/a/best-coffee-shops-missoula', status: 'Draft', title: 'Best Coffee Shops' },
  { url: 'https://zootownlowdown.com/a/best-restaurants-in-missoula-where-locals-actually-eat', status: 'Published', title: 'Best Restaurants' },
  { url: 'https://zootownlowdown.com/a/things-to-do-in-missoula-this-weekend', status: 'Published', title: 'Things to Do Weekend' },
  { url: 'https://zootownlowdown.com/a/best-breweries-bars-missoula', status: 'Draft', title: 'Best Breweries & Bars' },
  { url: 'https://zootownlowdown.com/a/weekend-getaway-missoula', status: 'Draft', title: 'Weekend Getaway Guide' },
  { url: 'https://zootownlowdown.com/a/best-breakfast-brunch-missoula', status: 'Draft', title: 'Best Breakfast & Brunch' },
  { url: 'https://zootownlowdown.com/a/things-to-do-missoula-spring', status: 'Draft', title: 'Spring Activities' }
];

async function updateOSBoard() {
  console.log('Updating Balboa Media OS Command Center...\n');
  
  // Get Zootown Lowdown publication ID
  const zootownPubId = '68d1a9c6014e703a85c13244';
  
  // Get issues for Zootown
  const { data: issues, error: issueError } = await supabase
    .from('issues')
    .select('*')
    .eq('publication_id', zootownPubId)
    .order('send_datetime_utc', { ascending: true });
  
  if (issueError) {
    console.error('Error fetching issues:', issueError);
    return;
  }
  
  if (!issues || issues.length === 0) {
    console.log('No issues found for Zootown Lowdown');
    return;
  }
  
  // Find Friday 2/20 issue
  const issue = issues.find(i => {
    const date = new Date(i.send_datetime_utc);
    return date.getDate() === 21 && date.getMonth() === 1; // Feb 21 in UTC = Feb 20 in MST
  });
  
  if (!issue) {
    console.log('Could not find Friday 2/20 issue');
    console.log('Available issues:', issues.map(i => i.send_datetime_utc));
    return;
  }
  
  console.log(`Found issue: ${issue.id}`);
  console.log(`Send date: ${issue.send_datetime_utc}\n`);
  
  // Build update object for all articles
  const updateData = {};
  articles.forEach((article, i) => {
    const slotNum = i + 1;
    updateData[`article${slotNum}_url`] = article.url;
    updateData[`article${slotNum}_status`] = article.status;
  });
  
  const { data, error } = await supabase
    .from('issues')
    .update(updateData)
    .eq('id', issue.id)
    .select();
  
  if (error) {
    console.error('Error updating issue:', error);
    return;
  }
  
  console.log('✅ OS Command Center Updated!');
  console.log('='.repeat(60));
  articles.forEach((article, i) => {
    console.log(`Slot ${i+1}: [${article.status}] ${article.title}`);
    console.log(`         ${article.url}\n`);
  });
  console.log('\n🎉 All 7 articles added to Friday 2/20 Zootown Lowdown issue!');
}

updateOSBoard();
