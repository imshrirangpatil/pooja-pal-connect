import fs from 'fs';
import path from 'path';
import { pool, query } from '../config/db';

/**
 * Minimal forward-only migration runner.
 * Applies every *.sql in migrations/ (sorted) that hasn't been recorded
 * in the schema_migrations table yet. Idempotent — safe to re-run.
 */
async function run() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const { rowCount } = await query('SELECT 1 FROM schema_migrations WHERE filename = $1', [file]);
    if (rowCount && rowCount > 0) {
      console.log(`• skip   ${file} (already applied)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`✓ apply  ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`✗ failed ${file}`);
      throw err;
    } finally {
      client.release();
    }
  }
  console.log('Migrations complete.');
}

run()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    pool.end();
    process.exit(1);
  });
