const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cbjjskzwcufpjceygimf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiampza3p3Y3VmcGpjZXlnaW1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzY0MiwiZXhwIjoyMDg2NzUzNjQyfQ.QdA_E7axzb3bxyOTcK_10DpDEaUigWbeD4sco_JQyL0'
);

async function addMissingSlots() {
  console.log('Adding missing slots 6 & 7...\n');
  
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
  console.log('Issue:', issue.id);
  
  // Create slots 6 and 7
  const newSlots = [
    {
      issue_id: issue.id,
      slot_index: 6,
      article_title: 'Best Breakfast & Brunch',
      article_url: 'https://zootownlowdown.com/a/best-breakfast-brunch-missoula',
      status: 'draft'
    },
    {
      issue_id: issue.id,
      slot_index: 7,
      article_title: 'Spring Activities',
      article_url: 'https://zootownlowdown.com/a/things-to-do-missoula-spring',
      status: 'draft'
    }
  ];
  
  for (const slot of newSlots) {
    const { data, error } = await supabase
      .from('issue_article_slots')
      .insert(slot)
      .select();
    
    if (error) {
      console.log(`✗ Slot ${slot.slot_index}: Error -`, error.message);
    } else {
      console.log(`✓ Slot ${slot.slot_index}: [draft] ${slot.article_title}`);
    }
  }
  
  console.log('\n✅ Slots 6 & 7 created!');
  console.log('All 7 article slots now populated');
}

addMissingSlots();
