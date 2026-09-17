import { BrowserWindow, app, dialog, ipcMain, session, shell } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { Movie, NewMovie, Settings } from '../../shared/types'
import * as store from './store'
import * as tmdb from './tmdb'
import { TmdbError } from './tmdb'
import { checkForUpdates, currentState, downloadUpdate, initUpdater, installUpdate } from './updater'

const isDev = !app.isPackaged
let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 620,
    show: false,
    backgroundColor: '#0d0f14',
    title: 'Filmdex',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  // Los enlaces externos se abren en el navegador, nunca dentro de la app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url)
    return { action: 'deny' }
  })

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (isDev && devUrl) {
    mainWindow.loadURL(devUrl)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  initUpdater(mainWindow)
}

/** Envuelve un handler para que los errores lleguen al renderer como texto util. */
function handle<A extends unknown[], R>(channel: string, fn: (...args: A) => Promise<R> | R): void {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      return { ok: true as const, data: await fn(...(args as A)) }
    } catch (error) {
      const message = error instanceof TmdbError ? error.message : (error as Error).message
      return { ok: false as const, error: message || 'Error inesperado' }
    }
  })
}

function registerHandlers(): void {
  handle('library:list', () => store.listMovies())
  handle('library:add', (movie: NewMovie) => store.addMovie(movie))
  handle('library:update', (id: string, patch: Partial<Movie>) => store.updateMovie(id, patch))
  handle('library:remove', (id: string) => store.removeMovie(id))

  handle('library:export', async () => {
    const movies = await store.listMovies()
    const stamp = new Date().toISOString().slice(0, 10)
    const result = await dialog.showSaveDialog({
      title: 'Exportar coleccion',
      defaultPath: `filmdex-${stamp}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return null
    await fs.writeFile(result.filePath, JSON.stringify({ version: 1, movies }, null, 2), 'utf8')
    return result.filePath
  })

  handle('library:import', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Importar coleccion',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const raw = JSON.parse(await fs.readFile(result.filePaths[0], 'utf8')) as { movies?: Movie[] }
    if (!Array.isArray(raw.movies)) throw new Error('El fichero no tiene una coleccion valida.')
    const incoming: NewMovie[] = raw.movies.map((movie) => {
      const { id, addedAt, ...rest } = movie
      void id
      void addedAt
      return rest
    })
    return store.addMany(incoming)
  })

  handle('tmdb:search', async (query: string) => tmdb.search(await store.getSettings(), query))
  handle('tmdb:details', async (tmdbId: number) => tmdb.details(await store.getSettings(), tmdbId))
  handle('tmdb:popular', async () => tmdb.popular(await store.getSettings()))
  handle('tmdb:verify', (apiKey: string, language: string) => tmdb.verifyKey(apiKey, language))

  handle('settings:get', () => store.getSettings())
  handle('settings:set', (patch: Partial<Settings>) => store.setSettings(patch))

  handle('app:info', () => ({ version: app.getVersion(), dataDir: store.dataDirectory() }))
  handle('app:openDataDir', () => shell.openPath(store.dataDirectory()))
  handle('app:openExternal', (url: string) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
  })

  handle('updater:state', () => currentState())
  handle('updater:check', () => checkForUpdates())
  handle('updater:download', () => downloadUpdate())
  handle('updater:install', () => installUpdate())
}

// Una sola instancia: abrir la app dos veces enfoca la ventana que ya existe.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    // En produccion el renderer solo puede cargar lo suyo y las caratulas de TMDB.
    // En desarrollo se omite porque Vite necesita inyectar scripts para el recargado.
    if (!isDev) {
      session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [
              "default-src 'self'; img-src 'self' https://image.tmdb.org data:; " +
                "style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'"
            ]
          }
        })
      })
    }

    registerHandlers()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    const settings = await store.getSettings()
    if (settings.autoUpdate) {
      // Un poco de margen para no competir con el arranque de la ventana.
      setTimeout(() => void checkForUpdates(), 4000)
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
