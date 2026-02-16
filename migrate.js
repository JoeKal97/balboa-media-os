const fs = require('fs');

const supabaseUrl = 'https://cbjjskzwcufpjceygimf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiampza3p3Y3VmcGpjZXlnaW1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzY0MiwiZXhwIjoyMDg2NzUzNjQyfQ.QdA_E7axzb3bxyOTcK_10DpDEaUigWbeD4sco_JQyL0';

const sql = fs.readFileSync('./migrate.sql', 'utf-8');

const queries = sql
  .split(';')
  .map(q => q.trim())
  .filter(q => q.length > 0);

async function runMigration() {
  console.log(`Running ${queries.length} SQL statements...`);
  
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i] + ';';
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql?apikey=${serviceRoleKey}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error(`[${i + 1}] FAILED:`, query.substring(0, 50) + '...');
        console.error('Error:', data);
      } else {
        console.log(`[${i + 1}] OK:`, query.substring(0, 50) + '...');
      }
    } catch (error) {
      console.error(`[${i + 1}] ERROR:`, error.message);
    }
  }
  
  console.log('\nMigration complete!');
}

runMigration();
