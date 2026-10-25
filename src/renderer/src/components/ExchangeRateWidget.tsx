import { useState } from 'react'
import { RefreshCw, Edit3, Circle, X } from 'lucide-react'
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

  const isBcvToday = updatedToday && source === 'bcv'
  const statusText = isBcvToday ? 'Actualizado hoy (BCV)' : source === 'manual' ? 'Tasa manual' : 'Última guardada'

  const handleRefresh = async () => {
    setError('')
    try {
      await refreshAuto()
    } catch {
      setError('No se pudo actualizar. Se mantiene la tasa guardada.')
    }
  }

  const openManual = () => {
    setManualValue(rate > 0 ? rate.toFixed(2) : '')
    setError('')
    setOpen(true)
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
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs shadow-[0_10px_60px_-30px_rgba(56,189,248,0.6)]">
        <Circle size={8} className="text-amber-400" />
        <span className="text-white/80">Sin tasa configurada</span>
        <div className="ml-1 flex items-center gap-1">
          <button
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-white/60 transition hover:bg-white/5 hover:text-white"
            onClick={openManual}
            title="Configurar tasa manual"
          >
            <Edit3 size={13} />
            <span className="hidden sm:inline">Editar</span>
          </button>
        </div>
        {open && (
          <ManualRateModal
            value={manualValue}
            source={source}
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
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs shadow-[0_10px_60px_-30px_rgba(56,189,248,0.6)]">
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${isBcvToday ? 'bg-emerald-400' : 'bg-amber-400'} ${updating ? 'animate-ping' : ''}`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${isBcvToday ? 'bg-emerald-400' : 'bg-amber-400'}`} />
      </span>
      <span className="whitespace-nowrap text-white/90">
        1 USD = <strong className="text-white">{rate.toFixed(2)}</strong> VES
      </span>
      <span className="hidden lg:inline text-white/40">•</span>
      <span className="hidden lg:inline text-white/50">{statusText}</span>
      <span className="hidden xl:inline text-white/40">•</span>
      <span className="hidden xl:inline text-white/40">{formatTime(lastUpdated)}</span>
      <div className="ml-1 flex items-center gap-1">
        <button
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
          onClick={() => void handleRefresh()}
          disabled={updating}
          title="Sincronizar desde BCV"
        >
          <RefreshCw size={13} className={updating ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Sincronizar</span>
        </button>
        <button
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-white/60 transition hover:bg-white/5 hover:text-white"
          onClick={openManual}
          title="Editar tasa manual"
        >
          <Edit3 size={13} />
          <span className="hidden sm:inline">Editar</span>
        </button>
      </div>
      {error ? <span className="hidden 2xl:inline text-amber-400">{error}</span> : null}
      {open && (
        <ManualRateModal
          value={manualValue}
          source={source}
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
  source: string
  onChange: (v: string) => void
  onSave: () => void
  onClose: () => void
  saving: boolean
  error: string
}) {
  const [mode, setMode] = useState<'bcv' | 'manual'>('manual')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 shadow-[0_40px_120px_-60px_rgba(56,189,248,0.9)]">
        <button
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition hover:bg-white/5 hover:text-white"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
        <div className="mb-4">
          <h3 className="text-base font-semibold text-white">Editar tasa de cambio</h3>
          <p className="mt-1 text-xs text-white/50">Define el valor de 1 USD en bolívares venezolanos</p>
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-xs text-white/60">Fuente</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('bcv')}
              className={`rounded-lg px-2 py-1 text-xs transition ${
                mode === 'bcv'
                  ? 'bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-400/40'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              BCV
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`rounded-lg px-2 py-1 text-xs transition ${
                mode === 'manual'
                  ? 'bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/40'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              Manual
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/60">Tasa (VES por 1 USD)</label>
          <div className="relative">
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              inputMode="decimal"
              placeholder="45.20"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-white/40"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">VES</span>
          </div>
          {error ? <p className="mt-2 text-xs text-amber-400">{error}</p> : null}
        </div>
        <div className="mt-6 flex gap-2">
          <button
            className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:bg-white/5"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            className="flex-1 rounded-lg bg-gradient-to-r from-sky-400/80 to-cyan-400/80 px-3 py-2 text-sm font-medium text-white shadow-[0_20px_60px_-30px_rgba(56,189,248,0.9)] transition hover:from-sky-400 hover:to-cyan-400 disabled:opacity-60"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
