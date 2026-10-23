import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { app, Notification } from 'electron'
import {
  autoUpdater,
  type ProgressInfo,
  type UpdateInfo
} from 'electron-updater'
import type { UpdateState } from '../shared/ipc'

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000
const INITIAL_DELAY_MS = 4_000

export class UpdateService {
  private state: UpdateState = {
    phase: 'idle',
    currentVersion: app.getVersion(),
    availableVersion: null,
    progress: null,
    message: ''
  }

  private timer: NodeJS.Timeout | null = null

  constructor(
    private readonly publishState: (state: UpdateState) => void,
    private readonly beforeInstall: () => Promise<void>,
    private readonly focusWindow: () => void
  ) {}

  getState(): UpdateState {
    return { ...this.state }
  }

  start(): void {
    if (!this.isSupported()) {
      this.setState({
        phase: 'disabled',
        message: this.disabledReason()
      })
      return
    }

    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.allowPrerelease = false

    autoUpdater.on('checking-for-update', () => {
      this.setState({
        phase: 'checking',
        progress: null,
        message: 'Buscando actualizaciones...'
      })
    })

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.setState({
        phase: 'available',
        availableVersion: info.version,
        progress: null,
        message: `La versión ${info.version} está disponible. Descargando en segundo plano.`
      })
      this.notify(
        'Actualización disponible',
        `MiniERP ${info.version} se está descargando en segundo plano.`
      )
    })

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      this.setState({
        phase: 'downloading',
        progress: Math.max(0, Math.min(100, Math.round(progress.percent))),
        message: 'Descargando la actualización...'
      })
    })

    autoUpdater.on('update-downloaded', async (info: UpdateInfo) => {
      this.setState({
        phase: 'downloaded',
        availableVersion: info.version,
        progress: 100,
        message: `MiniERP ${info.version} se está instalando...`
      })
      this.notify(
        'Actualización lista',
        `MiniERP ${info.version} se instalará y reiniciará automáticamente.`
      )
      try {
        await this.beforeInstall()
      } catch {
        // Ignorar errores de cierre previo
      }
      setTimeout(() => {
        autoUpdater.quitAndInstall(true, true)
      }, 500)
    })

    autoUpdater.on('update-not-available', () => {
      this.setState({
        phase: 'not-available',
        availableVersion: null,
        progress: null,
        message: 'Ya tienes la última versión de MiniERP.'
      })
    })

    autoUpdater.on('error', () => {
      this.setState({
        phase: 'error',
        progress: null,
        message:
          'No se pudo completar la búsqueda de actualizaciones. Se volverá a intentar automáticamente.'
      })
    })

    this.timer = setTimeout(() => {
      void this.check()
      this.timer = setInterval(() => {
        void this.check()
      }, CHECK_INTERVAL_MS)
    }, INITIAL_DELAY_MS)
  }

  async check(): Promise<UpdateState> {
    if (!this.isSupported()) {
      this.setState({ phase: 'disabled', message: this.disabledReason() })
      return this.getState()
    }

    if (
      this.state.phase === 'checking' ||
      this.state.phase === 'downloading' ||
      this.state.phase === 'downloaded'
    ) {
      return this.getState()
    }

    this.setState({
      phase: 'checking',
      progress: null,
      message: 'Buscando actualizaciones...'
    })

    try {
      await autoUpdater.checkForUpdates()
    } catch {
      this.setState({
        phase: 'error',
        progress: null,
        message:
          'No se pudo buscar actualizaciones. Revisa tu conexión; MiniERP volverá a intentarlo.'
      })
    }

    return this.getState()
  }

  async install(): Promise<void> {
    if (this.state.phase !== 'downloaded') return
    await this.beforeInstall()
    autoUpdater.quitAndInstall(true, true)
  }

  dispose(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private isSupported(): boolean {
    if (!app.isPackaged || process.platform !== 'win32') return false
    if (process.env.MINIERP_DISABLE_UPDATES === '1') return false
    return existsSync(join(process.resourcesPath, 'app-update.yml'))
  }

  private disabledReason(): string {
    if (!app.isPackaged) return 'Las actualizaciones automáticas solo están activas en la app instalada.'
    if (process.platform !== 'win32') return 'Las actualizaciones automáticas están disponibles en Windows.'
    if (process.env.MINIERP_DISABLE_UPDATES === '1') return 'Las actualizaciones automáticas están desactivadas.'
    return 'El canal de actualizaciones todavía no está configurado.'
  }

  private setState(update: Partial<UpdateState>): void {
    this.state = { ...this.state, ...update }
    this.publishState(this.getState())
  }

  private notify(title: string, body: string): void {
    if (!Notification.isSupported()) return
    const notification = new Notification({ title, body })
    notification.on('click', this.focusWindow)
    notification.show()
  }
}
