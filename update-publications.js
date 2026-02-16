#!/usr/bin/env node
/**
 * Update publications schedule
 * Usage: node update-publications.js <SUPABASE_URL> <SUPABASE_KEY>
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.argv[2];
const supabaseKey = process.argv[3];

if (!supabaseUrl || !supabaseKey) {
  console.error('Usage: node update-publications.js <SUPABASE_URL> <SUPABASE_KEY>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const updates = [
  {
    name: 'Zootown Lowdown',
    send_day_of_week: 5, // Friday
    send_time_local: '11:00',
    articles_required_per_issue: 5,
  },
  {
    name: 'Save Our Doggy',
    send_day_of_week: 2, // Tuesday
    send_time_local: '12:00',
    articles_required_per_issue: 4,
  },
  {
    name: 'Missoula Eats & Treats',
    send_day_of_week: 4, // Thursday
    send_time_local: '10:00',
    articles_required_per_issue: 4,
  },
  {
    name: 'Missoula Business Hub',
    send_day_of_week: 3, // Wednesday
    send_time_local: '13:00',
    articles_required_per_issue: 4,
  },
];

async function updatePublications() {
  try {
    for (const update of updates) {
      const { error } = await supabase
        .from('publications')
        .update({
          send_day_of_week: update.send_day_of_week,
          send_time_local: update.send_time_local,
          articles_required_per_issue: update.articles_required_per_issue,
          updated_at: new Date().toISOString(),
        })
        .eq('name', update.name);

      if (error) {
        console.error(`Error updating ${update.name}:`, error);
      } else {
        console.log(
          `✓ Updated ${update.name}: ${update.send_day_of_week}/${update.send_time_local}, ${update.articles_required_per_issue} articles`
        );
      }
    }

    console.log('\n✅ All publications updated!');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

updatePublications();
