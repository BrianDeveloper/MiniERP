import { ArrowUpRight, BadgeCheck, Database, Lock, ShieldCheck } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { PLAN_LABELS, type PlanConfig } from '../../../shared/types/plan'
import { Clock } from '../components/Clock'
import { APP_MODULES, canOpenModule, type AppModule } from '../modules/registry'
import { useAppData } from './AppDataProvider'
import { useLicense } from '../hooks/useLicense'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'M'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

interface LauncherTileProps {
  module: AppModule
  enabled: boolean
  onOpen: () => void
}

function LauncherTile({ module, enabled, onOpen }: LauncherTileProps) {
  const Icon = module.icon
  const style = {
    '--module-accent': module.accent,
    '--module-glow': module.glow
  } as CSSProperties

  return (
    <button
      type="button"
      className={`module-tile${enabled ? '' : ' is-locked'}`}
      style={style}
      onClick={onOpen}
      disabled={!enabled}
      aria-disabled={!enabled}
      title={enabled ? `Abrir ${module.title}` : 'Módulo no incluido en tu plan'}
    >
      <div className="tile-top">
        <span className="tile-icon">
          <Icon size={26} strokeWidth={1.9} />
        </span>
        {enabled ? (
          <ArrowUpRight className="tile-arrow" size={20} />
        ) : (
          <Lock className="tile-lock" size={18} />
        )}
      </div>

      <div className="tile-copy">
        <p className="tile-kicker">{module.kicker}</p>
        <h3>{module.title}</h3>
        <p>{module.description}</p>
      </div>

      <div className="tile-footer">
        <span className="tile-status">{enabled ? 'Disponible' : 'No incluido en tu plan'}</span>
        <span className="tile-tag">{enabled ? module.phase : 'Requiere activación'}</span>
      </div>
    </button>
  )
}

export function LauncherPage() {
  const { business, plan, system } = useAppData()
  const navigate = useNavigate()
  const { isModuleEnabled, loaded } = useLicense()
  const planLabel = PLAN_LABELS[plan.plan]
  const availableModules = APP_MODULES.filter((module) => {
    const planEnabled = canOpenModule(module, plan)
    if (module.id === 'settings') return true
    if (module.id === 'inventory') {
      const lic = loaded ? isModuleEnabled('inventory') : planEnabled
      return planEnabled && lic
    }
    if (module.id === 'finance') {
      const lic = loaded ? isModuleEnabled('finances') : planEnabled
      return planEnabled && lic
    }
    return planEnabled
  }).length

  return (
    <div className="launcher">
      <div className="launcher-backdrop" aria-hidden="true" />

      <header className="launcher-header">
        <div className="brand">
          <div className="brand-mark">{getInitials(business.name)}</div>
          <div className="brand-copy">
            <p className="eyebrow">Escritorio virtual</p>
            <h1>{business.name}</h1>
            <p className="brand-meta">
              {business.rif ? `RIF ${business.rif}` : 'RIF no configurado'}
              <span>·</span>
              {business.currency}
            </p>
          </div>
        </div>

        <div className="header-tools">
          <Clock locale={business.locale} />
          <div className="plan-chip">
            <BadgeCheck size={18} />
            <div>
              <strong>{planLabel.name}</strong>
              <small>{planLabel.tagline}</small>
            </div>
          </div>
        </div>
      </header>

      <main className="launcher-main">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Tu negocio, en un solo lugar</p>
            <h2>Aplicaciones</h2>
          </div>
          <p className="section-note">
            {availableModules} de {APP_MODULES.length} espacios disponibles en tu plan
          </p>
        </div>

        <div className="module-grid">
          {APP_MODULES.map((module) => (
            <LauncherTile
              key={module.id}
              module={module}
              enabled={(() => { const p = canOpenModule(module, plan); if (module.id === 'inventory') return p && (loaded ? isModuleEnabled('inventory') : p); if (module.id === 'finance') return p && (loaded ? isModuleEnabled('finances') : p); if (module.id === 'settings') return true; return p })()}
              onOpen={() => navigate(module.route)}
            />
          ))}
        </div>
      </main>

      <footer className="launcher-footer">
        <span className="local-badge">
          <Database size={14} />
          Datos guardados en este equipo
        </span>
        <span className="footer-meta">MiniERP v{system.appVersion}</span>
        <span className="footer-meta">
          <ShieldCheck size={14} />
          Sesión local protegida
        </span>
      </footer>
    </div>
  )
}
