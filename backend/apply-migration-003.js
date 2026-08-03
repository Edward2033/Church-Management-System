const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.upnarcvdnbveixuqzzly:MyStrongPass%40123%21@aws-1-eu-central-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function applyMigration() {
  const client = await pool.connect();
  try {
    console.log('Connected to database...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '..', 'database', 'migrations', '003_add_choir_director.sql'),
      'utf8'
    );
    
    console.log('Applying migration 003_add_choir_director.sql...');
    await client.query(migrationSQL);
    
    console.log('✅ Migration applied successfully!');
    console.log('- Added is_director BOOLEAN column to choir_members');
    console.log('- Created unique index for one director per church');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration().catch(console.error);
