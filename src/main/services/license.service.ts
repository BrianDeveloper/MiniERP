import { app, dialog } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import type { LicenseFile, LicenseState } from '../../shared/types/license'

function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isNotExpired(expiresAt: string): boolean {
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const expires = new Date(`${expiresAt}T00:00:00`)
  if (Number.isNaN(expires.getTime())) return false
  return expires >= startOfToday
}

export class LicenseService {
  private state: LicenseState = {
    loaded: false,
    filePath: null,
    data: null,
    validUntil: null,
    error: null
  }

  constructor(private readonly database: DatabaseSync) {
    this.ensureTable()
    void this.load()
  }

  private ensureTable() {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS app_license (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        data TEXT,
        file_path TEXT,
        updated_at TEXT
      )
    `)
  }

  private async saveCopy(data: LicenseFile) {
    try {
      const dir = path.join(app.getPath('userData'), 'license')
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(path.join(dir, 'license.json'), JSON.stringify(data, null, 2), 'utf8')
    } catch {
      // ignore
    }
  }

  private validate(parsed: unknown): LicenseFile {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Formato de licencia inválido.')
    }

    const obj = parsed as Record<string, unknown>

    if (typeof obj.clientName !== 'string' || obj.clientName.trim() === '') {
      throw new Error('La licencia debe incluir "clientName".')
    }

    if (typeof obj.rif !== 'string' || obj.rif.trim() === '') {
      throw new Error('La licencia debe incluir "rif".')
    }

    if (!isValidDateString(obj.expiresAt)) {
      throw new Error('La licencia debe incluir "expiresAt" con formato YYYY-MM-DD.')
    }

    if (!isNotExpired(obj.expiresAt)) {
      throw new Error('La licencia se encuentra vencida.')
    }

    if (!obj.modules || typeof obj.modules !== 'object') {
      throw new Error('La licencia debe contener un objeto "modules".')
    }

    const modules = obj.modules as Record<string, unknown>
    if (typeof modules.inventory !== 'boolean' || typeof modules.finances !== 'boolean') {
      throw new Error('Los módulos "inventory" y "finances" deben ser booleanos.')
    }

    return {
      clientName: obj.clientName.trim(),
      rif: obj.rif.trim(),
      expiresAt: obj.expiresAt,
      modules: {
        inventory: modules.inventory,
        finances: modules.finances
      }
    }
  }

  private async load() {
    const row = this.database.prepare('SELECT data, file_path FROM app_license WHERE id = 1').get() as
      | { data: string; file_path: string }
      | undefined

    if (!row?.data) {
      this.state = { loaded: false, filePath: null, data: null, validUntil: null, error: null }
      return
    }

    try {
      const parsed = JSON.parse(row.data)
      const validated = this.validate(parsed)
      this.state = {
        loaded: true,
        filePath: row.file_path || null,
        data: validated,
        validUntil: validated.expiresAt,
        error: null
      }
    } catch (error) {
      this.state = {
        loaded: false,
        filePath: row.file_path || null,
        data: null,
        validUntil: null,
        error: error instanceof Error ? error.message : 'Licencia inválida o vencida'
      }
    }
  }

  getState(): LicenseState {
    return this.state
  }

  async import(): Promise<LicenseState> {
    const result = await dialog.showOpenDialog({
      title: 'Seleccionar archivo de licencia',
      filters: [
        { name: 'Archivos de licencia', extensions: ['json', 'key', 'lic'] },
        { name: 'Todos los archivos', extensions: ['*'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return this.state
    }

    const filePath = result.filePaths[0]
    const buffer = await fs.readFile(filePath, 'utf8')
    let parsed: unknown

    try {
      parsed = JSON.parse(buffer)
    } catch {
      throw new Error('El archivo de licencia no es un JSON válido.')
    }

    const validated = this.validate(parsed)

    const now = new Date().toISOString()
    this.database
      .prepare(
        `INSERT INTO app_license (id, data, file_path, updated_at)
         VALUES (1, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET data = excluded.data, file_path = excluded.file_path, updated_at = excluded.updated_at`
      )
      .run(JSON.stringify(validated), filePath, now)

    await this.saveCopy(validated)

    this.state = {
      loaded: true,
      filePath,
      data: validated,
      validUntil: validated.expiresAt,
      error: null
    }

    return this.state
  }
}
