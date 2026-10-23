import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { runMigrations, type Migration } from './migration-runner'

export function openDatabase(filePath: string, migrations: Migration[]): DatabaseSync {
  mkdirSync(dirname(filePath), { recursive: true })

  const database = new DatabaseSync(filePath)
  database.exec('PRAGMA journal_mode = WAL')
  database.exec('PRAGMA foreign_keys = ON')
  database.exec('PRAGMA busy_timeout = 5000')

  try {
    runMigrations(database, migrations)
  } catch (error) {
    database.close()
    throw error
  }

  return database
}
