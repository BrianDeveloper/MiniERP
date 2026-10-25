import { useCallback, useEffect, useState } from 'react'
import type { LicenseState } from '../../../shared/types/license'

export function useLicense() {
  const [state, setState] = useState<LicenseState>({
    loaded: false,
    filePath: null,
    data: null,
    validUntil: null
  })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const api = window.minierp
      if (!api?.licenseGet) return
      const res = await api.licenseGet()
      setState(res)
    } finally {
      setLoading(false)
    }
  }, [])

  const importLicense = useCallback(async () => {
    const api = window.minierp
    if (!api?.licenseImport) throw new Error('API de licencia no disponible')
    const res = await api.licenseImport()
    setState(res)
    return res
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
      if (!state.loaded || !state.data) return false
      if (Array.isArray(state.data.features)) {
        return state.data.features.includes(feature)
      }
      return isModuleEnabled(feature)
    },
    [state, isModuleEnabled]
  )

  return { ...state, loading, refresh, importLicense, isModuleEnabled, hasFeature }
}
