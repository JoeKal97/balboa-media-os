const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ynubvjmbpukdilflpevz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludWJ2am1icHVrZGlsZmxwZXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4NDQwMDksImV4cCI6MjA1MzQyMDAwOX0.4kbXnUOb_2QTmljj_w1rjCPrmVz5yJTQ18K9R_BJgfQ'
);

const articles = [
  { url: 'https://zootownlowdown.com/a/best-coffee-shops-missoula', status: 'Draft' },
  { url: 'https://zootownlowdown.com/a/best-restaurants-in-missoula-where-locals-actually-eat', status: 'Published' },
  { url: 'https://zootownlowdown.com/a/things-to-do-in-missoula-this-weekend', status: 'Published' },
  { url: 'https://zootownlowdown.com/a/best-breweries-bars-missoula', status: 'Draft' },
  { url: 'https://zootownlowdown.com/a/best-breakfast-brunch-missoula', status: 'Draft' },
  { url: 'https://zootownlowdown.com/a/things-to-do-missoula-spring', status: 'Draft' },
  { url: 'https://zootownlowdown.com/a/weekend-getaway-missoula', status: 'Draft' }
];

(async () => {
  console.log('🔍 Looking for Friday 2/20 issue...');
  
  // Get the Friday 2/20 issue
  const { data: issue, error: issueError } = await supabase
    .from('issues')
    .select('id, slots, computed_send_date_local')
    .eq('publication_id', '68d1a9c6014e703a85c13244')
    .eq('computed_send_date_local', '2026-02-20')
    .single();

  if (issueError) {
    console.log('⚠️  Issue not found in database yet');
    console.log('   The issue will be auto-created when you next load the Command Center');
    console.log('   Run this script again after loading the app');
    process.exit(0);
  }

  console.log(`✅ Found issue: ${issue.id}`);
  console.log(`   Send date: ${issue.computed_send_date_local}`);
  
  // Update slots with article URLs
  const updatedSlots = articles.map((article, idx) => ({
    slot: idx + 1,
    url: article.url,
    status: article.status
  }));

  console.log('\n📝 Updating slots...');
  const { error: updateError } = await supabase
    .from('issues')
    .update({ slots: updatedSlots })
    .eq('id', issue.id);

  if (updateError) {
    console.log('❌ Update error:', updateError);
    process.exit(1);
  } else {
    console.log('✅ Command Center updated successfully!');
    console.log('\nArticles added:');
    articles.forEach((article, idx) => {
      console.log(`   ${idx + 1}. ${article.url} (${article.status})`);
    });
  }
})();
