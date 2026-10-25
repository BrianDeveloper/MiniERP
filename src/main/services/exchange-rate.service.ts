import axios from 'axios'
import * as cheerio from 'cheerio'
import type { DatabaseSync } from 'node:sqlite'
import type { ExchangeRateSource, ExchangeRateState } from '../../shared/types/exchange-rate'

export class ExchangeRateService {
  private readonly timeoutMs = 8000
  private readonly userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

  constructor(private readonly database: DatabaseSync) {}

  getState(): ExchangeRateState {
    const rate = this.getSetting('exchange_rate')
    const source = (this.getSetting('rate_source') as ExchangeRateSource | null) ?? 'manual'
    const lastUpdated = this.getSetting('exchange_rate_updated_at')

    if (!rate) {
      return {
        rate: 0,
        source: 'manual',
        lastUpdated: null,
        isStale: true,
        updatedToday: false
      }
    }

    const rateNum = Number(rate)
    const now = new Date()
    const updatedDate = lastUpdated ? new Date(lastUpdated) : null

    const updatedToday =
      updatedDate !== null &&
      updatedDate.getFullYear() === now.getFullYear() &&
      updatedDate.getMonth() === now.getMonth() &&
      updatedDate.getDate() === now.getDate()

    const isStale = !updatedToday || source === 'manual'

    return {
      rate: Number(rateNum.toFixed(2)),
      source,
      lastUpdated,
      isStale,
      updatedToday
    }
  }

  async fetchAuto(): Promise<ExchangeRateState> {
    try {
      const rate = await this.fetchFromBCV()
      if (rate && rate > 0) {
        this.saveRate(rate, 'bcv')
        return this.getState()
      }
      return this.getState()
    } catch (error) {
      console.warn('[ExchangeRate] Falló consulta BCV, usando última tasa guardada:', (error as Error).message)
      return this.getState()
    }
  }

  updateManual(rate: number): ExchangeRateState {
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
      throw new Error('La tasa manual debe ser un número mayor a 0')
    }

    const normalized = Math.round(rate * 100) / 100
    this.saveRate(normalized, 'manual')
    return this.getState()
  }

  async initialize(): Promise<ExchangeRateState> {
    const current = this.getState()
    if (!current.lastUpdated || !current.updatedToday) {
      try {
        const fresh = await this.fetchFromBCV()
        if (fresh && fresh > 0) {
          this.saveRate(fresh, 'bcv')
          return this.getState()
        }
      } catch {
        // Silencioso
      }
    }
    return this.getState()
  }

  private async fetchFromBCV(): Promise<number | null> {
    try {
      const res = await axios.get('https://ve.dolarapi.com/v1/dolares/oficial', {
        timeout: this.timeoutMs,
        headers: { 'User-Agent': this.userAgent, Accept: 'application/json' }
      })
      const data = res.data
      const value = data?.promedio ?? data?.precio ?? data?.rate ?? data?.valor
      if (typeof value === 'number' && value > 0) return Math.round(value * 100) / 100
    } catch {
      // continue
    }

    try {
      const res = await axios.get('https://www.bcv.org.ve/', {
        timeout: this.timeoutMs,
        headers: { 'User-Agent': this.userAgent, Accept: 'text/html' },
        responseType: 'text'
      })
      const $ = cheerio.load(res.data)
      const candidates = [
        '#dolar .centrado strong',
        '#dolar strong',
        '.dolar .centrado',
        'div#dolar > div > div > strong'
      ]
      for (const sel of candidates) {
        const text = $(sel).first().text().replace(/\s+/g, ' ').trim()
        if (!text) continue
        const match = text.match(/([0-9]+[.,][0-9]+)/)
        if (match) {
          const num = parseFloat(match[1].replace(',', '.'))
          if (Number.isFinite(num) && num > 0) return Math.round(num * 100) / 100
        }
      }
    } catch {
      // continue
    }

    return null
  }

  private saveRate(rate: number, source: ExchangeRateSource): void {
    const now = new Date().toISOString()
    const stmt = this.database.prepare(`
      INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `)
    stmt.run('exchange_rate', String(rate), now)
    stmt.run('rate_source', source, now)
    stmt.run('exchange_rate_updated_at', now, now)

    this.database
      .prepare('INSERT INTO exchange_rate_history (rate, source, fetched_at) VALUES (?, ?, ?)')
      .run(rate, source, now)
  }

  private getSetting(key: string): string | null {
    const row = this.database.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as
      | { value: string }
      | undefined
    return row?.value ?? null
  }
}
