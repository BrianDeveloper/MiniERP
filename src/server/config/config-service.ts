import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  DEFAULT_BUSINESS,
  getCurrency,
  normalizeBusiness,
  type BusinessProfile,
  type BusinessUpdateInput
} from '../../shared/types/business'
import { DEFAULT_PLAN, normalizePlan, type PlanConfig } from '../../shared/types/plan'
import type { SystemInfo } from '../../shared/types/system'

export class ConfigService {
  readonly configDir: string
  readonly businessFile: string
  readonly planFile: string

  private business: BusinessProfile = { ...DEFAULT_BUSINESS }
  private plan: PlanConfig = { ...DEFAULT_PLAN }

  constructor(
    private readonly dataDir: string,
    private readonly defaultsDir: string
  ) {
    this.configDir = join(dataDir, 'config')
    this.businessFile = join(this.configDir, 'business.json')
    this.planFile = join(this.configDir, 'plan.json')
  }

  async init(): Promise<void> {
    await mkdir(this.configDir, { recursive: true })
    this.business = await this.loadOrSeed('business.json', normalizeBusiness, DEFAULT_BUSINESS)
    this.plan = await this.loadOrSeed('plan.json', normalizePlan, DEFAULT_PLAN)
  }

  getBusiness(): BusinessProfile {
    return structuredClone(this.business)
  }

  getPlan(): PlanConfig {
    return structuredClone(this.plan)
  }

  async updateBusiness(input: BusinessUpdateInput): Promise<BusinessProfile> {
    const currency = getCurrency(input.currency)
    const updated: BusinessProfile = {
      schemaVersion: 1,
      name: input.name.trim(),
      rif: input.rif.trim(),
      currency: currency.code,
      locale: currency.locale,
      address: input.address.trim(),
      phone: input.phone.trim(),
      updatedAt: new Date().toISOString()
    }

    await this.writeJson(this.businessFile, updated)
    this.business = updated
    return structuredClone(updated)
  }

  getSystemInfo(appVersion: string, platform: string, databaseFile: string): SystemInfo {
    return {
      appVersion,
      platform,
      dataDir: this.dataDir,
      configDir: this.configDir,
      businessFile: this.businessFile,
      planFile: this.planFile,
      databaseFile
    }
  }

  private async loadOrSeed<T>(
    fileName: string,
    normalize: (value: unknown) => T,
    fallback: T
  ): Promise<T> {
    const target = join(this.configDir, fileName)

    try {
      const raw = await readFile(target, 'utf8')
      return normalize(JSON.parse(raw))
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code !== 'ENOENT') {
        await this.backupCorrupt(target)
      }
    }

    try {
      const raw = await readFile(join(this.defaultsDir, fileName), 'utf8')
      const seeded = normalize(JSON.parse(raw))
      await this.writeJson(target, seeded)
      return seeded
    } catch {
      const seeded = normalize(fallback)
      await this.writeJson(target, seeded)
      return seeded
    }
  }

  private async backupCorrupt(target: string): Promise<void> {
    try {
      await rename(target, `${target}.corrupt-${Date.now()}`)
    } catch {
      // The original file stays in place if the backup cannot be created.
    }
  }

  private async writeJson(target: string, value: unknown): Promise<void> {
    const temporary = `${target}.tmp`
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
    await rename(temporary, target)
  }
}
