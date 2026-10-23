import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppDataProvider } from './app/AppDataProvider'
import { LauncherPage } from './app/LauncherPage'
import { ModuleWorkspacePage } from './app/ModuleWorkspacePage'
import { SettingsPage } from './app/SettingsPage'
import { UpdateBanner } from './components/UpdateBanner'
import { FinancePage } from './modules/finance/FinancePage'
import { InventoryPage } from './modules/inventory/InventoryPage'

export function App() {
  return (
    <HashRouter>
      <AppDataProvider>
        <Routes>
          <Route path="/" element={<LauncherPage />} />
          <Route path="/module/inventory" element={<InventoryPage />} />
          <Route path="/module/finance" element={<FinancePage />} />
          <Route path="/module/:moduleId" element={<ModuleWorkspacePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <UpdateBanner />
      </AppDataProvider>
    </HashRouter>
  )
}
