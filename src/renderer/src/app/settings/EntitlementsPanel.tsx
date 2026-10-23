import { useEffect, useState } from 'react'
import { DEFAULT_ENTITLEMENTS, type Entitlements } from '../../../../shared/types/entitlements'
import { ShieldCheck } from 'lucide-react'

export function EntitlementsPanel({ unlocked }: { unlocked: boolean }) {
  const [entitlements, setEntitlements] = useState<Entitlements>(DEFAULT_ENTITLEMENTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const load = async () => {
    try {
      const data = await window.minierp?.getEntitlements?.()
      if (data) setEntitlements(data)
    } catch {
      setEntitlements(DEFAULT_ENTITLEMENTS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const toggleModule = (id: keyof Entitlements['modules'], enabled: boolean) => {
    setEntitlements((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [id]: { enabled }
      }
    }))
  }

  const toggleFeature = <M extends keyof Entitlements['features']>(
    moduleId: M,
    feature: keyof Entitlements['features'][M],
    enabled: boolean
  ) => {
    setEntitlements((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [moduleId]: {
          ...prev.features[moduleId],
          [feature]: enabled
        }
      }
    }))
  }

  const save = async () => {
    if (!unlocked || entitlements.locked) return
    setSaving(true)
    setMessage('')
    try {
      const res = await window.minierp?.updateEntitlements?.({
        ...entitlements,
        updatedAt: new Date().toISOString()
      })
      if (res?.ok) setMessage('Permisos guardados correctamente.')
      else setMessage(res?.error || 'No se pudieron guardar los permisos.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    if (!unlocked || entitlements.locked) return
    setEntitlements({
      ...DEFAULT_ENTITLEMENTS,
      source: 'local',
      locked: false,
      updatedAt: new Date().toISOString()
    })
    setMessage('Valores restaurados. Pulsa Guardar para aplicar.')
  }

  if (loading) {
    return (
      <section className="settings-card">
        <header className="settings-card__header">
          <div>
            <p className="settings-card__kicker">Permisos</p>
            <h2 className="settings-card__title">Módulos y funcionalidades</h2>
          </div>
          <ShieldCheck size={18} />
        </header>
        <div className="settings-card__body">
          <p className="settings-row__subtitle">Cargando...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="settings-card">
      <header className="settings-card__header">
        <div>
          <p className="settings-card__kicker">Permisos</p>
          <h2 className="settings-card__title">Módulos y funcionalidades</h2>
          <p className="settings-card__subtitle">
            {entitlements.locked ? 'Bloqueado por licencia' : unlocked ? 'Editable (modo local)' : 'Desbloquea con PIN para editar'}
          </p>
        </div>
        <ShieldCheck size={18} />
      </header>
      <div className="settings-card__body">
        <div className="settings-row">
          <div>
            <p className="settings-row__title">Inventario</p>
            <p className="settings-row__subtitle">Habilitar módulo completo</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={entitlements.modules.inventory.enabled}
              disabled={!unlocked || entitlements.locked}
              onChange={(e) => toggleModule('inventory', e.target.checked)}
            />
            <span>Habilitado</span>
          </label>
        </div>
        <div className="settings-row">
          <div>
            <p className="settings-row__title">Finanzas</p>
            <p className="settings-row__subtitle">Habilitar módulo completo</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={entitlements.modules.finance.enabled}
              disabled={!unlocked || entitlements.locked}
              onChange={(e) => toggleModule('finance', e.target.checked)}
            />
            <span>Habilitado</span>
          </label>
        </div>
        <div className="settings-row">
          <div>
            <p className="settings-row__title">Configuración</p>
            <p className="settings-row__subtitle">Habilitar módulo completo</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={entitlements.modules.settings.enabled}
              disabled={!unlocked || entitlements.locked}
              onChange={(e) => toggleModule('settings', e.target.checked)}
            />
            <span>Habilitado</span>
          </label>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '12px 0' }} />
        <p className="settings-row__title">Inventario - Funcionalidades</p>
        <div className="settings-row"><div><p className="settings-row__subtitle">Crear producto</p></div><input type="checkbox" checked={entitlements.features.inventory.createProduct} disabled={!unlocked || entitlements.locked || !entitlements.modules.inventory.enabled} onChange={(e) => toggleFeature('inventory', 'createProduct', e.target.checked)} /></div>
        <div className="settings-row"><div><p className="settings-row__subtitle">Editar producto</p></div><input type="checkbox" checked={entitlements.features.inventory.editProduct} disabled={!unlocked || entitlements.locked || !entitlements.modules.inventory.enabled} onChange={(e) => toggleFeature('inventory', 'editProduct', e.target.checked)} /></div>
        <div className="settings-row"><div><p className="settings-row__subtitle">Archivar producto</p></div><input type="checkbox" checked={entitlements.features.inventory.archiveProduct} disabled={!unlocked || entitlements.locked || !entitlements.modules.inventory.enabled} onChange={(e) => toggleFeature('inventory', 'archiveProduct', e.target.checked)} /></div>
        <div className="settings-row"><div><p className="settings-row__subtitle">Movimientos de stock</p></div><input type="checkbox" checked={entitlements.features.inventory.stockMovement} disabled={!unlocked || entitlements.locked || !entitlements.modules.inventory.enabled} onChange={(e) => toggleFeature('inventory', 'stockMovement', e.target.checked)} /></div>
        <div className="settings-row"><div><p className="settings-row__subtitle">Exportar CSV</p></div><input type="checkbox" checked={entitlements.features.inventory.exportCsv} disabled={!unlocked || entitlements.locked || !entitlements.modules.inventory.enabled} onChange={(e) => toggleFeature('inventory', 'exportCsv', e.target.checked)} /></div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '12px 0' }} />
        <p className="settings-row__title">Finanzas - Funcionalidades</p>
        <div className="settings-row"><div><p className="settings-row__subtitle">Crear movimiento manual</p></div><input type="checkbox" checked={entitlements.features.finance.createManual} disabled={!unlocked || entitlements.locked || !entitlements.modules.finance.enabled} onChange={(e) => toggleFeature('finance', 'createManual', e.target.checked)} /></div>
        <div className="settings-row"><div><p className="settings-row__subtitle">Eliminar movimiento manual</p></div><input type="checkbox" checked={entitlements.features.finance.deleteManual} disabled={!unlocked || entitlements.locked || !entitlements.modules.finance.enabled} onChange={(e) => toggleFeature('finance', 'deleteManual', e.target.checked)} /></div>
        <div className="settings-row"><div><p className="settings-row__subtitle">Rango de fechas personalizado</p></div><input type="checkbox" checked={entitlements.features.finance.dateRangeCustom} disabled={!unlocked || entitlements.locked || !entitlements.modules.finance.enabled} onChange={(e) => toggleFeature('finance', 'dateRangeCustom', e.target.checked)} /></div>
        <div className="settings-row"><div><p className="settings-row__subtitle">Exportar CSV</p></div><input type="checkbox" checked={entitlements.features.finance.exportCsv} disabled={!unlocked || entitlements.locked || !entitlements.modules.finance.enabled} onChange={(e) => toggleFeature('finance', 'exportCsv', e.target.checked)} /></div>
        <div className="settings-row"><div><p className="settings-row__subtitle">Recibos/Comprobantes</p></div><input type="checkbox" checked={entitlements.features.finance.receipts} disabled={!unlocked || entitlements.locked || !entitlements.modules.finance.enabled} onChange={(e) => toggleFeature('finance', 'receipts', e.target.checked)} /></div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '12px 0' }} />
        <p className="settings-row__title">Configuración - Funcionalidades</p>
        <div className="settings-row"><div><p className="settings-row__subtitle">Backup / Restauración</p></div><input type="checkbox" checked={entitlements.features.settings.backupRestore} disabled={!unlocked || entitlements.locked || !entitlements.modules.settings.enabled} onChange={(e) => toggleFeature('settings', 'backupRestore', e.target.checked)} /></div>
        <div className="settings-row"><div><p className="settings-row__subtitle">Seguridad PIN</p></div><input type="checkbox" checked={entitlements.features.settings.pinSecurity} disabled={!unlocked || entitlements.locked || !entitlements.modules.settings.enabled} onChange={(e) => toggleFeature('settings', 'pinSecurity', e.target.checked)} /></div>
        <div className="settings-row"><div><p className="settings-row__subtitle">Restablecer Fábrica</p></div><input type="checkbox" checked={entitlements.features.settings.factoryReset} disabled={!unlocked || entitlements.locked || !entitlements.modules.settings.enabled} onChange={(e) => toggleFeature('settings', 'factoryReset', e.target.checked)} /></div>
        <div className="settings-row"><div><p className="settings-row__subtitle">Actualizaciones</p></div><input type="checkbox" checked={entitlements.features.settings.updates} disabled={!unlocked || entitlements.locked || !entitlements.modules.settings.enabled} onChange={(e) => toggleFeature('settings', 'updates', e.target.checked)} /></div>
        <div className="settings-row"><div><p className="settings-row__subtitle">Panel de Licenciamiento/Permisos</p></div><input type="checkbox" checked={entitlements.features.settings.licensingPanel} disabled={!unlocked || entitlements.locked || !entitlements.modules.settings.enabled} onChange={(e) => toggleFeature('settings', 'licensingPanel', e.target.checked)} /></div>

        <div className="settings-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <button type="button" className="ghost-button" onClick={reset} disabled={!unlocked || entitlements.locked || saving}>Restaurar valores por defecto</button>
          <button type="button" className="primary-button" onClick={save} disabled={!unlocked || entitlements.locked || saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
        </div>
        {message ? <p className="settings-row__subtitle">{message}</p> : null}
      </div>
    </section>
  )
}
