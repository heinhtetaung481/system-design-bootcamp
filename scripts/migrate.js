#!/usr/bin/env node
/**
 * Database migration runner for Supabase (PostgreSQL).
 *
 * Migration files live in:  supabase/migrations/<version>_<name>.sql  (apply)
 * Rollback files live in:   supabase/rollbacks/<version>_<name>.sql   (undo)
 *
 * File naming convention:   YYYYMMDDHHMMSS_description.sql
 * Applied history is stored in the `schema_migrations` table in Supabase.
 *
 * Usage:
 *   DATABASE_URL=<url> node scripts/migrate.js status         # show applied / pending
 *   DATABASE_URL=<url> node scripts/migrate.js up             # apply all pending
 *   DATABASE_URL=<url> node scripts/migrate.js down           # rollback last migration
 *   DATABASE_URL=<url> node scripts/migrate.js down 3        # rollback last 3 migrations
 *
 * The DATABASE_URL must be the direct (non-pooler) Supabase connection string, e.g.:
 *   postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
 */

'use strict';

const { Client } = require('pg');
const fs   = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.resolve(__dirname, '../supabase/migrations');
const ROLLBACKS_DIR  = path.resolve(__dirname, '../supabase/rollbacks');

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

async function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('Error: DATABASE_URL environment variable is not set.');
    console.error(
      'Set it to your Supabase direct connection string:\n' +
      '  postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres'
    );
    process.exit(1);
  }
  const sslNoVerify = process.env.DATABASE_SSL_NO_VERIFY === '1';
  const client = new Client({
    connectionString: url,
    ssl: sslNoVerify ? { rejectUnauthorized: false } : true,
    family: 4, // force IPv4 — runners/envs without IPv6 routing get ENETUNREACH otherwise
  });
  await client.connect();
  return client;
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT        PRIMARY KEY,
      name       TEXT        NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT now()
    );
  `);
}

async function appliedVersions(client) {
  const { rows } = await client.query(
    'SELECT version, name, applied_at FROM schema_migrations ORDER BY version ASC'
  );
  return rows; // [{ version, name, applied_at }]
}

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

function listSqlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // lexicographic = chronological with timestamp prefix
}

function versionOf(filename) {
  return filename.split('_')[0];
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdStatus(client) {
  const applied   = await appliedVersions(client);
  const appliedSet = new Set(applied.map((r) => r.version));
  const files     = listSqlFiles(MIGRATIONS_DIR);
  const pending   = files.filter((f) => !appliedSet.has(versionOf(f)));

  console.log('\nSchema migration status');
  console.log('=======================');

  if (applied.length > 0) {
    console.log('\n  Applied:');
    for (const row of applied) {
      const ts = new Date(row.applied_at).toISOString();
      console.log(`    ✓  [${row.version}] ${row.name}  (applied ${ts})`);
    }
  } else {
    console.log('\n  Applied:  (none)');
  }

  if (pending.length > 0) {
    console.log('\n  Pending:');
    for (const f of pending) {
      console.log(`    ○  ${f}`);
    }
  } else {
    console.log('\n  Pending:  (none)');
  }

  console.log('');
}

async function cmdUp(client) {
  const applied   = await appliedVersions(client);
  const appliedSet = new Set(applied.map((r) => r.version));
  const files     = listSqlFiles(MIGRATIONS_DIR);
  const pending   = files.filter((f) => !appliedSet.has(versionOf(f)));

  if (pending.length === 0) {
    console.log('Nothing to migrate — database is up to date.');
    return;
  }

  console.log(`Applying ${pending.length} pending migration(s)…\n`);

  for (const file of pending) {
    const version = versionOf(file);
    const sqlPath = path.join(MIGRATIONS_DIR, file);
    const sql     = fs.readFileSync(sqlPath, 'utf8');

    process.stdout.write(`  → ${file} … `);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
        [version, file]
      );
      await client.query('COMMIT');
      console.log('done ✓');
    } catch (err) {
      await client.query('ROLLBACK');
      console.log('FAILED ✗');
      throw new Error(`Migration ${file} failed: ${err.message}`);
    }
  }

  console.log(`\nAll migrations applied successfully.`);
}

async function cmdDown(client, steps) {
  const applied = await appliedVersions(client);

  if (applied.length === 0) {
    console.log('Nothing to roll back — no migrations have been applied.');
    return;
  }

  const toRollback = applied.slice(-steps).reverse(); // most-recent first

  console.log(`Rolling back ${toRollback.length} migration(s)…\n`);

  for (const row of toRollback) {
    const rollbackPath = path.join(ROLLBACKS_DIR, row.name);

    if (!fs.existsSync(rollbackPath)) {
      throw new Error(
        `Rollback file not found: ${rollbackPath}\n` +
        `Create supabase/rollbacks/${row.name} to enable rollback.`
      );
    }

    const sql = fs.readFileSync(rollbackPath, 'utf8');

    process.stdout.write(`  ← ${row.name} … `);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        'DELETE FROM schema_migrations WHERE version = $1',
        [row.version]
      );
      await client.query('COMMIT');
      console.log('done ✓');
    } catch (err) {
      await client.query('ROLLBACK');
      console.log('FAILED ✗');
      throw new Error(`Rollback of ${row.name} failed: ${err.message}`);
    }
  }

  console.log(`\nRollback completed successfully.`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  const [, , command = 'up', arg] = process.argv;

  const client = await connect();

  try {
    await ensureMigrationsTable(client);

    switch (command) {
      case 'up':
        await cmdUp(client);
        break;

      case 'down': {
        const steps = arg ? parseInt(arg, 10) : 1;
        if (isNaN(steps) || steps < 1) {
          console.error('Error: steps argument must be a positive integer.');
          process.exit(1);
        }
        await cmdDown(client, steps);
        break;
      }

      case 'status':
        await cmdStatus(client);
        break;

      default:
        console.error(`Unknown command: "${command}"`);
        console.error('Usage: node scripts/migrate.js [up | down [N] | status]');
        process.exit(1);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(`\nMigration error: ${err.message}`);
  process.exit(1);
});
