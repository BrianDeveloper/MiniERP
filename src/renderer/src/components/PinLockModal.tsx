import { useEffect, useState } from 'react'

interface PinLockModalProps {
  mode: 'verify' | 'setup'
  onSuccess: () => void
  onCancel?: () => void
}

export function PinLockModal({ mode, onSuccess, onCancel }: PinLockModalProps) {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setPin('')
    setConfirm('')
    setError('')
  }, [mode])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'setup') {
        if (pin.trim().length < 4) {
          setError('El PIN debe tener al menos 4 caracteres.')
          setLoading(false)
          return
        }
        if (pin !== confirm) {
          setError('Los PINs no coinciden.')
          setLoading(false)
          return
        }
        const res = await window.minierp?.pinSet?.(pin)
        if (!res?.ok) {
          setError(res?.error || 'No se pudo guardar el PIN.')
          setLoading(false)
          return
        }
        onSuccess()
        return
      }

      const res = await window.minierp?.pinVerify?.(pin)
      if (res?.ok) {
        onSuccess()
        return
      }
      setError('PIN incorrecto.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al validar PIN')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div>
            <p className="modal-kicker">Seguridad</p>
            <h2 className="modal-title">{mode === 'setup' ? 'Configurar PIN de acceso' : 'Ingresar PIN'}</h2>
          </div>
          {onCancel ? (
            <button type="button" className="modal-close" onClick={onCancel}>
              Cerrar
            </button>
          ) : null}
        </header>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="modal-field">
            <span>{mode === 'setup' ? 'PIN / Contraseña' : 'PIN'}</span>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              minLength={4}
              required
              autoFocus
            />
          </label>
          {mode === 'setup' ? (
            <label className="modal-field">
              <span>Confirmar PIN / Contraseña</span>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                minLength={4}
                required
              />
            </label>
          ) : null}
          {error ? <p className="form-error">{error}</p> : null}
          <footer className="modal-actions">
            {onCancel ? (
              <button type="button" className="ghost-button" onClick={onCancel} disabled={loading}>
                Cancelar
              </button>
            ) : null}
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Verificando...' : mode === 'setup' ? 'Guardar PIN' : 'Desbloquear'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
