import { useCallback, useEffect, useState } from 'react'
import type { LicenseState } from '../../../shared/types/license'

export function useLicense() {
  const [state, setState] = useState<LicenseState>({
    loaded: false,
    filePath: null,
    data: null,
    validUntil: null,
    error: null
  })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const api = window.minierp
      if (!api?.licenseGet) return
      const res = await api.licenseGet()
      setState(res)
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al cargar licencia'
      }))
    } finally {
      setLoading(false)
    }
  }, [])

  const importLicense = useCallback(async () => {
    const api = window.minierp
    if (!api?.licenseImport) throw new Error('API de licencia no disponible')
    try {
      const res = await api.licenseImport()
      setState(res)
      return res
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar licencia'
      setState((prev) => ({ ...prev, error: message }))
      throw error
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const isModuleEnabled = useCallback(
    (moduleId: string) => {
      if (!state.loaded || !state.data?.modules) return false
      const val = state.data.modules[moduleId]
      return val === true
    },
    [state]
  )

  const hasFeature = useCallback(
    (feature: string) => {
      return isModuleEnabled(feature)
    },
    [isModuleEnabled]
  )

  return { ...state, loading, refresh, importLicense, isModuleEnabled, hasFeature }
}
