import { app, dialog } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import type { LicenseFile, LicenseState } from '../../shared/types/license'

export class LicenseService {
  private state: LicenseState = {
    loaded: false,
    filePath: null,
    data: null,
    validUntil: null
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

  private async load() {
    const row = this.database.prepare('SELECT data, file_path FROM app_license WHERE id = 1').get() as
      | { data: string; file_path: string }
      | undefined
    if (row?.data) {
      try {
        const parsed = JSON.parse(row.data) as LicenseFile
        if (parsed && typeof parsed === 'object' && parsed.modules) {
          this.state = {
            loaded: true,
            filePath: row.file_path || null,
            data: parsed,
            validUntil: parsed.expirationDate || null
          }
        }
      } catch {
        // ignore
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
    let parsed: LicenseFile

    try {
      parsed = JSON.parse(buffer)
    } catch (error) {
      throw new Error('El archivo de licencia no es un JSON válido.')
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Formato de licencia inválido.')
    }

    if (!parsed.modules || typeof parsed.modules !== 'object') {
      throw new Error('La licencia debe contener un objeto "modules".')
    }

    const now = new Date().toISOString()
    this.database
      .prepare(
        `INSERT INTO app_license (id, data, file_path, updated_at)
         VALUES (1, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET data = excluded.data, file_path = excluded.file_path, updated_at = excluded.updated_at`
      )
      .run(JSON.stringify(parsed), filePath, now)

    this.state = {
      loaded: true,
      filePath,
      data: parsed,
      validUntil: parsed.expirationDate || null
    }

    return this.state
  }
}
