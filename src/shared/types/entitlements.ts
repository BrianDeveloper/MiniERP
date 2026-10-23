export const ENTITLEMENT_MODULE_IDS = ['inventory', 'finance', 'settings'] as const
export type EntitlementModuleId = (typeof ENTITLEMENT_MODULE_IDS)[number]

export interface InventoryEntitlements {
  createProduct: boolean
  editProduct: boolean
  archiveProduct: boolean
  stockMovement: boolean
  stockAdjustment: boolean
  lowStockAlerts: boolean
  importCsv: boolean
  exportCsv: boolean
  printLabels: boolean
  barcodes: boolean
}

export interface FinanceEntitlements {
  createManual: boolean
  editManual: boolean
  deleteManual: boolean
  paymentMethods: boolean
  dateRangeCustom: boolean
  exportCsv: boolean
  exportPdf: boolean
  receipts: boolean
}

export interface SettingsEntitlements {
  backupRestore: boolean
  pinSecurity: boolean
  factoryReset: boolean
  updates: boolean
  licensingPanel: boolean
}

export interface ModuleFeatureMap {
  inventory: InventoryEntitlements
  finance: FinanceEntitlements
  settings: SettingsEntitlements
}

export interface Entitlements {
  schemaVersion: 1
  source: 'local' | 'license'
  locked: boolean
  modules: Record<EntitlementModuleId, { enabled: boolean }>
  features: ModuleFeatureMap
  updatedAt: string | null
}

export const DEFAULT_ENTITLEMENTS: Entitlements = {
  schemaVersion: 1,
  source: 'local',
  locked: false,
  modules: {
    inventory: { enabled: true },
    finance: { enabled: true },
    settings: { enabled: true }
  },
  features: {
    inventory: {
      createProduct: true,
      editProduct: true,
      archiveProduct: true,
      stockMovement: true,
      stockAdjustment: true,
      lowStockAlerts: true,
      importCsv: false,
      exportCsv: false,
      printLabels: false,
      barcodes: false
    },
    finance: {
      createManual: true,
      editManual: false,
      deleteManual: true,
      paymentMethods: false,
      dateRangeCustom: true,
      exportCsv: false,
      exportPdf: false,
      receipts: false
    },
    settings: {
      backupRestore: true,
      pinSecurity: true,
      factoryReset: true,
      updates: true,
      licensingPanel: true
    }
  },
  updatedAt: null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function getRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

export function normalizeEntitlements(value: unknown): Entitlements {
  const raw = getRecord(value)
  const modules = getRecord(raw.modules)
  const features = getRecord(raw.features)
  const inventoryModule = getRecord(modules.inventory)
  const financeModule = getRecord(modules.finance)
  const settingsModule = getRecord(modules.settings)
  const inventoryFeatures = getRecord(features.inventory)
  const financeFeatures = getRecord(features.finance)
  const settingsFeatures = getRecord(features.settings)

  const source: 'local' | 'license' = raw.source === 'license' ? 'license' : 'local'
  const locked = source === 'license' ? true : asBoolean(raw.locked, DEFAULT_ENTITLEMENTS.locked)

  return {
    schemaVersion: 1,
    source,
    locked,
    modules: {
      inventory: { enabled: asBoolean(inventoryModule.enabled, DEFAULT_ENTITLEMENTS.modules.inventory.enabled) },
      finance: { enabled: asBoolean(financeModule.enabled, DEFAULT_ENTITLEMENTS.modules.finance.enabled) },
      settings: { enabled: asBoolean(settingsModule.enabled, DEFAULT_ENTITLEMENTS.modules.settings.enabled) }
    },
    features: {
      inventory: {
        createProduct: asBoolean(inventoryFeatures.createProduct, DEFAULT_ENTITLEMENTS.features.inventory.createProduct),
        editProduct: asBoolean(inventoryFeatures.editProduct, DEFAULT_ENTITLEMENTS.features.inventory.editProduct),
        archiveProduct: asBoolean(inventoryFeatures.archiveProduct, DEFAULT_ENTITLEMENTS.features.inventory.archiveProduct),
        stockMovement: asBoolean(inventoryFeatures.stockMovement, DEFAULT_ENTITLEMENTS.features.inventory.stockMovement),
        stockAdjustment: asBoolean(inventoryFeatures.stockAdjustment, DEFAULT_ENTITLEMENTS.features.inventory.stockAdjustment),
        lowStockAlerts: asBoolean(inventoryFeatures.lowStockAlerts, DEFAULT_ENTITLEMENTS.features.inventory.lowStockAlerts),
        importCsv: asBoolean(inventoryFeatures.importCsv, DEFAULT_ENTITLEMENTS.features.inventory.importCsv),
        exportCsv: asBoolean(inventoryFeatures.exportCsv, DEFAULT_ENTITLEMENTS.features.inventory.exportCsv),
        printLabels: asBoolean(inventoryFeatures.printLabels, DEFAULT_ENTITLEMENTS.features.inventory.printLabels),
        barcodes: asBoolean(inventoryFeatures.barcodes, DEFAULT_ENTITLEMENTS.features.inventory.barcodes)
      },
      finance: {
        createManual: asBoolean(financeFeatures.createManual, DEFAULT_ENTITLEMENTS.features.finance.createManual),
        editManual: asBoolean(financeFeatures.editManual, DEFAULT_ENTITLEMENTS.features.finance.editManual),
        deleteManual: asBoolean(financeFeatures.deleteManual, DEFAULT_ENTITLEMENTS.features.finance.deleteManual),
        paymentMethods: asBoolean(financeFeatures.paymentMethods, DEFAULT_ENTITLEMENTS.features.finance.paymentMethods),
        dateRangeCustom: asBoolean(financeFeatures.dateRangeCustom, DEFAULT_ENTITLEMENTS.features.finance.dateRangeCustom),
        exportCsv: asBoolean(financeFeatures.exportCsv, DEFAULT_ENTITLEMENTS.features.finance.exportCsv),
        exportPdf: asBoolean(financeFeatures.exportPdf, DEFAULT_ENTITLEMENTS.features.finance.exportPdf),
        receipts: asBoolean(financeFeatures.receipts, DEFAULT_ENTITLEMENTS.features.finance.receipts)
      },
      settings: {
        backupRestore: asBoolean(settingsFeatures.backupRestore, DEFAULT_ENTITLEMENTS.features.settings.backupRestore),
        pinSecurity: asBoolean(settingsFeatures.pinSecurity, DEFAULT_ENTITLEMENTS.features.settings.pinSecurity),
        factoryReset: asBoolean(settingsFeatures.factoryReset, DEFAULT_ENTITLEMENTS.features.settings.factoryReset),
        updates: asBoolean(settingsFeatures.updates, DEFAULT_ENTITLEMENTS.features.settings.updates),
        licensingPanel: asBoolean(settingsFeatures.licensingPanel, DEFAULT_ENTITLEMENTS.features.settings.licensingPanel)
      }
    },
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null
  }
}

export function hasEntitlementModule(entitlements: Entitlements, moduleId: EntitlementModuleId): boolean {
  return entitlements.modules[moduleId]?.enabled ?? false
}

export function hasEntitlementFeature<M extends EntitlementModuleId>(
  entitlements: Entitlements,
  moduleId: M,
  feature: keyof ModuleFeatureMap[M]
): boolean {
  const features = entitlements.features[moduleId] as ModuleFeatureMap[M]
  return Boolean(features?.[feature])
}
