import { FileUp, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react'
import { useLicense } from '../hooks/useLicense'

export function LicenseSystemPanel() {
  const { loaded, data, filePath, importLicense, loading, error } = useLicense()

  const handleImport = async () => {
    try {
      await importLicense()
    } catch {
      // error handled in hook
    }
  }

  return (
    <section className="panel">
      <div className="flex items-center gap-2 mb-2">
        <span className="plan-icon">
          <ShieldCheck size={18} />
        </span>
        <div>
          <p className="eyebrow">Licencia</p>
          <h3>Licencia del Sistema</h3>
        </div>
      </div>
      <p className="panel-description">
        Carga un archivo de licencia (.json / .key) para habilitar o deshabilitar módulos.
      </p>

      <div className="mt-3 space-y-2 text-sm">
        {loaded && data ? (
          <>
            <div className="flex justify-between">
              <span className="text-white/60">Cliente</span>
              <span>{data.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">RIF</span>
              <span>{data.rif}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Vence</span>
              <span>{data.expiresAt}</span>
            </div>
            {filePath ? (
              <div className="text-xs text-white/40 truncate" title={filePath}>
                Origen: {filePath}
              </div>
            ) : null}
            <div className="pt-2">
              <p className="text-xs text-white/60 mb-2">Módulos habilitados</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  {data.modules.inventory ? <CheckCircle2 size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-white/40" />}
                  <span>Inventario</span>
                </li>
                <li className="flex items-center gap-2">
                  {data.modules.finances ? <CheckCircle2 size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-white/40" />}
                  <span>Finanzas</span>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <p className="text-sm text-white/60">No hay archivo de licencia cargado.</p>
        )}
        {error ? <p className="text-sm text-amber-400">{error}</p> : null}
      </div>

      <button className="primary-button w-full mt-4" onClick={() => void handleImport()} disabled={loading}>
        <FileUp size={16} />
        {loading ? 'Cargando...' : 'Cargar Archivo de Licencia'}
      </button>
    </section>
  )
}
