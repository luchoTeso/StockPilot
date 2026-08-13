const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const connectionString = 'postgresql://neondb_owner:npg_9QkPg6FAeKMr@ep-restless-dew-axhwutm7-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';
  
  // Just testing connection to see if it's empty
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log("Connected to Neon!");
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("Tables:", res.rows.map(r => r.table_name));
  } catch (err) {
    console.error("Connection error:", err.message);
  } finally {
    await client.end();
  }
}
run();
