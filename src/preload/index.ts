import { contextBridge, ipcRenderer } from 'electron'
import {
  IPC_CHANNELS,
  type ApiConnection,
  type MinierpBridge,
  type UpdateState
} from '../shared/ipc'

const bridge: MinierpBridge = {
  getConnection: () =>
    ipcRenderer.invoke(IPC_CHANNELS.connection) as Promise<ApiConnection>,
  getUpdateState: () =>
    ipcRenderer.invoke(IPC_CHANNELS.updateState) as Promise<UpdateState>,
  checkForUpdates: () =>
    ipcRenderer.invoke(IPC_CHANNELS.updateCheck) as Promise<UpdateState>,
  installUpdate: () => ipcRenderer.invoke(IPC_CHANNELS.updateInstall) as Promise<void>,
  onUpdateState: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, state: UpdateState): void => {
      listener(state)
    }
    ipcRenderer.on(IPC_CHANNELS.updateStateChanged, handler)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.updateStateChanged, handler)
    }
  }
}

contextBridge.exposeInMainWorld('minierp', bridge)
