import type { DatabaseSync } from 'node:sqlite'

export function withTransaction<T>(database: DatabaseSync, work: () => T): T {
  if (database.isTransaction) {
    return work()
  }

  database.exec('BEGIN IMMEDIATE')
  try {
    const result = work()
    database.exec('COMMIT')
    return result
  } catch (error) {
    try {
      database.exec('ROLLBACK')
    } catch {
      // Keep the original error from the failed operation.
    }
    throw error
  }
}
