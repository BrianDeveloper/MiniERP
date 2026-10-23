import { LockKeyhole } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AppModule } from '../modules/registry'

export function LockedModulePanel({ module }: { module: AppModule }) {
  const navigate = useNavigate()

  return (
    <section className="empty-panel">
      <span className="lock-hero">
        <LockKeyhole size={26} />
      </span>
      <p className="eyebrow">Acceso restringido</p>
      <h2>Este módulo no está incluido en tu plan</h2>
      <p>
        La licencia actual no habilita {module.title}. Cuando el módulo esté activo en tu plan,
        aparecerá disponible automáticamente en el escritorio.
      </p>
      <button type="button" className="primary-button" onClick={() => navigate('/')}>
        Volver al escritorio
      </button>
    </section>
  )
}
