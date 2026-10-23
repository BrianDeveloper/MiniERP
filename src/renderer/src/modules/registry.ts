import { Boxes, Settings2, Wallet, type LucideIcon } from 'lucide-react'
import { isPlanModuleEnabled, type PlanConfig, type PlanModuleId } from '../../../shared/types/plan'

export type AppModuleId = PlanModuleId | 'settings'

export interface AppModule {
  id: AppModuleId
  title: string
  kicker: string
  description: string
  route: string
  icon: LucideIcon
  accent: string
  glow: string
  planModule?: PlanModuleId
  phase: string
}

export const APP_MODULES: AppModule[] = [
  {
    id: 'inventory',
    title: 'Inventario',
    kicker: 'Operaciones',
    description: 'Controla productos, existencias, entradas y salidas de tu mercancía.',
    route: '/module/inventory',
    icon: Boxes,
    accent: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.22)',
    planModule: 'inventory',
    phase: 'Operativo'
  },
  {
    id: 'finance',
    title: 'Finanzas',
    kicker: 'Contabilidad',
    description: 'Registra ingresos, egresos y el flujo de caja de tu negocio.',
    route: '/module/finance',
    icon: Wallet,
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.24)',
    planModule: 'finance',
    phase: 'Operativo'
  },
  {
    id: 'settings',
    title: 'Configuración',
    kicker: 'Sistema',
    description: 'Administra los datos del negocio, la moneda local y tu licencia.',
    route: '/settings',
    icon: Settings2,
    accent: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.16)',
    phase: 'Operativo'
  }
]

export function getModule(moduleId: string): AppModule | undefined {
  return APP_MODULES.find((module) => module.id === moduleId)
}

export function canOpenModule(module: AppModule, plan: PlanConfig): boolean {
  return module.planModule ? isPlanModuleEnabled(plan, module.planModule) : true
}
