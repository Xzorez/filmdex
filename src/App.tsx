import { useCallback, useEffect, useState, type JSX } from 'react'
import type { Movie, NewMovie, Settings, UpdateState } from '../shared/types'
import { AddView } from './components/AddView'
import { LibraryView } from './components/LibraryView'
import { MovieSheet } from './components/MovieSheet'
import { SettingsView } from './components/SettingsView'
import { Sidebar, type View } from './components/Sidebar'
import { IconDownload, IconPlus } from './components/icons'

interface Toast {
  id: number
  message: string
  kind: 'ok' | 'bad'
}

const TITLES: Record<View, { title: string; sub: string }> = {
  library: { title: 'Mi coleccion', sub: 'Las peliculas que tienes en casa' },
  wishlist: { title: 'Quiero verla', sub: 'Lo que te falta por comprar o ver' },
  add: { title: 'Anadir pelicula', sub: 'Busca por titulo en TMDB' },
  settings: { title: 'Ajustes', sub: 'Clave de TMDB, copias y actualizaciones' }
}

export function App(): JSX.Element {
  const [view, setView] = useState<View>('library')
  const [movies, setMovies] = useState<Movie[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [selected, setSelected] = useState<Movie | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [update, setUpdate] = useState<UpdateState>({ status: 'idle' })
  const [info, setInfo] = useState({ version: '0.0.0', dataDir: '' })
  const [ready, setReady] = useState(false)

  const notify = useCallback((message: string, kind: 'ok' | 'bad' = 'ok'): void => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message, kind }])
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000)
  }, [])

  const fail = useCallback((message: string): void => notify(message, 'bad'), [notify])

  useEffect(() => {
    void (async () => {
      try {
        const [loaded, stored, appInfo, state] = await Promise.all([
          window.filmdex.library.list(),
          window.filmdex.settings.get(),
          window.filmdex.app.info(),
          window.filmdex.updater.state()
        ])
        setMovies(loaded)
        setSettings(stored)
        setInfo(appInfo)
        setUpdate(state)
        // Sin clave no se puede hacer nada util, asi que empezamos en Ajustes.
        if (!stored.tmdbApiKey.trim()) setView('settings')
      } catch (error) {
        fail((error as Error).message)
      } finally {
        setReady(true)
      }
    })()

    return window.filmdex.updater.onState(setUpdate)
  }, [fail])

  const addMovie = async (movie: NewMovie): Promise<void> => {
    const saved = await window.filmdex.library.add(movie)
    setMovies((current) => [saved, ...current])
    notify(`"${saved.title}" anadida a ${saved.status === 'owned' ? 'tu coleccion' : 'tu lista'}`)
  }

  const patchMovie = (id: string, patch: Partial<Movie>): void => {
    // Optimista: la ficha responde al instante y el disco se pone al dia despues.
    setMovies((current) => current.map((movie) => (movie.id === id ? { ...movie, ...patch } : movie)))
    setSelected((current) => (current && current.id === id ? { ...current, ...patch } : current))
    void window.filmdex.library.update(id, patch).catch((error: Error) => fail(error.message))
  }

  const deleteMovie = async (movie: Movie): Promise<void> => {
    setSelected(null)
    setMovies((current) => current.filter((item) => item.id !== movie.id))
    try {
      await window.filmdex.library.remove(movie.id)
      notify(`"${movie.title}" eliminada`)
    } catch (error) {
      fail((error as Error).message)
    }
  }

  const saveSettings = async (patch: Partial<Settings>): Promise<void> => {
    try {
      setSettings(await window.filmdex.settings.set(patch))
    } catch (error) {
      fail((error as Error).message)
    }
  }

  const exportLibrary = async (): Promise<void> => {
    try {
      const target = await window.filmdex.library.export()
      if (target) notify('Coleccion exportada')
    } catch (error) {
      fail((error as Error).message)
    }
  }

  const importLibrary = async (): Promise<void> => {
    try {
      const summary = await window.filmdex.library.import()
      if (!summary) return
      setMovies(await window.filmdex.library.list())
      notify(`${summary.added} anadidas, ${summary.skipped} repetidas`)
    } catch (error) {
      fail((error as Error).message)
    }
  }

  if (!ready || !settings) {
    return (
      <div className="loading-row" style={{ height: '100%' }}>
        <span className="spinner" />
        Abriendo tu coleccion...
      </div>
    )
  }

  const page = TITLES[view]
  const hasApiKey = settings.tmdbApiKey.trim().length > 0

  return (
    <div className="app">
      <Sidebar view={view} onChange={setView} movies={movies} version={info.version} />

      <div className="main">
        {(update.status === 'available' || update.status === 'ready') && view !== 'settings' && (
          <div className="banner">
            <IconDownload className="nav-icon" />
            <span>
              {update.status === 'ready'
                ? `La version ${update.version} esta lista para instalarse.`
                : `Hay una version nueva de Filmdex (${update.version}).`}
            </span>
            <span className="spacer" />
            <button
              className="btn btn-primary btn-sm"
              onClick={() =>
                void (update.status === 'ready'
                  ? window.filmdex.updater.install()
                  : window.filmdex.updater.download())
              }
            >
              {update.status === 'ready' ? 'Reiniciar e instalar' : 'Descargar'}
            </button>
          </div>
        )}

        <header className="topbar">
          <div>
            <h1 className="page-title">{page.title}</h1>
            <p className="page-sub">{page.sub}</p>
          </div>
          <div className="topbar-actions">
            {view !== 'add' && view !== 'settings' && (
              <button className="btn btn-primary" onClick={() => setView('add')}>
                <IconPlus />
                Anadir
              </button>
            )}
          </div>
        </header>

        <main className="content">
          {view === 'library' && (
            <LibraryView movies={movies} status="owned" onOpen={setSelected} onGoAdd={() => setView('add')} />
          )}
          {view === 'wishlist' && (
            <LibraryView movies={movies} status="wishlist" onOpen={setSelected} onGoAdd={() => setView('add')} />
          )}
          {view === 'add' && (
            <AddView
              movies={movies}
              hasApiKey={hasApiKey}
              onAdd={addMovie}
              onGoSettings={() => setView('settings')}
              onError={fail}
            />
          )}
          {view === 'settings' && (
            <SettingsView
              settings={settings}
              onSave={saveSettings}
              movies={movies}
              version={info.version}
              dataDir={info.dataDir}
              update={update}
              onImport={() => void importLibrary()}
              onExport={() => void exportLibrary()}
              onNotify={notify}
            />
          )}
        </main>
      </div>

      {selected && (
        <MovieSheet
          movie={selected}
          onClose={() => setSelected(null)}
          onPatch={patchMovie}
          onDelete={(movie) => void deleteMovie(movie)}
        />
      )}

      <div className="toasts">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast${toast.kind === 'bad' ? ' bad' : ''}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}
