import type { Migration } from '../../db/migration-runner'

export const settingsMigrations: Migration[] = [
  {
    id: 'settings-001-app-settings',
    up: `CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exchange_rate_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rate REAL NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('bcv', 'manual')),
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_exchange_rate_history_fetched_at ON exchange_rate_history(fetched_at DESC);`
  }
]
