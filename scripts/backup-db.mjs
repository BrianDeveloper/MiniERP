import { existsSync, mkdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

function readOption(name) {
  const index = process.argv.indexOf(name)
  if (index === -1) return undefined
  const value = process.argv[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`Falta el valor para ${name}.`)
  }
  return value
}

function defaultDataDir() {
  if (process.platform === 'win32' && process.env.APPDATA) {
    return join(process.env.APPDATA, 'MiniERP')
  }
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'MiniERP')
  }
  return join(homedir(), '.config', 'MiniERP')
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function quoteSqlPath(filePath) {
  return filePath.replace(/'/g, "''")
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Uso: pnpm backup [opciones]

Opciones:
  --data-dir <ruta>   Carpeta de datos de MiniERP.
  --output <ruta>     Carpeta donde se guardará el respaldo.
  -h, --help          Muestra esta ayuda.

También puedes definir MINIERP_DATA_DIR.`)
  process.exit(0)
}

try {
  const dataDir = resolve(
    readOption('--data-dir') ?? process.env.MINIERP_DATA_DIR ?? defaultDataDir()
  )
  const source = join(dataDir, 'data', 'minierp.db')

  if (!existsSync(source)) {
    throw new Error(`No se encontró la base de datos en ${source}.`)
  }

  const outputDir = resolve(readOption('--output') ?? join(dataDir, 'backups'))
  mkdirSync(outputDir, { recursive: true })

  const destination = join(outputDir, `minierp-backup-${timestamp()}.db`)
  const database = new DatabaseSync(source)
  database.exec('PRAGMA busy_timeout = 5000')
  database.exec(`VACUUM INTO '${quoteSqlPath(destination)}'`)
  database.close()

  const backup = new DatabaseSync(destination, { readOnly: true })
  const integrity = backup.prepare('PRAGMA integrity_check').get()
  backup.close()

  if (integrity.integrity_check !== 'ok') {
    throw new Error(`El respaldo no superó la verificación: ${integrity.integrity_check}`)
  }

  const sizeKb = (statSync(destination).size / 1024).toFixed(1)
  console.log(`Respaldo creado: ${destination}`)
  console.log(`Origen: ${source}`)
  console.log(`Tamaño: ${sizeKb} KB`)
} catch (error) {
  console.error(`No se pudo crear el respaldo: ${error instanceof Error ? error.message : error}`)
  process.exit(1)
}
