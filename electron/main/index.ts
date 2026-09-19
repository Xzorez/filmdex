import { BrowserWindow, app, dialog, ipcMain, session, shell } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { DiscoverQuery, Movie, NewMovie, Settings, Source } from '../../shared/types'
import * as sources from './providers'
import * as titleCache from './providers/title-cache'
import { SourceError } from './providers'
import * as store from './store'
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
    backgroundColor: '#141414',
    title: 'Filmdex',
    // Sin marco de Windows: la barra de título y sus botones los dibuja la
    // propia interfaz, para que no rompan el conjunto.
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  // La interfaz necesita saber si esta maximizada para cambiar el icono del
  // botón y los redondeos.
  const sendMaximized = (): void => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:maximized', mainWindow.isMaximized())
    }
  }
  mainWindow.on('maximize', sendMaximized)
  mainWindow.on('unmaximize', sendMaximized)
  mainWindow.on('enter-full-screen', sendMaximized)
  mainWindow.on('leave-full-screen', sendMaximized)

  // Con el reproductor de YouTube enfocado, las teclas se quedan dentro de el
  // y la interfaz no se entera. Aquí se ven todas, así que Escape se reenvia
  // para poder cerrar el trailer. Si el video esta a pantalla completa, Escape
  // es para salir de ella y no se toca.
  let htmlFullScreen = false
  mainWindow.on('enter-html-full-screen', () => (htmlFullScreen = true))
  mainWindow.on('leave-html-full-screen', () => (htmlFullScreen = false))
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.type === 'keyDown' && input.key === 'Escape' && !htmlFullScreen) {
      mainWindow?.webContents.send('app:escape')
    }
  })

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
      const message = error instanceof SourceError ? error.message : (error as Error).message
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
      title: 'Exportar colección',
      defaultPath: `filmdex-${stamp}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return null
    await fs.writeFile(result.filePath, JSON.stringify({ version: 1, movies }, null, 2), 'utf8')
    return result.filePath
  })

  handle('library:import', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Importar colección',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const raw = JSON.parse(await fs.readFile(result.filePaths[0], 'utf8')) as { movies?: Movie[] }
    if (!Array.isArray(raw.movies)) throw new Error('El fichero no tiene una colección válida.')
    const incoming: NewMovie[] = raw.movies.map((movie) => {
      const { id, addedAt, ...rest } = movie
      void id
      void addedAt
      return rest
    })
    return store.addMany(incoming)
  })

  handle('sources:search', async (query: string) => sources.search(await store.getSettings(), query))
  handle('sources:details', async (source: Source, sourceId: string) =>
    sources.details(await store.getSettings(), source, sourceId)
  )
  handle('sources:discover', async (query: DiscoverQuery) => sources.discover(await store.getSettings(), query))
  handle('sources:watchProviders', async (tmdbId: number) =>
    sources.watchProviders(await store.getSettings(), tmdbId)
  )
  handle('sources:verifyTmdb', (apiKey: string, language: string) => sources.verifyTmdbKey(apiKey, language))

  handle('settings:get', () => store.getSettings())
  handle('settings:set', (patch: Partial<Settings>) => store.setSettings(patch))

  handle('app:info', () => ({ version: app.getVersion(), dataDir: store.dataDirectory() }))
  handle('app:openDataDir', () => shell.openPath(store.dataDirectory()))
  handle('app:openExternal', (url: string) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
  })

  handle('window:minimize', () => {
    mainWindow?.minimize()
  })
  handle('window:toggleMaximize', () => {
    if (!mainWindow) return false
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
    return mainWindow.isMaximized()
  })
  handle('window:close', () => {
    mainWindow?.close()
  })
  handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)

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
    // En produccion el renderer solo ejecuta y conecta lo suyo; las imagenes
    // pueden venir de cualquier https porque cada fuente sirve sus carátulas
    // desde un dominio distinto. En desarrollo se omite porque Vite necesita
    // inyectar sus propios scripts para el recargado en caliente.
    if (!isDev) {
      session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        // Solo la página de la app: si se aplicara también al reproductor de
        // YouTube incrustado, le prohibiria cargar sus propios scripts.
        if (details.resourceType !== 'mainFrame') {
          callback({ responseHeaders: details.responseHeaders })
          return
        }
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [
              "default-src 'self'; img-src 'self' https: data:; " +
                "style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; " +
                'frame-src https://www.youtube-nocookie.com'
            ]
          }
        })
      })
    }

    // YouTube rechaza con "Error 153" los videos incrustados que llegan sin
    // cabecera de origen, y una página cargada desde fichero no la manda. Se
    // añade aquí para que los trailers funcionen en la app instalada.
    session.defaultSession.webRequest.onBeforeSendHeaders(
      { urls: ['https://www.youtube-nocookie.com/*', 'https://www.youtube.com/*'] },
      (details, callback) => {
        if (!details.requestHeaders['Referer']) {
          details.requestHeaders['Referer'] = 'https://github.com/Xzorez/filmdex'
        }
        callback({ requestHeaders: details.requestHeaders })
      }
    )

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

  // La cache de títulos se guarda en diferido: al salir puede quedar algo sin
  // volcar, así que se fuerza aquí.
  app.on('before-quit', () => {
    void titleCache.flush()
  })
}
