import { randomBytes } from 'node:crypto'
import { join, resolve } from 'node:path'
import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron'
import { ConfigService } from '../server/config/config-service'
import { startApiServer, type RunningApi } from '../server'
import { IPC_CHANNELS, type ApiConnection, type UpdateState } from '../shared/ipc'
import { UpdateService } from './update-service'
import { createMainWindow } from './window'

app.setName('MiniERP')
if (process.platform === 'win32') {
  app.setAppUserModelId('com.minierp.desktop')
}

const hasSingleInstanceLock = app.requestSingleInstanceLock()

if (!hasSingleInstanceLock) {
  app.quit()
} else {
  let mainWindow: BrowserWindow | null = null
  let api: RunningApi | null = null
  let connection: ApiConnection | null = null
  let updates: UpdateService | null = null

  const publishUpdateState = (state: UpdateState): void => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(IPC_CHANNELS.updateStateChanged, state)
    }
  }

  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  app.whenReady().then(async () => {
    try {
      Menu.setApplicationMenu(null)

      const dataDir = process.env.MINIERP_DATA_DIR
        ? resolve(process.env.MINIERP_DATA_DIR)
        : app.getPath('userData')
      const defaultsDir = app.isPackaged
        ? join(process.resourcesPath, 'config')
        : join(app.getAppPath(), 'resources', 'config')

      const config = new ConfigService(dataDir, defaultsDir)
      await config.init()

      const token = randomBytes(32).toString('hex')
      api = await startApiServer({
        config,
        token,
        appVersion: app.getVersion(),
        dataDir
      })

      connection = {
        baseUrl: `http://127.0.0.1:${api.port}`,
        token
      }

      ipcMain.handle(IPC_CHANNELS.connection, () => connection)

      updates = new UpdateService(
        publishUpdateState,
        async () => {
          await api?.close()
          api = null
        },
        () => {
          if (!mainWindow) return
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.show()
          mainWindow.focus()
        }
      )

      ipcMain.handle(IPC_CHANNELS.updateState, () => updates?.getState())
      ipcMain.handle(IPC_CHANNELS.updateCheck, async () => {
        if (!updates) throw new Error('El servicio de actualizaciones no está disponible.')
        return updates.check()
      })
      ipcMain.handle(IPC_CHANNELS.updateInstall, async () => {
        if (!updates) throw new Error('El servicio de actualizaciones no está disponible.')
        await updates.install()
      })

      mainWindow = createMainWindow()
      mainWindow.on('closed', () => {
        mainWindow = null
      })

      updates.start()
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      dialog.showErrorBox('No se pudo iniciar MiniERP', detail)
      app.quit()
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && connection) {
      mainWindow = createMainWindow()
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('before-quit', () => {
    updates?.dispose()
    void api?.close()
  })
}
