import { mkdirSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'

export class FileLogger {
  private logDir: string
  private logFile: string

  constructor(dataDir: string) {
    this.logDir = join(dataDir, 'logs')
    mkdirSync(this.logDir, { recursive: true })
    const date = new Date().toISOString().slice(0, 10)
    this.logFile = join(this.logDir, `minierp-${date}.log`)
  }

  private write(level: string, message: string, meta?: unknown): void {
    try {
      const timestamp = new Date().toISOString()
      const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
      appendFileSync(this.logFile, `[${timestamp}] [${level}] ${message}${metaStr}\n`)
    } catch {
      // ignore logging errors
    }
  }

  info(message: string, meta?: unknown): void {
    this.write('INFO', message, meta)
    console.log(`[minierp] ${message}`)
  }

  warn(message: string, meta?: unknown): void {
    this.write('WARN', message, meta)
    console.warn(`[minierp] ${message}`)
  }

  error(message: string, meta?: unknown): void {
    this.write('ERROR', message, meta)
    console.error(`[minierp] ${message}`)
  }
}

export function createLogger(dataDir: string): FileLogger {
  return new FileLogger(dataDir)
}
