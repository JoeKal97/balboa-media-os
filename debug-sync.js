const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cbjjskzwcufpjceygimf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiampza3p3Y3VmcGpjZXlnaW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzc2NDIsImV4cCI6MjA4Njc1MzY0Mn0.ogHa14xD2jjDIMVRDeQ586pYuAmW688Hw8tIHDIIP5s'
);

const lettermanKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGM2MjVlODNlZGJjNTNmMWJmODc0YmIiLCJrZXkiOiIzMTBhOGU3MTEzMDQ1ODM3NmU0ZGM1M2M0ZDg5ZWNmMCIsImlkIjoiNjk4M2U0MjhlOGMwYjZmOTU4YTcwNTkzIiwiaWF0IjoxNzcwMjUxMzA1LCJleHAiOjE4MDE3ODczMDV9.9zHseu2Jo9BdrghX7e8q3vUYpqoeQhjXttwLOk6xyjs';

async function debug() {
  console.log('=== BALBOA SLOTS (Draft with URLs) ===\n');
  
  const { data: slots } = await supabase
    .from('issue_article_slots')
    .select('id, article_url, article_title, status')
    .eq('status', 'draft')
    .not('article_url', 'is', null);

  slots.forEach(slot => {
    console.log(`Slot: ${slot.article_title}`);
    console.log(`  URL: ${slot.article_url}`);
    console.log(`  Status: ${slot.status}\n`);
  });

  console.log('\n=== LETTERMAN ARTICLES (SaveOurDoggy) ===\n');

  // Get publications
  const pubsRes = await fetch('https://api.letterman.ai/api/ai/newsletters-storage', {
    headers: {
      'Authorization': `Bearer ${lettermanKey}`,
      'Content-Type': 'application/json',
    },
  });

  const pubs = await pubsRes.json();
  const savePub = pubs.find(p => p.name === 'Save Our Doggy');

  if (!savePub) {
    console.log('ERROR: SaveOurDoggy publication not found!');
    return;
  }

  console.log(`Publication: ${savePub.name}`);
  console.log(`Domain: ${savePub.domain}\n`);

  // Get articles
  const articlesRes = await fetch(
    `https://api.letterman.ai/api/ai/newsletters-storage/${savePub._id}/newsletters?type=ARTICLE`,
    {
      headers: {
        'Authorization': `Bearer ${lettermanKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const articles = await articlesRes.json();

  console.log(`Total articles: ${articles.length}\n`);

  articles.slice(0, 10).forEach(article => {
    const articleUrl = article.urlPath ? `https://${savePub.domain}/${article.urlPath}` : null;
    console.log(`Title: ${article.title}`);
    console.log(`  State: ${article.state}`);
    console.log(`  URL Path: ${article.urlPath}`);
    console.log(`  Constructed URL: ${articleUrl}`);
    console.log(`  Published: ${article.published ? 'YES' : 'NO'}\n`);
  });
}

debug().catch(console.error);
