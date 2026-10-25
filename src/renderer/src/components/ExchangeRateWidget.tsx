import { useState } from 'react'
import { RefreshCw, Edit3, Circle } from 'lucide-react'
import { useExchangeRate } from '../hooks/useExchangeRate'

function formatTime(value: string | null): string {
  if (!value) return 'Sin registro'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-VE', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date)
}

export function ExchangeRateWidget() {
  const { rate, source, lastUpdated, updatedToday, updating, refreshAuto, setManual } = useExchangeRate()
  const [open, setOpen] = useState(false)
  const [manualValue, setManualValue] = useState(rate > 0 ? rate.toFixed(2) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const indicatorColor = updatedToday && source === 'bcv' ? 'text-emerald-400' : 'text-amber-400'
  const indicatorText = updatedToday && source === 'bcv' ? 'Actualizado hoy (BCV)' : source === 'manual' ? 'Tasa manual' : 'Usando última guardada'

  const handleRefresh = async () => {
    setError('')
    try {
      await refreshAuto()
    } catch {
      setError('No se pudo actualizar. Se mantiene la tasa guardada.')
    }
  }

  const handleSaveManual = async () => {
    setError('')
    const num = Number(manualValue.replace(',', '.'))
    if (!Number.isFinite(num) || num <= 0) {
      setError('Ingresa una tasa válida mayor a 0')
      return
    }
    setSaving(true)
    try {
      await setManual(num)
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar tasa manual')
    } finally {
      setSaving(false)
    }
  }

  if (rate <= 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1 text-xs">
        <Circle size={8} className="text-amber-400" />
        <span>Sin tasa configurada</span>
        <button className="hover:text-white/80" onClick={() => setOpen(true)} title="Configurar tasa manual">
          <Edit3 size={14} />
        </button>
        {open && (
          <ManualRateModal
            value={manualValue}
            onChange={setManualValue}
            onSave={handleSaveManual}
            onClose={() => setOpen(false)}
            saving={saving}
            error={error}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1 text-xs">
      <Circle size={8} className={indicatorColor} />
      <span className="whitespace-nowrap">
        Tasa: 1 USD = <strong>{rate.toFixed(2)}</strong> VES
      </span>
      <span className="hidden md:inline text-white/50">· {indicatorText} · {formatTime(lastUpdated)}</span>
      <button
        className="hover:text-white/80 disabled:opacity-50"
        onClick={() => void handleRefresh()}
        disabled={updating}
        title="Actualizar tasa desde BCV"
      >
        <RefreshCw size={14} className={updating ? 'animate-spin' : ''} />
      </button>
      <button className="hover:text-white/80" onClick={() => setOpen(true)} title="Editar tasa manual">
        <Edit3 size={14} />
      </button>
      {error ? <span className="text-amber-400 hidden lg:inline">{error}</span> : null}
      {open && (
        <ManualRateModal
          value={manualValue}
          onChange={setManualValue}
          onSave={handleSaveManual}
          onClose={() => setOpen(false)}
          saving={saving}
          error={error}
        />
      )}
    </div>
  )
}

function ManualRateModal({
  value,
  onChange,
  onSave,
  onClose,
  saving,
  error
}: {
  value: string
  onChange: (v: string) => void
  onSave: () => void
  onClose: () => void
  saving: boolean
  error: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#0f1026] p-4 shadow-xl">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Configurar tasa de cambio</h3>
          <button className="text-white/60 hover:text-white" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="mb-3 text-xs text-white/60">Ingresa el valor manual de 1 USD a VES</p>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
          placeholder="45.20"
          className="w-full rounded-lg border border-white/10 bg-transparent px-2 py-1 text-sm outline-none focus:border-white/30"
        />
        {error ? <p className="mt-2 text-xs text-amber-400">{error}</p> : null}
        <div className="mt-4 flex gap-2">
          <button className="ghost-button flex-1" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="primary-button flex-1" onClick={onSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
