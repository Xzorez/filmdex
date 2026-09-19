import { BrowserWindow, app } from 'electron'
import pkg from 'electron-updater'
import type { UpdateState } from '../../shared/types'

// electron-updater es CommonJS: el named import directo no es fiable en todos
// los empaquetados, así que lo sacamos del objeto por defecto.
const { autoUpdater } = pkg

let target: BrowserWindow | null = null
let last: UpdateState = { status: 'idle' }

function emit(state: UpdateState): void {
  last = state
  if (target && !target.isDestroyed()) target.webContents.send('updater:state', state)
}

export function currentState(): UpdateState {
  return last
}

export function initUpdater(window: BrowserWindow): void {
  target = window
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => emit({ status: 'checking' }))
  autoUpdater.on('update-available', (info) => emit({ status: 'available', version: info.version }))
  autoUpdater.on('update-not-available', () => emit({ status: 'none', version: app.getVersion() }))
  autoUpdater.on('download-progress', (progress) =>
    emit({ status: 'downloading', percent: Math.round(progress.percent) })
  )
  autoUpdater.on('update-downloaded', (info) => emit({ status: 'ready', version: info.version }))
  autoUpdater.on('error', (error) => emit({ status: 'error', message: error.message }))
}

export async function checkForUpdates(): Promise<UpdateState> {
  if (!app.isPackaged) {
    // En desarrollo no hay instalador que actualizar.
    emit({ status: 'none', version: app.getVersion(), message: 'Modo desarrollo' })
    return last
  }
  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    emit({ status: 'error', message: (error as Error).message })
  }
  return last
}

export async function downloadUpdate(): Promise<void> {
  if (!app.isPackaged) return
  try {
    await autoUpdater.downloadUpdate()
  } catch (error) {
    emit({ status: 'error', message: (error as Error).message })
  }
}

export function installUpdate(): void {
  if (!app.isPackaged) return
  autoUpdater.quitAndInstall()
}
