import { useCallback, useEffect, useState } from 'react'
import type { UpdateState } from '../../../shared/ipc'

export function useUpdater() {
  const [state, setState] = useState<UpdateState | null>(null)

  useEffect(() => {
    const bridge = window.minierp
    if (!bridge) return

    let active = true
    void bridge.getUpdateState().then((next) => {
      if (active) setState(next)
    })

    const unsubscribe = bridge.onUpdateState((next) => {
      setState(next)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const check = useCallback(async () => {
    const bridge = window.minierp
    if (!bridge) return
    setState(await bridge.checkForUpdates())
  }, [])

  const install = useCallback(async () => {
    await window.minierp?.installUpdate()
  }, [])

  return { state, check, install }
}
