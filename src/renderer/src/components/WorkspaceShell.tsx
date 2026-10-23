import { ArrowLeft, type LucideIcon } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface WorkspaceShellProps {
  title: string
  subtitle: string
  icon: LucideIcon
  accent: string
  children: ReactNode
  actions?: ReactNode
}

export function WorkspaceShell({
  title,
  subtitle,
  icon: Icon,
  accent,
  children,
  actions
}: WorkspaceShellProps) {
  const navigate = useNavigate()
  const style = { '--module-accent': accent } as CSSProperties

  return (
    <div className="workspace" style={style}>
      <header className="workspace-header">
        <button type="button" className="back-button" onClick={() => navigate('/')}>
          <ArrowLeft size={17} />
          Escritorio
        </button>

        <div className="workspace-title">
          <span className="workspace-icon">
            <Icon size={20} strokeWidth={1.8} />
          </span>
          <div>
            <p className="eyebrow">{subtitle}</p>
            <h1>{title}</h1>
          </div>
        </div>

        {actions ? <div className="workspace-actions">{actions}</div> : null}
      </header>

      <main className="workspace-body">{children}</main>
    </div>
  )
}
