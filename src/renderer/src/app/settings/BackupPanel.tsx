import { useCallback, useEffect, useState } from 'react'
import { DatabaseBackup, FolderOpen, RotateCcw, Save } from 'lucide-react'
import type { BackupInfo } from '../../../../shared/ipc'

interface BackupPanelProps {
  unlocked: boolean
  enabled: boolean
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

export function BackupPanel({ unlocked, enabled }: BackupPanelProps) {
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.minierp?.listBackups?.()
      if (result?.ok) setBackups(result.backups ?? [])
      else if (result?.error) setError(result.error)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron leer los respaldos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const create = async () => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await window.minierp?.createBackup?.()
      if (result?.ok) {
        setMessage(`Respaldo creado: ${result.backup?.name ?? ''}`)
        await load()
      } else {
        setError(result?.error ?? 'No se pudo crear el respaldo.')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo crear el respaldo.')
    } finally {
      setBusy(false)
    }
  }

  const restore = async (backup: BackupInfo) => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await window.minierp?.restoreBackup?.(backup.path)
      if (result?.ok) {
        setMessage('Respaldo restaurado. Recargando datos...')
        window.setTimeout(() => window.location.reload(), 800)
      } else if (result?.error !== 'Operación cancelada') {
        setError(result?.error ?? 'No se pudo restaurar el respaldo.')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo restaurar el respaldo.')
    } finally {
      setBusy(false)
    }
  }

  const disabled = !unlocked || !enabled || busy

  return (
    <section className="panel">
      <h3>
        <DatabaseBackup size={16} />
        Respaldos
      </h3>
      <p className="panel-description">
        Copia la base de datos local y restaura versiones anteriores si algo sale mal.
      </p>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <button type="button" className="primary-button" onClick={() => void create()} disabled={disabled}>
          <Save size={15} />
          {busy ? 'Procesando...' : 'Crear respaldo ahora'}
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={() => void window.minierp?.revealBackups?.()}
          disabled={!unlocked || !enabled}
        >
          <FolderOpen size={15} />
          Abrir carpeta
        </button>
      </div>

      {!unlocked ? (
        <p className="settings-row__subtitle">Desbloquea con PIN para gestionar los respaldos.</p>
      ) : !enabled ? (
        <p className="settings-row__subtitle">Los respaldos están deshabilitados por permisos.</p>
      ) : loading ? (
        <p className="settings-row__subtitle">Cargando respaldos...</p>
      ) : backups.length === 0 ? (
        <p className="settings-row__subtitle">Todavía no hay respaldos.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px' }}>
          {backups.map((backup) => (
            <li
              key={backup.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '8px 12px',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px'
              }}
            >
              <div>
                <p className="settings-row__title" style={{ margin: 0 }}>
                  {backup.name}
                </p>
                <p className="settings-row__subtitle" style={{ margin: 0 }}>
                  {formatDate(backup.createdAt)} · {formatBytes(backup.sizeBytes)}
                </p>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => void restore(backup)}
                disabled={disabled}
              >
                <RotateCcw size={15} />
                Restaurar
              </button>
            </li>
          ))}
        </ul>
      )}

      {message ? <p className="settings-row__subtitle">{message}</p> : null}
      {error ? <p className="field-error">{error}</p> : null}
    </section>
  )
}
