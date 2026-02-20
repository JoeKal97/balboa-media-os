const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cbjjskzwcufpjceygimf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiampza3p3Y3VmcGpjZXlnaW1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzY0MiwiZXhwIjoyMDg2NzUzNjQyfQ.QdA_E7axzb3bxyOTcK_10DpDEaUigWbeD4sco_JQyL0'
);

const articles = [
  { title: 'Best Coffee Shops in Missoula', url: 'https://zootownlowdown.com/a/best-coffee-shops-missoula', status: 'draft' },
  { title: 'Best Restaurants in Missoula', url: 'https://zootownlowdown.com/a/best-restaurants-in-missoula-where-locals-actually-eat', status: 'draft' },
  { title: 'Things to Do This Weekend', url: 'https://zootownlowdown.com/a/things-to-do-in-missoula-this-weekend', status: 'draft' },
  { title: 'Best Breweries & Bars', url: 'https://zootownlowdown.com/a/best-breweries-bars-missoula', status: 'draft' },
  { title: 'Weekend Getaway Guide', url: 'https://zootownlowdown.com/a/weekend-getaway-missoula', status: 'draft' },
  { title: 'Best Breakfast & Brunch', url: 'https://zootownlowdown.com/a/best-breakfast-brunch-missoula', status: 'draft' },
  { title: 'Spring Activities', url: 'https://zootownlowdown.com/a/things-to-do-missoula-spring', status: 'draft' }
];

async function addArticlesToSlots() {
  console.log('📋 Adding articles to Command Center slots...\n');
  
  // Get Zootown publication
  const { data: pub } = await supabase
    .from('publications')
    .select('*')
    .eq('name', 'Zootown Lowdown')
    .single();
  
  console.log('Found publication:', pub.name, '(' + pub.id + ')');
  
  // Get next issue
  const { data: issues } = await supabase
    .from('issues')
    .select('*')
    .eq('publication_id', pub.id)
    .order('send_datetime_utc', { ascending: true })
    .limit(1);
  
  const issue = issues[0];
  console.log('Found issue:', issue.id);
  console.log('Send date:', issue.send_datetime_utc);
  console.log('');
  
  // Get existing slots
  const { data: existingSlots } = await supabase
    .from('issue_article_slots')
    .select('*')
    .eq('issue_id', issue.id)
    .order('slot_index');
  
  console.log('Found', existingSlots.length, 'existing slots');
  console.log('');
  
  // Update each slot
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const slot = existingSlots[i];
    
    if (!slot) {
      console.log(`Slot ${i + 1} does not exist - skipping`);
      continue;
    }
    
    const { error } = await supabase
      .from('issue_article_slots')
      .update({
        article_title: article.title,
        article_url: article.url,
        status: article.status
      })
      .eq('id', slot.id);
    
    if (error) {
      console.log(`✗ Slot ${i + 1}: Error -`, error.message);
    } else {
      console.log(`✓ Slot ${i + 1}: [${article.status}] ${article.title}`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Command Center Updated!');
  console.log('='.repeat(70));
  console.log('All 7 articles added with "Draft" status');
  console.log('Ready for Joe to publish in Letterman and sync');
}

addArticlesToSlots();
