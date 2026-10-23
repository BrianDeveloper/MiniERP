import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { app, safeStorage } from 'electron'

export class PinStore {
  private readonly filePath: string

  constructor(dataDir?: string) {
    const baseDir = dataDir ?? app.getPath('userData')
    const secDir = join(baseDir, 'security')
    mkdirSync(secDir, { recursive: true })
    this.filePath = join(secDir, 'pin.enc')
  }

  hasPin(): boolean {
    return existsSync(this.filePath)
  }

  setPin(pin: string): void {
    const plain = Buffer.from(pin.trim(), 'utf8')
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('safeStorage_no_disponible')
    }
    const encrypted = safeStorage.encryptString(plain.toString('utf8'))
    writeFileSync(this.filePath, encrypted)
  }

  verifyPin(pin: string): boolean {
    if (!this.hasPin()) return false
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('safeStorage_no_disponible')
    }
    const encrypted = readFileSync(this.filePath)
    try {
      const decrypted = safeStorage.decryptString(encrypted)
      return decrypted === pin.trim()
    } catch {
      return false
    }
  }

  removePin(): void {
    if (existsSync(this.filePath)) {
      unlinkSync(this.filePath)
    }
  }

  getFilePath(): string {
    return this.filePath
  }
}
