import type { DatabaseSync } from 'node:sqlite'

export interface Migration {
  id: string
  up: string
}

export function runMigrations(database: DatabaseSync, migrations: Migration[]): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `)

  const applied = new Set(
    database
      .prepare('SELECT id FROM schema_migrations')
      .all()
      .map((row) => String(row.id))
  )
  const record = database.prepare(
    'INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)'
  )

  for (const migration of migrations) {
    if (applied.has(migration.id)) continue

    database.exec('BEGIN IMMEDIATE')
    try {
      database.exec(migration.up)
      record.run(migration.id, new Date().toISOString())
      database.exec('COMMIT')
    } catch (error) {
      try {
        database.exec('ROLLBACK')
      } catch {
        // The original migration error is more useful than a rollback failure.
      }
      throw error
    }
  }
}
