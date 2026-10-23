import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Database,
  DownloadCloud,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  X
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ApiError } from '../api/client'
import { WorkspaceShell } from '../components/WorkspaceShell'
import {
  CURRENCIES,
  type BusinessProfile,
  type CurrencyCode
} from '../../../shared/types/business'
import {
  FEATURE_LABELS,
  PLAN_LABELS,
  PLAN_MODULE_IDS,
  isPlanModuleEnabled,
  type PlanFeatures
} from '../../../shared/types/plan'
import { APP_MODULES, getModule } from '../modules/registry'
import { useAppData } from './AppDataProvider'
import { useUpdater } from './useUpdater'
import { businessFormSchema } from '../../../shared/validation/schemas'
import { formatPhoneInput, formatRifInput, MAX_PHONE_LENGTH, MAX_RIF_LENGTH } from '../../../shared/validation/rules'

interface FormState {
  name: string
  rif: string
  currency: CurrencyCode
  address: string
  phone: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function toForm(business: BusinessProfile): FormState {
  return {
    name: business.name,
    rif: business.rif,
    currency: business.currency,
    address: business.address,
    phone: business.phone
  }
}

function formatLimit(value: number | null, locale: string): string {
  if (value === null) return 'Sin límite'
  return new Intl.NumberFormat(locale).format(value)
}

export function SettingsPage() {
  const { business, plan, system, saveBusiness } = useAppData()
  const { state: updateState, check: checkUpdates, install: installUpdate } = useUpdater()
  const [form, setForm] = useState<FormState>(() => toForm(business))
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [message, setMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setForm(toForm(business))
  }, [business])

  const isDirty = useMemo(
    () =>
      form.name !== business.name ||
      form.rif !== business.rif ||
      form.currency !== business.currency ||
      form.address !== business.address ||
      form.phone !== business.phone,
    [form, business]
  )

  const planLabel = PLAN_LABELS[plan.plan]
  const featureKeys = Object.keys(FEATURE_LABELS) as Array<keyof PlanFeatures>
  const settingsModule = getModule('settings')

  function updateField<Key extends keyof FormState>(field: Key, value: FormState[Key]): void {
    let nextValue: unknown = value
    if (field === 'rif' && typeof value === 'string') nextValue = formatRifInput(value)
    if (field === 'phone' && typeof value === 'string') nextValue = formatPhoneInput(value)

    setForm((previous) => ({ ...previous, [field]: nextValue as FormState[Key] }))
    setFieldErrors((previous) => {
      if (!(field in previous)) return previous
      const next = { ...previous }
      delete next[field]
      return next
    })
    if (status !== 'saving') {
      setStatus('idle')
      setMessage('')
    }
  }

  function handleReset(): void {
    setForm(toForm(business))
    setFieldErrors({})
    setStatus('idle')
    setMessage('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setStatus('saving')
    setMessage('')
    setFieldErrors({})

    const parsed = businessFormSchema.safeParse(form)
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path[0]
        if (typeof path === 'string' && !errors[path]) errors[path] = issue.message
      }
      setFieldErrors(errors)
      setMessage('Revisa los campos marcados.')
      setStatus('error')
      return
    }

    try {
      const updated = await saveBusiness({
        ...parsed.data,
        rif: parsed.data.rif ?? '',
        phone: parsed.data.phone ?? ''
      } as unknown as import('../../../shared/types/business').BusinessUpdateInput)
      setForm(toForm(updated))
      setStatus('saved')
      setMessage('Los datos del negocio se guardaron correctamente.')
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fields ?? {})
        setMessage(error.message)
      } else {
        setMessage('No se pudo guardar la configuración.')
      }
      setStatus('error')
    }
  }

  return (
    <WorkspaceShell
      title="Configuración general"
      subtitle="Negocio, moneda y plan"
      icon={settingsModule?.icon ?? APP_MODULES[2].icon}
      accent={settingsModule?.accent ?? APP_MODULES[2].accent}
      actions={<span className="workspace-badge">Datos locales</span>}
    >
      <div className="settings-layout">
        <section className="panel">
          <h2>Datos del negocio</h2>
          <p className="panel-description">
            Esta información identifica tu comercio en el escritorio y se usará en comprobantes
            y reportes.
          </p>

          <form onSubmit={(event) => void handleSubmit(event)} noValidate autoComplete="off">
            <div className="form-grid">
              <div className="field field-full">
                <label htmlFor="business-name">Nombre del negocio</label>
                <input
                  id="business-name"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Ej. Abastos La Esquina"
                  aria-invalid={Boolean(fieldErrors.name)}
                />
                {fieldErrors.name ? <span className="field-error">{fieldErrors.name}</span> : null}
              </div>

              <div className="field">
                <label htmlFor="business-rif">RIF / Cédula</label>
                <input
                  id="business-rif"
                  value={form.rif}
                  onChange={(event) => updateField('rif', event.target.value)}
                  placeholder="J-12345678-9"
                  maxLength={MAX_RIF_LENGTH}
                  aria-invalid={Boolean(fieldErrors.rif)}
                />
                <span className="field-hint">Formatos: J-12345678-9, V-12345678.</span>
                {fieldErrors.rif ? <span className="field-error">{fieldErrors.rif}</span> : null}
              </div>

              <div className="field">
                <label htmlFor="business-currency">Moneda local</label>
                <select
                  id="business-currency"
                  value={form.currency}
                  onChange={(event) => updateField('currency', event.target.value as CurrencyCode)}
                  aria-invalid={Boolean(fieldErrors.currency)}
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.label} ({currency.code})
                    </option>
                  ))}
                </select>
                <span className="field-hint">Se usará para montos y reportes.</span>
                {fieldErrors.currency ? (
                  <span className="field-error">{fieldErrors.currency}</span>
                ) : null}
              </div>

              <div className="field field-full">
                <label htmlFor="business-address">Dirección</label>
                <textarea
                  id="business-address"
                  value={form.address}
                  onChange={(event) => updateField('address', event.target.value)}
                  placeholder="Dirección fiscal o comercial"
                  rows={3}
                  aria-invalid={Boolean(fieldErrors.address)}
                />
                {fieldErrors.address ? (
                  <span className="field-error">{fieldErrors.address}</span>
                ) : null}
              </div>

              <div className="field">
                <label htmlFor="business-phone">Teléfono</label>
                <input
                  id="business-phone"
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  placeholder="0212-1234567"
                  maxLength={MAX_PHONE_LENGTH}
                  inputMode="tel"
                  aria-invalid={Boolean(fieldErrors.phone)}
                />
                <span className="field-hint">Máximo 11-12 dígitos/formato local.</span>
                {fieldErrors.phone ? (
                  <span className="field-error">{fieldErrors.phone}</span>
                ) : null}
              </div>
            </div>

            {status === 'saved' ? (
              <div className="form-message success" role="status">
                <CheckCircle2 size={16} />
                {message}
              </div>
            ) : null}

            {status === 'error' ? (
              <div className="form-message error" role="alert">
                <AlertTriangle size={16} />
                {message}
              </div>
            ) : null}

            <div className="form-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={handleReset}
                disabled={!isDirty || status === 'saving'}
              >
                <RotateCcw size={15} />
                Descartar cambios
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={!isDirty || status === 'saving'}
              >
                <Save size={15} />
                {status === 'saving' ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </section>

        <aside className="settings-aside">
          <section className="panel plan-panel">
            <div className="plan-heading">
              <span className="plan-icon">
                <ShieldCheck size={22} />
              </span>
              <div>
                <p className="eyebrow">Licencia activa</p>
                <h2>{planLabel.name}</h2>
                <p className="plan-tagline">{planLabel.tagline}</p>
              </div>
            </div>

            <div className="plan-section">
              <h3>Módulos incluidos</h3>
              <ul className="plan-list">
                {PLAN_MODULE_IDS.map((moduleId) => {
                  const enabled = isPlanModuleEnabled(plan, moduleId)
                  const module = APP_MODULES.find((entry) => entry.id === moduleId)
                  return (
                    <li key={moduleId} className={enabled ? 'is-on' : 'is-off'}>
                      {enabled ? <CheckCircle2 size={15} /> : <X size={15} />}
                      <span>{module?.title ?? moduleId}</span>
                      <em>{enabled ? 'Habilitado' : 'Bloqueado'}</em>
                    </li>
                  )
                })}
                <li className="is-on">
                  <CheckCircle2 size={15} />
                  <span>Configuración</span>
                  <em>Siempre disponible</em>
                </li>
              </ul>
            </div>

            <div className="plan-section">
              <h3>Límites del plan</h3>
              <div className="limits">
                <div className="limit-row">
                  <span>Usuarios</span>
                  <strong>{formatLimit(plan.limits.users, business.locale)}</strong>
                </div>
                <div className="limit-row">
                  <span>Productos</span>
                  <strong>{formatLimit(plan.limits.inventoryItems, business.locale)}</strong>
                </div>
                <div className="limit-row">
                  <span>Transacciones / mes</span>
                  <strong>{formatLimit(plan.limits.monthlyTransactions, business.locale)}</strong>
                </div>
              </div>
            </div>

            <div className="plan-section">
              <h3>Funciones</h3>
              <ul className="plan-list">
                {featureKeys.map((feature) => {
                  const enabled = plan.features[feature]
                  return (
                    <li key={feature} className={enabled ? 'is-on' : 'is-off'}>
                      {enabled ? <Check size={15} /> : <X size={15} />}
                      <span>{FEATURE_LABELS[feature]}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </section>

          <section className="panel storage-panel">
            <h3>
              <Database size={16} />
              Almacenamiento local
            </h3>
            <p>
              La información del negocio, los productos y los movimientos permanecen en este
              equipo.
            </p>
            <code>{system.databaseFile}</code>
            <span className="storage-meta">Licencia: {system.planFile}</span>
            <span className="storage-meta">
              MiniERP v{system.appVersion} · {system.platform}
            </span>
          </section>

          <section className="panel update-settings-panel">
            <h3>
              <DownloadCloud size={16} />
              Actualizaciones
            </h3>
            <p>
              MiniERP busca actualizaciones al iniciar y las descarga en segundo plano desde
              GitHub Releases.
            </p>
            <div className="update-settings-meta">
              <span>Versión instalada</span>
              <strong>v{system.appVersion}</strong>
            </div>
            {updateState ? (
              <span className={`update-settings-state is-${updateState.phase}`}>
                {updateState.message}
              </span>
            ) : null}
            <div className="form-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => void checkUpdates()}
                disabled={
                  updateState?.phase === 'checking' ||
                  updateState?.phase === 'downloading' ||
                  updateState?.phase === 'downloaded'
                }
              >
                <RefreshCw
                  className={updateState?.phase === 'checking' ? 'is-spinning' : undefined}
                  size={15}
                />
                {updateState?.phase === 'checking' ? 'Buscando...' : 'Buscar actualización'}
              </button>
              {updateState?.phase === 'downloaded' ? (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => void installUpdate()}
                >
                  Reiniciar e instalar
                </button>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </WorkspaceShell>
  )
}
