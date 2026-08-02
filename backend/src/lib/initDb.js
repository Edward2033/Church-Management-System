require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const pool = require('./db');

async function initDb() {
  const schemaFile = path.join(__dirname, '../../../database/schema.sql');
  if (!fs.existsSync(schemaFile)) {
    console.error('❌ database/schema.sql not found');
    process.exit(1);
  }
  const sql = fs.readFileSync(schemaFile, 'utf8');
  // Split on semicolons but keep multi-statement blocks (DO $$ ... $$) intact
  // Use pg's ability to run the full file as a single query
  try {
    await pool.query(sql);
    console.log('✅ Schema applied successfully');
  } catch (err) {
    console.error('❌ Schema failed:', err.message);
    throw err;
  }
  await pool.end();
  console.log('🎉 Database initialized: LUS4G Church Platform');
}

initDb().catch(() => process.exit(1));
