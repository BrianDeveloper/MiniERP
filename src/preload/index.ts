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
  },
  pinHas: () => ipcRenderer.invoke(IPC_CHANNELS.pinHas) as Promise<boolean>,
  pinSet: (pin: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.pinSet, pin) as Promise<{ ok: boolean; error?: string }>,
  pinVerify: (pin: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.pinVerify, pin) as Promise<{ ok: boolean }>,
  pinChange: (oldPin: string, newPin: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.pinChange, oldPin, newPin) as Promise<{ ok: boolean; error?: string }>,
  pinDisable: (currentPin: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.pinDisable, currentPin) as Promise<{ ok: boolean; error?: string }>,
  factoryReset: (confirm: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.factoryReset, confirm) as Promise<{ ok: boolean; error?: string }>
}

contextBridge.exposeInMainWorld('minierp', bridge)
