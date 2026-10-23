import { AlertTriangle, CheckCircle2, Download, RefreshCw, X } from 'lucide-react'
import { useState } from 'react'
import { useUpdater } from '../app/useUpdater'

export function UpdateBanner() {
  const { state, check, install } = useUpdater()
  const [dismissed, setDismissed] = useState<string | null>(null)

  if (!state) return null

  const visiblePhases = ['available', 'downloading', 'downloaded', 'error']
  if (!visiblePhases.includes(state.phase)) return null

  const key = state.availableVersion ?? state.phase
  if (dismissed === key) return null

  const title =
    state.phase === 'downloaded'
      ? 'Actualización lista'
      : state.phase === 'error'
        ? 'No se pudo actualizar'
        : state.phase === 'downloading'
          ? 'Descargando actualización'
          : 'Actualización disponible'

  return (
    <aside className={`update-banner is-${state.phase}`} role="status" aria-live="polite">
      <span className="update-banner-icon">
        {state.phase === 'downloaded' ? (
          <CheckCircle2 size={20} />
        ) : state.phase === 'error' ? (
          <AlertTriangle size={20} />
        ) : state.phase === 'downloading' ? (
          <RefreshCw className="is-spinning" size={20} />
        ) : (
          <Download size={20} />
        )}
      </span>

      <div className="update-banner-copy">
        <p className="eyebrow">MiniERP v{state.currentVersion}</p>
        <h2>{title}</h2>
        <p>{state.message}</p>

        {state.phase === 'downloading' && state.progress !== null ? (
          <div
            className="update-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={state.progress}
          >
            <span style={{ width: `${state.progress}%` }} />
            <small>{state.progress}%</small>
          </div>
        ) : null}
      </div>

      <div className="update-banner-actions">
        {state.phase === 'downloaded' ? (
          <button type="button" className="primary-button" onClick={() => void install()}>
            Reiniciar e instalar
          </button>
        ) : null}
        {state.phase === 'error' ? (
          <button type="button" className="ghost-button" onClick={() => void check()}>
            <RefreshCw size={15} />
            Reintentar
          </button>
        ) : null}
        <button
          type="button"
          className="icon-button"
          aria-label="Ocultar notificación de actualización"
          onClick={() => setDismissed(key)}
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  )
}
