const lettermanKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGM2MjVlODNlZGJjNTNmMWJmODc0YmIiLCJrZXkiOiIzMTBhOGU3MTEzMDQ1ODM3NmU0ZGM1M2M0ZDg5ZWNmMCIsImlkIjoiNjk4M2U0MjhlOGMwYjZmOTU4YTcwNTkzIiwiaWF0IjoxNzcwMjUxMzA1LCJleHAiOjE4MDE3ODczMDV9.9zHseu2Jo9BdrghX7e8q3vUYpqoeQhjXttwLOk6xyjs';

async function debug() {
  console.log('=== Testing Letterman API ===\n');
  
  // Test 1: Get publications
  console.log('1. Fetching publications...');
  const pubsRes = await fetch('https://api.letterman.ai/api/ai/newsletters-storage', {
    headers: {
      'Authorization': `Bearer ${lettermanKey}`,
      'Content-Type': 'application/json',
    },
  });

  console.log(`Status: ${pubsRes.status}`);
  console.log(`Content-Type: ${pubsRes.headers.get('content-type')}`);
  
  const pubsText = await pubsRes.text();
  console.log(`Response (first 500 chars): ${pubsText.substring(0, 500)}`);
  
  if (pubsRes.ok) {
    const pubs = JSON.parse(pubsText);
    console.log(`\n✓ Found ${pubs.length} publications`);
    pubs.forEach(p => console.log(`  - ${p.name} (${p.domain})`));
  }
}

debug().catch(console.error);
