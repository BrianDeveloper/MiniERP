import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { api } from '../api/client'
import type { BusinessProfile, BusinessUpdateInput } from '../../../shared/types/business'
import type { PlanConfig } from '../../../shared/types/plan'
import type { SystemInfo } from '../../../shared/types/system'
import { ErrorScreen, StartupScreen } from '../components/StatusScreen'

interface AppData {
  business: BusinessProfile
  plan: PlanConfig
  system: SystemInfo
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  saveBusiness: (input: BusinessUpdateInput) => Promise<BusinessProfile>
}

interface AppDataState {
  business: BusinessProfile | null
  plan: PlanConfig | null
  system: SystemInfo | null
  loading: boolean
  error: string | null
}

const AppDataContext = createContext<AppData | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppDataState>({
    business: null,
    plan: null,
    system: null,
    loading: true,
    error: null
  })

  const load = useCallback(async () => {
    setState((previous) => ({ ...previous, loading: true, error: null }))

    try {
      const [business, plan, system] = await Promise.all([
        api.getBusiness(),
        api.getPlan(),
        api.getSystemInfo()
      ])
      setState({ business, plan, system, loading: false, error: null })
    } catch (error) {
      setState((previous) => ({
        ...previous,
        loading: false,
        error: error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
      }))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const saveBusiness = useCallback(async (input: BusinessUpdateInput) => {
    const business = await api.updateBusiness(input)
    setState((previous) => ({ ...previous, business }))
    return business
  }, [])

  const value = useMemo<AppData | null>(() => {
    if (!state.business || !state.plan || !state.system) return null

    return {
      business: state.business,
      plan: state.plan,
      system: state.system,
      loading: state.loading,
      error: state.error,
      reload: load,
      saveBusiness
    }
  }, [state, load, saveBusiness])

  if (!value) {
    if (state.error) {
      return <ErrorScreen message={state.error} onRetry={() => void load()} />
    }
    return <StartupScreen />
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData(): AppData {
  const context = useContext(AppDataContext)
  if (!context) {
    throw new Error('useAppData debe utilizarse dentro de AppDataProvider.')
  }
  return context
}
