const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cbjjskzwcufpjceygimf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiampza3p3Y3VmcGpjZXlnaW1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzY0MiwiZXhwIjoyMDg2NzUzNjQyfQ.QdA_E7axzb3bxyOTcK_10DpDEaUigWbeD4sco_JQyL0'
);

async function deleteIssues() {
  console.log('Deleting SaveOurDoggy and Eats & Treats issues...');
  
  // Delete SaveOurDoggy issue (2/17)
  const { error: error1 } = await supabase
    .from('issues')
    .delete()
    .eq('id', '3f19065a-af33-4175-b520-187c6ddf20ef');
  
  if (error1) {
    console.error('Error deleting SaveOurDoggy issue:', error1);
  } else {
    console.log('✓ Deleted SaveOurDoggy issue');
  }

  // Delete Eats & Treats issue (2/19)
  const { error: error2 } = await supabase
    .from('issues')
    .delete()
    .eq('id', 'c8b95ba5-4052-4eb1-a0fc-34b77d314c96');
  
  if (error2) {
    console.error('Error deleting Eats & Treats issue:', error2);
  } else {
    console.log('✓ Deleted Eats & Treats issue');
  }

  console.log('\nDone. App will recreate them on next load.');
  process.exit(0);
}

deleteIssues().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
