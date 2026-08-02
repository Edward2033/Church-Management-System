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

console.log(`[DB] Initializing connection pool`);
console.log(`[DB] Type: ${connType} | Host: ${host}:${port} | DB: ${dbName}`);

const pool = new Pool({
  connectionString: rawUrl,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB] Pool error:', err.message);
});

pool.on('connect', () => {
  console.log('[DB] Client connected to pool');
});

module.exports = pool;
