import { useState } from 'react'
import { Download, FileKey } from 'lucide-react'
import { downloadJson, sanitizeFilename } from './utils/download'

interface LicenseForm {
  clientName: string
  rif: string
  expiresAt: string
  inventory: boolean
  finances: boolean
}

export default function App() {
  const [form, setForm] = useState<LicenseForm>({
    clientName: '',
    rif: '',
    expiresAt: '',
    inventory: true,
    finances: true
  })
  const [error, setError] = useState('')

  const update = (key: keyof LicenseForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  const generate = () => {
    setError('')
    if (!form.clientName.trim()) return setError('Ingrese el nombre del cliente')
    if (!form.rif.trim()) return setError('Ingrese el RIF / Identificación')
    if (!form.expiresAt) return setError('Seleccione la fecha de expiración')

    const license = {
      clientName: form.clientName.trim(),
      rif: form.rif.trim(),
      expiresAt: form.expiresAt,
      modules: {
        inventory: form.inventory,
        finances: form.finances
      }
    }

    const filename = `licencia_${sanitizeFilename(form.clientName)}.key`
    downloadJson(filename, license)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-cyan-400/20 flex items-center justify-center">
              <FileKey className="text-cyan-300" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Generador de Licencias MiniERP</h1>
              <p className="text-sm text-white/60">Panel externo para generar archivos .key</p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/[0.02] shadow-[0_60px_140px_-80px_rgba(56,189,248,0.9)] overflow-hidden">
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Nombre del Cliente</label>
              <input
                value={form.clientName}
                onChange={(e) => update('clientName', e.target.value)}
                placeholder="Ej. Comercial XYZ C.A."
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-white outline-none focus:border-white/40"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">RIF / Identificación</label>
              <input
                value={form.rif}
                onChange={(e) => update('rif', e.target.value)}
                placeholder="J-12345678-9"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-white outline-none focus:border-white/40"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Fecha de Expiración</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => update('expiresAt', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-white outline-none focus:border-white/40"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Módulos</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={form.inventory}
                    onChange={(e) => update('inventory', e.target.checked)}
                  />
                  <span>Inventario</span>
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={form.finances}
                    onChange={(e) => update('finances', e.target.checked)}
                  />
                  <span>Finanzas</span>
                </label>
              </div>
            </div>
            {error ? <p className="text-sm text-amber-400">{error}</p> : null}
            <button
              onClick={generate}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400/80 to-cyan-400/80 px-4 py-2.5 text-white font-medium hover:from-sky-400 hover:to-cyan-400"
            >
              <Download size={18} />
              Generar y Descargar Licencia
            </button>
          </div>
          <div className="border-t border-white/10 px-6 py-4 text-xs text-white/40">
            Se generará el archivo: <span className="text-white/70">licencia_[cliente].key</span> con estructura JSON exacta.
          </div>
        </section>
      </div>
    </div>
  )
}
