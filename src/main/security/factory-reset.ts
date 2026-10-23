import { closeSync, existsSync, openSync, renameSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { appMigrations } from '../../server/db/migrations'
import { runMigrations } from '../../server/db/migration-runner'

export interface FactoryResetOptions {
  dataDir: string
  onBeforeReset: () => Promise<void> | void
}

export async function performFactoryReset(options: FactoryResetOptions): Promise<void> {
  await options.onBeforeReset()

  const dbDir = join(options.dataDir, 'data')
  const dbFile = join(dbDir, 'minierp.db')
  const walFile = join(dbDir, 'minierp.db-wal')
  const shmFile = join(dbDir, 'minierp.db-shm')

  const removeIfExists = (path: string) => {
    if (existsSync(path)) {
      try {
        unlinkSync(path)
      } catch {
        try {
          const tmp = `${path}.old-${Date.now()}`
          renameSync(path, tmp)
          unlinkSync(tmp)
        } catch {
          // Último recurso: ignorar
        }
      }
    }
  }

  removeIfExists(dbFile)
  removeIfExists(walFile)
  removeIfExists(shmFile)

  const database = new DatabaseSync(dbFile)
  try {
    database.exec('PRAGMA journal_mode = WAL')
    database.exec('PRAGMA foreign_keys = ON')
    database.exec('PRAGMA busy_timeout = 5000')
    runMigrations(database, appMigrations)
  } finally {
    try {
      database.close()
    } catch {
      // Ignorar
    }
  }
}
