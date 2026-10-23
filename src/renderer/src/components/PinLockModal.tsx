import { useEffect, useState } from 'react'

interface PinLockModalProps {
  mode: 'verify' | 'setup' | 'change' | 'disable'
  onSuccess: (pin?: string) => void
  onCancel?: () => void
}

export function PinLockModal({ mode, onSuccess, onCancel }: PinLockModalProps) {
  const [pin, setPin] = useState('')
  const [oldPin, setOldPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setPin('')
    setOldPin('')
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

      if (mode === 'change') {
        if (oldPin.trim().length < 4 || pin.trim().length < 4) {
          setError('Completa todos los campos.')
          setLoading(false)
          return
        }
        if (pin !== confirm) {
          setError('Los PINs nuevos no coinciden.')
          setLoading(false)
          return
        }
        const res = await window.minierp?.pinChange?.(oldPin, pin)
        if (!res?.ok) {
          setError(res?.error || 'PIN actual incorrecto o no se pudo cambiar.')
          setLoading(false)
          return
        }
        onSuccess()
        return
      }

      if (mode === 'disable') {
        if (oldPin.trim().length < 4) {
          setError('Ingresa el PIN actual.')
          setLoading(false)
          return
        }
        const res = await window.minierp?.pinDisable?.(oldPin)
        if (!res?.ok) {
          setError(res?.error || 'PIN actual incorrecto.')
          setLoading(false)
          return
        }
        onSuccess(oldPin)
        return
      }

      const res = await window.minierp?.pinVerify?.(pin)
      if (res?.ok) {
        onSuccess(pin)
        return
      }
      setError('PIN incorrecto.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al validar PIN')
    } finally {
      setLoading(false)
    }
  }

  const title =
    mode === 'setup'
      ? 'Configurar PIN'
      : mode === 'change'
        ? 'Cambiar PIN'
        : mode === 'disable'
          ? 'Desactivar PIN'
          : 'Ingresar PIN'

  return (
    <div className="modal-backdrop">
      <div className="modal-card" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div>
            <p className="modal-kicker">Seguridad</p>
            <h2 className="modal-title">{title}</h2>
          </div>
          {onCancel ? (
            <button type="button" className="modal-close" onClick={onCancel}>
              Cerrar
            </button>
          ) : null}
        </header>
        <form className="modal-form" onSubmit={handleSubmit}>
          {mode === 'change' || mode === 'disable' ? (
            <label className="modal-field">
              <span>PIN actual</span>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={oldPin}
                onChange={(event) => setOldPin(event.target.value)}
                minLength={4}
                required
                autoFocus
              />
            </label>
          ) : null}
          {mode === 'disable' ? (
            <p className="settings-row__subtitle">Al desactivarlo, el panel de Configuración quedará sin protección.</p>
          ) : null}
          {mode === 'setup' || mode === 'change' ? (
            <>
              <label className="modal-field">
                <span>{mode === 'change' ? 'Nuevo PIN / Contraseña' : 'PIN / Contraseña'}</span>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  minLength={4}
                  required
                  autoFocus={mode === 'setup'}
                />
              </label>
              <label className="modal-field">
                <span>Confirmar {mode === 'change' ? 'nuevo PIN' : 'PIN'}</span>
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
            </>
          ) : null}
          {mode === 'verify' ? (
            <label className="modal-field">
              <span>PIN</span>
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
          ) : null}
          {error ? <p className="form-error">{error}</p> : null}
          <footer className="modal-actions">
            {onCancel ? (
              <button type="button" className="ghost-button" onClick={onCancel} disabled={loading}>
                Cancelar
              </button>
            ) : null}
            <button type="submit" className="primary-button" disabled={loading}>
              {loading
                ? 'Procesando...'
                : mode === 'disable'
                  ? 'Desactivar'
                  : mode === 'change'
                    ? 'Guardar nuevo PIN'
                    : mode === 'setup'
                      ? 'Guardar PIN'
                      : 'Desbloquear'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
