import { AlertTriangle, RefreshCw } from 'lucide-react'

export function StartupScreen() {
  return (
    <div className="status-screen">
      <div className="status-card">
        <div className="status-logo">M</div>
        <p className="eyebrow">MiniERP Desktop</p>
        <h1>Preparando tu escritorio</h1>
        <p className="status-copy">
          Iniciando los servicios locales y cargando la configuración de tu negocio.
        </p>
        <div className="spinner" aria-label="Cargando" />
      </div>
    </div>
  )
}

interface ErrorScreenProps {
  message: string
  onRetry: () => void
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div className="status-screen">
      <div className="status-card">
        <div className="status-logo is-error">
          <AlertTriangle size={28} />
        </div>
        <p className="eyebrow">Servicio local no disponible</p>
        <h1>No se pudo abrir MiniERP</h1>
        <p className="status-copy">{message}</p>
        <button type="button" className="primary-button" onClick={onRetry}>
          <RefreshCw size={16} />
          Reintentar
        </button>
      </div>
    </div>
  )
}
