'use strict';
require('dotenv').config();
const { Pool } = require('pg');

const rawUrl = (process.env.DATABASE_URL || '').trim();
if (!rawUrl) {
  console.error('[DB] FATAL: DATABASE_URL is not set.');
  process.exit(1);
}

let parsedUrl;
try { parsedUrl = new URL(rawUrl); } catch {
  console.error('[DB] FATAL: Invalid DATABASE_URL — could not parse URL.');
  process.exit(1);
}

const host     = parsedUrl.hostname;
const port     = parsedUrl.port || '5432';
const dbName   = parsedUrl.pathname.replace(/^\//, '') || 'postgres';
const isPooler = host.includes('pooler.supabase.com');
const isDirect = host.startsWith('db.') && host.includes('.supabase.co');
const connType = isPooler ? 'POOLER' : isDirect ? 'DIRECT' : 'CUSTOM';

const pool = new Pool({
  connectionString: rawUrl,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 8000,
});

pool.on('error', (err) => console.error('[DB] Pool error:', err.message));

async function connect() {
  console.log('[DB] Connecting...');
  console.log(`[DB] Type: ${connType} | Host: ${host}:${port} | DB: ${dbName}`);
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await pool.query('SELECT 1');
      console.log(`[DB] Connected (${connType})`);
      return;
    } catch (err) {
      console.error(`[DB] Attempt ${attempt} failed: ${err.message}`);
      if (attempt === 1) { await new Promise(r => setTimeout(r, 3000)); continue; }
      console.error('[DB] FATAL: Cannot connect to PostgreSQL.');
      process.exit(1);
    }
  }
}

module.exports = pool;
module.exports.connect = connect;
