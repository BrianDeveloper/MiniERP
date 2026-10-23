import { Compass, Layers, ShieldCheck } from 'lucide-react'
import { Navigate, useParams } from 'react-router-dom'
import { LockedModulePanel } from '../components/LockedModulePanel'
import { WorkspaceShell } from '../components/WorkspaceShell'
import { canOpenModule, getModule } from '../modules/registry'
import { useAppData } from './AppDataProvider'

export function ModuleWorkspacePage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const { plan } = useAppData()
  const module = moduleId ? getModule(moduleId) : undefined

  if (!module) {
    return <Navigate to="/" replace />
  }

  const locked = module.planModule ? !canOpenModule(module, plan) : false

  return (
    <WorkspaceShell
      title={module.title}
      subtitle={module.kicker}
      icon={module.icon}
      accent={module.accent}
      actions={
        <span className={`workspace-badge${locked ? ' is-locked' : ''}`}>
          {locked ? 'Bloqueado por plan' : 'Base conectada'}
        </span>
      }
    >
      {locked ? (
        <LockedModulePanel module={module} />
      ) : (
        <>
          <section className="workspace-hero">
            <span className="phase-chip">
              <Compass size={14} />
              {module.phase} · espacio preparado
            </span>
            <h2>{module.title} ya tiene su lugar en MiniERP</h2>
            <p>
              El espacio de trabajo está aislado, conectado a la configuración local y protegido
              por el plan activo. Las funciones de negocio de este módulo se incorporan en la
              siguiente fase.
            </p>
          </section>

          <div className="foundation-grid">
            <article className="foundation-card">
              <Compass size={20} />
              <h3>Ruta independiente</h3>
              <p>
                Cada módulo abre su propio espacio mediante el enrutador interno del lanzador.
              </p>
            </article>
            <article className="foundation-card">
              <ShieldCheck size={20} />
              <h3>Control por licencia</h3>
              <p>
                El acceso se resuelve desde el plan activo antes de mostrar cualquier pantalla.
              </p>
            </article>
            <article className="foundation-card">
              <Layers size={20} />
              <h3>Base modular</h3>
              <p>
                El módulo puede crecer de forma aislada sin acoplarse a los demás componentes.
              </p>
            </article>
          </div>
        </>
      )}
    </WorkspaceShell>
  )
}
