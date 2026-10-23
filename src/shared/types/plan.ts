export const PLAN_MODULE_IDS = ['inventory', 'finance'] as const
export type PlanModuleId = (typeof PLAN_MODULE_IDS)[number]

export const CORE_MODULE_IDS = ['settings'] as const
export type CoreModuleId = (typeof CORE_MODULE_IDS)[number]

export type PlanId = 'local' | 'pro' | 'trial'

export interface PlanModuleEntitlement {
  enabled: boolean
}

export interface PlanLimits {
  users: number | null
  inventoryItems: number | null
  monthlyTransactions: number | null
}

export interface PlanFeatures {
  advancedReports: boolean
  multiUser: boolean
  cloudBackup: boolean
  automaticUpdates: boolean
  dataExport: boolean
}

export interface PlanConfig {
  schemaVersion: 1
  plan: PlanId
  issuedTo: string | null
  issuedAt: string | null
  modules: Record<PlanModuleId, PlanModuleEntitlement>
  limits: PlanLimits
  features: PlanFeatures
}

export const DEFAULT_PLAN: PlanConfig = {
  schemaVersion: 1,
  plan: 'local',
  issuedTo: null,
  issuedAt: null,
  modules: {
    inventory: { enabled: true },
    finance: { enabled: true }
  },
  limits: {
    users: 3,
    inventoryItems: null,
    monthlyTransactions: null
  },
  features: {
    advancedReports: false,
    multiUser: false,
    cloudBackup: false,
    automaticUpdates: true,
    dataExport: true
  }
}

export const PLAN_LABELS: Record<PlanId, { name: string; tagline: string }> = {
  local: { name: 'Plan Local', tagline: 'Licencia de pago único' },
  pro: { name: 'Plan Pro', tagline: 'Funciones avanzadas' },
  trial: { name: 'Prueba', tagline: 'Evaluación temporal' }
}

export const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
  advancedReports: 'Reportes avanzados',
  multiUser: 'Múltiples usuarios',
  cloudBackup: 'Respaldo en la nube',
  automaticUpdates: 'Actualizaciones automáticas',
  dataExport: 'Exportación de datos'
}

export function isPlanModuleEnabled(plan: PlanConfig, moduleId: PlanModuleId): boolean {
  return plan.modules[moduleId]?.enabled ?? false
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function asLimit(value: unknown, fallback: number | null): number | null {
  if (value === null) return null
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return Math.floor(value)
  return fallback
}

function asNullableText(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

export function normalizePlan(value: unknown): PlanConfig {
  const raw = isRecord(value) ? value : {}
  const modules = isRecord(raw.modules) ? raw.modules : {}
  const inventory = isRecord(modules.inventory) ? modules.inventory : {}
  const finance = isRecord(modules.finance) ? modules.finance : {}
  const limits = isRecord(raw.limits) ? raw.limits : {}
  const features = isRecord(raw.features) ? raw.features : {}
  const plan: PlanId = raw.plan === 'pro' || raw.plan === 'trial' || raw.plan === 'local' ? raw.plan : DEFAULT_PLAN.plan

  return {
    schemaVersion: 1,
    plan,
    issuedTo: asNullableText(raw.issuedTo),
    issuedAt: asNullableText(raw.issuedAt),
    modules: {
      inventory: {
        enabled: asBoolean(inventory.enabled, DEFAULT_PLAN.modules.inventory.enabled)
      },
      finance: {
        enabled: asBoolean(finance.enabled, DEFAULT_PLAN.modules.finance.enabled)
      }
    },
    limits: {
      users: asLimit(limits.users, DEFAULT_PLAN.limits.users),
      inventoryItems: asLimit(limits.inventoryItems, DEFAULT_PLAN.limits.inventoryItems),
      monthlyTransactions: asLimit(limits.monthlyTransactions, DEFAULT_PLAN.limits.monthlyTransactions)
    },
    features: {
      advancedReports: asBoolean(features.advancedReports, DEFAULT_PLAN.features.advancedReports),
      multiUser: asBoolean(features.multiUser, DEFAULT_PLAN.features.multiUser),
      cloudBackup: asBoolean(features.cloudBackup, DEFAULT_PLAN.features.cloudBackup),
      automaticUpdates: asBoolean(features.automaticUpdates, DEFAULT_PLAN.features.automaticUpdates),
      dataExport: asBoolean(features.dataExport, DEFAULT_PLAN.features.dataExport)
    }
  }
}
