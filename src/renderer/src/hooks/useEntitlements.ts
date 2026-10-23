import { useEffect, useState } from 'react'
import { DEFAULT_ENTITLEMENTS, type Entitlements } from '../../../shared/types/entitlements'

export function useEntitlements() {
  const [entitlements, setEntitlements] = useState<Entitlements>(DEFAULT_ENTITLEMENTS)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const data = await window.minierp?.getEntitlements?.()
      if (data) setEntitlements(data)
    } catch {
      setEntitlements(DEFAULT_ENTITLEMENTS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return { entitlements, loading, reload: load }
}
