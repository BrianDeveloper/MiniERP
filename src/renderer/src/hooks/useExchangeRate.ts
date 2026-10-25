import { useCallback, useEffect, useState } from 'react'
import type { ExchangeRateState } from '../../../shared/types/exchange-rate'

const initialState: ExchangeRateState = {
  rate: 0,
  source: 'manual',
  lastUpdated: null,
  isStale: true,
  updatedToday: false
}

export function useExchangeRate() {
  const [state, setState] = useState<ExchangeRateState>(initialState)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await window.minierp?.getExchangeRate?.()
      if (res) setState(res)
    } catch (error) {
      console.error('[useExchangeRate] get error', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshAuto = useCallback(async () => {
    setUpdating(true)
    try {
      const res = await window.minierp?.fetchExchangeRateAuto?.()
      if (res) setState(res)
      return res
    } catch (error) {
      console.error('[useExchangeRate] fetchAuto error', error)
      await load()
      throw error
    } finally {
      setUpdating(false)
    }
  }, [load])

  const setManual = useCallback(async (rate: number) => {
    setUpdating(true)
    try {
      const res = await window.minierp?.updateExchangeRateManual?.(rate)
      if (res) setState(res)
      return res
    } catch (error) {
      console.error('[useExchangeRate] updateManual error', error)
      throw error
    } finally {
      setUpdating(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return {
    ...state,
    loading,
    updating,
    load,
    refreshAuto,
    setManual
  }
}
