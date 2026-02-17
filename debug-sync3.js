const lettermanKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGM2MjVlODNlZGJjNTNmMWJmODc0YmIiLCJrZXkiOiIzMTBhOGU3MTEzMDQ1ODM3NmU0ZGM1M2M0ZDg5ZWNmMCIsImlkIjoiNjk4M2U0MjhlOGMwYjZmOTU4YTcwNTkzIiwiaWF0IjoxNzcwMjUxMzA1LCJleHAiOjE4MDE3ODczMDV9.9zHseu2Jo9BdrghX7e8q3vUYpqoeQhjXttwLOk6xyjs';

async function debug() {
  console.log('=== Testing Letterman GET Requests ===\n');
  
  // Test 1: Get publications (no body)
  console.log('1. GET /newsletters-storage');
  const pubsRes = await fetch('https://api.letterman.ai/api/ai/newsletters-storage', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${lettermanKey}`,
    },
  });

  console.log(`Status: ${pubsRes.status}`);
  
  if (!pubsRes.ok) {
    const text = await pubsRes.text();
    console.log(`Error response: ${text.substring(0, 300)}\n`);
    return;
  }
  
  const pubs = await pubsRes.json();
  console.log(`✓ Found ${pubs.length} publications\n`);
  
  const savePub = pubs.find(p => p.name === 'Save Our Doggy');
  if (!savePub) {
    console.log('ERROR: SaveOurDoggy not found');
    return;
  }
  
  console.log(`Found: ${savePub.name}`);
  console.log(`  ID: ${savePub._id}`);
  console.log(`  Domain: ${savePub.domain}\n`);
  
  // Test 2: Get articles for SaveOurDoggy
  console.log(`2. GET /newsletters-storage/${savePub._id}/newsletters?type=ARTICLE`);
  const articlesRes = await fetch(
    `https://api.letterman.ai/api/ai/newsletters-storage/${savePub._id}/newsletters?type=ARTICLE`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${lettermanKey}`,
      },
    }
  );

  console.log(`Status: ${articlesRes.status}`);
  
  if (!articlesRes.ok) {
    const text = await articlesRes.text();
    console.log(`Error response: ${text.substring(0, 300)}\n`);
    return;
  }
  
  const articles = await articlesRes.json();
  console.log(`✓ Found ${articles.length} articles\n`);
  
  // Show most recent 5
  console.log('Recent articles:');
  articles.slice(0, 5).forEach((a, i) => {
    const url = a.urlPath ? `https://${savePub.domain}/${a.urlPath}` : 'NO URL';
    console.log(`\n${i + 1}. ${a.title}`);
    console.log(`   State: ${a.state}`);
    console.log(`   Published: ${a.published ? 'YES' : 'NO'}`);
    console.log(`   URL: ${url}`);
  });
}

debug().catch(console.error);
