#!/usr/bin/env node
/**
 * Execute SQL migration against Supabase using the pg-meta query endpoint.
 *
 * Usage:
 *   node supabase/execute_sql.mjs supabase/migrations/001_initial_schema.sql
 *   node supabase/execute_sql.mjs supabase/seed.sql
 *
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in ../.env
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// Load .env manually (no dotenv dependency needed)
const envContent = readFileSync(resolve(projectRoot, '.env'), 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [key, ...rest] = trimmed.split('=');
  env[key.trim()] = rest.join('=').trim();
}

const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

// Get SQL file from command line args
const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('Usage: node execute_sql.mjs <path-to-sql-file>');
  console.error('  e.g.: node supabase/execute_sql.mjs supabase/migrations/001_initial_schema.sql');
  process.exit(1);
}

const sqlPath = resolve(process.cwd(), sqlFile);
console.log(`Reading SQL from: ${sqlPath}`);
const sql = readFileSync(sqlPath, 'utf8');

// Split SQL into individual statements for execution
// We'll try executing the whole file first, then fall back to statement-by-statement
async function executeSql(query) {
  // Try pg-meta query endpoint (available on Supabase hosted projects)
  const url = `${SUPABASE_URL}/pg/query`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'x-connection-encrypted': 'true',
    },
    body: JSON.stringify({ query }),
  });

  if (response.ok) {
    return { success: true, data: await response.json() };
  }

  // Try alternative endpoint
  const url2 = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
  const response2 = await fetch(url2, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({ sql_string: query }),
  });

  if (response2.ok) {
    return { success: true, data: await response2.json() };
  }

  const text = await response.text();
  const text2 = await response2.text();
  return { success: false, error: `pg endpoint: ${response.status} ${text}\nrpc endpoint: ${response2.status} ${text2}` };
}

console.log(`\nExecuting SQL against: ${SUPABASE_URL}`);
console.log('---');

const result = await executeSql(sql);

if (result.success) {
  console.log('SUCCESS: SQL executed successfully.');
  if (result.data) {
    console.log('Result:', JSON.stringify(result.data, null, 2).slice(0, 500));
  }
} else {
  console.error('Could not execute SQL via API endpoints.');
  console.error(result.error);
  console.log('\n=========================================');
  console.log('MANUAL EXECUTION REQUIRED');
  console.log('=========================================');
  console.log('');
  console.log('Please run the SQL using one of these methods:');
  console.log('');
  console.log('1. Supabase Dashboard SQL Editor (fastest):');
  console.log(`   https://supabase.com/dashboard/project/wxafzdetynntbntiywtq/sql/new`);
  console.log(`   Paste contents of: ${sqlPath}`);
  console.log('');
  console.log('2. Supabase CLI (if linked):');
  console.log('   supabase db push');
  console.log('');
  console.log('3. Copy SQL to clipboard (macOS):');
  console.log(`   cat "${sqlPath}" | pbcopy`);
  console.log('   Then paste into SQL Editor');
  process.exit(1);
}
