import { copyFile, mkdir, readdir, stat, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

export interface BackupEntry {
  path: string
  name: string
  sizeBytes: number
  createdAt: string
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function quoteSqlPath(filePath: string): string {
  return filePath.replace(/'/g, "''")
}

function databasePath(dataDir: string): string {
  return join(dataDir, 'data', 'minierp.db')
}

function backupsDir(dataDir: string): string {
  return join(dataDir, 'backups')
}

export function getBackupsDir(dataDir: string): string {
  return backupsDir(dataDir)
}

function verifyDatabase(filePath: string): void {
  const database = new DatabaseSync(filePath, { readOnly: true })
  try {
    const result = database.prepare('PRAGMA integrity_check').get() as
      | { integrity_check?: string }
      | undefined
    if (result?.integrity_check !== 'ok') {
      throw new Error(`El respaldo no superó la verificación de integridad.`)
    }
  } finally {
    database.close()
  }
}

export async function createBackup(dataDir: string): Promise<BackupEntry> {
  const source = databasePath(dataDir)
  if (!existsSync(source)) {
    throw new Error('No se encontró la base de datos para respaldar.')
  }

  const outputDir = backupsDir(dataDir)
  await mkdir(outputDir, { recursive: true })

  const destination = join(outputDir, `minierp-backup-${timestamp()}.db`)
  const database = new DatabaseSync(source)
  try {
    database.exec('PRAGMA busy_timeout = 5000')
    database.exec(`VACUUM INTO '${quoteSqlPath(destination)}'`)
  } finally {
    database.close()
  }

  verifyDatabase(destination)

  const info = await stat(destination)
  return {
    path: destination,
    name: destination.split(/[\\/]/).pop() ?? destination,
    sizeBytes: info.size,
    createdAt: info.mtime.toISOString()
  }
}

export async function listBackups(dataDir: string): Promise<BackupEntry[]> {
  const outputDir = backupsDir(dataDir)
  if (!existsSync(outputDir)) return []

  const entries = await readdir(outputDir)
  const result: BackupEntry[] = []

  for (const name of entries) {
    if (!name.toLowerCase().endsWith('.db')) continue
    const fullPath = join(outputDir, name)
    try {
      const info = await stat(fullPath)
      result.push({
        path: fullPath,
        name,
        sizeBytes: info.size,
        createdAt: info.mtime.toISOString()
      })
    } catch {
      continue
    }
  }

  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function restoreBackup(
  dataDir: string,
  backupPath: string,
  onBeforeRestore: () => Promise<void>
): Promise<void> {
  if (!existsSync(backupPath)) {
    throw new Error('El archivo de respaldo no existe.')
  }

  verifyDatabase(backupPath)
  await onBeforeRestore()

  const target = databasePath(dataDir)
  await mkdir(join(dataDir, 'data'), { recursive: true })

  if (existsSync(target)) {
    await copyFile(target, `${target}.pre-restore-${timestamp()}`)
  }

  for (const suffix of ['-wal', '-shm']) {
    const sidecar = `${target}${suffix}`
    if (existsSync(sidecar)) {
      await unlink(sidecar).catch(() => undefined)
    }
  }

  await copyFile(backupPath, target)
  verifyDatabase(target)
}
