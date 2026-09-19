import { useCallback, useEffect, useRef, useState, type JSX } from 'react'
import type { Movie, MovieDetails, SearchResult, Settings, Status, UpdateState } from '../shared/types'
import { CollectionView } from './components/CollectionView'
import { HomeView } from './components/HomeView'
import { MovieSheet } from './components/MovieSheet'
import { SearchView } from './components/SearchView'
import { SettingsView } from './components/SettingsView'
import { TonightPicker } from './components/TonightPicker'
import { TopNav, type View } from './components/TopNav'
import { TrailerPlayer } from './components/TrailerPlayer'
import { IconDownload } from './components/icons'
import { findOwned, fromSearchResult, ownedIndex, toDetails, toNewMovie } from './lib/movie'
import { clearDiscoverCache } from './lib/useDiscover'

interface Toast {
  id: number
  message: string
  kind: 'ok' | 'bad'
}

export function App(): JSX.Element {
  const [view, setView] = useState<View>('home')
  const [movies, setMovies] = useState<Movie[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState<string | null>(null)
  const [sheet, setSheet] = useState<{ details: MovieDetails; loading: boolean } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [update, setUpdate] = useState<UpdateState>({ status: 'idle' })
  const [info, setInfo] = useState({ version: '0.0.0', dataDir: '' })
  const [ready, setReady] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [trailer, setTrailer] = useState<{ key: string; title: string } | null>(null)
  const [tonight, setTonight] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)

  const notify = useCallback((message: string, kind: 'ok' | 'bad' = 'ok'): void => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message, kind }])
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3600)
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
        if (stored.source === 'tmdb' && !stored.tmdbApiKey.trim()) setView('settings')
      } catch (error) {
        fail((error as Error).message)
      } finally {
        setReady(true)
      }
    })()

    return window.filmdex.updater.onState(setUpdate)
  }, [fail])

  // La barra se vuelve opaca en cuanto la portada empieza a subir.
  useEffect(() => {
    const element = scroller.current
    if (!element) return
    const onScroll = (): void => setScrolled(element.scrollTop > 40)
    element.addEventListener('scroll', onScroll, { passive: true })
    return () => element.removeEventListener('scroll', onScroll)
  }, [ready])

  // Cada seccion empieza por arriba.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [view])

  const owned = ownedIndex(movies)

  /** Abre la ficha y, si faltan datos, los completa sin bloquear. */
  const openDetails = async (base: MovieDetails, needsFetch: boolean): Promise<void> => {
    setSheet({ details: base, loading: needsFetch })
    if (!needsFetch) return
    try {
      const full = await window.filmdex.sources.details(base.source, base.sourceId)
      setSheet((current) =>
        current && current.details.sourceId === base.sourceId ? { details: full, loading: false } : current
      )
    } catch (error) {
      setSheet((current) => (current ? { ...current, loading: false } : current))
      fail((error as Error).message)
    }
  }

  // Las listas de descubrir vienen completas salvo la sinopsis larga, que solo
  // se pide al abrir la ficha.
  const openFromCatalog = (details: MovieDetails): void => {
    void openDetails(details, true)
  }

  const openFromSearch = (result: SearchResult): void => {
    void openDetails(fromSearchResult(result), true)
  }

  const openFromCollection = (movie: Movie): void => {
    const details = toDetails(movie)
    // Las guardadas antes de existir los trailers no saben si tienen uno: se
    // pregunta una vez en segundo plano y se apunta, sea cual sea la respuesta.
    const unknownTrailer = movie.trailerKey === undefined && details.sourceId !== ''
    setSheet({ details, loading: unknownTrailer })
    if (!unknownTrailer) return

    window.filmdex.sources
      .details(details.source, details.sourceId)
      .then((full) => {
        patchMovie(movie.id, { trailerKey: full.trailerKey })
        setSheet((current) =>
          current && current.details.sourceId === details.sourceId
            ? { details: { ...current.details, trailerKey: full.trailerKey }, loading: false }
            : current
        )
      })
      .catch(() => setSheet((current) => (current ? { ...current, loading: false } : current)))
  }

  const playTrailer = (details: MovieDetails): void => {
    if (details.trailerKey) setTrailer({ key: details.trailerKey, title: details.title })
  }

  const addMovie = async (details: MovieDetails, status: Status): Promise<void> => {
    setBusyId(details.sourceId)
    try {
      // Si la ficha aun no esta completa se rellena antes de guardarla, para
      // que la coleccion no se quede con huecos.
      const full =
        details.cast.length === 0 && details.runtime === null
          ? await window.filmdex.sources.details(details.source, details.sourceId).catch(() => details)
          : details

      const saved = await window.filmdex.library.add(toNewMovie(full, status))
      setMovies((current) => [saved, ...current])
      notify(`"${saved.title}" ${status === 'owned' ? 'anadida a tu coleccion' : 'guardada en tu lista'}`)
    } catch (error) {
      fail((error as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const patchMovie = (id: string, patch: Partial<Movie>): void => {
    setMovies((current) => current.map((movie) => (movie.id === id ? { ...movie, ...patch } : movie)))
    void window.filmdex.library.update(id, patch).catch((error: Error) => fail(error.message))
  }

  const deleteMovie = async (movie: Movie): Promise<void> => {
    setSheet(null)
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
      const next = await window.filmdex.settings.set(patch)
      // Cambiar de fuente o de idioma invalida las listas ya cargadas.
      if (patch.source || patch.language) clearDiscoverCache()
      setSettings(next)
    } catch (error) {
      fail((error as Error).message)
    }
  }

  const exportLibrary = async (): Promise<void> => {
    try {
      if (await window.filmdex.library.export()) notify('Coleccion exportada')
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
      <div className="loading-row" style={{ height: '100vh' }}>
        <span className="spinner" />
        Abriendo tu coleccion...
      </div>
    )
  }

  const needsTmdbKey = settings.source === 'tmdb' && settings.tmdbApiKey.trim().length === 0
  const sheetOwned = sheet ? findOwned(owned, sheet.details) : null
  const updateBanner = update.status === 'available' || update.status === 'ready'

  return (
    <div className="app">
      <TopNav
        view={view}
        onChange={setView}
        query={query}
        onQuery={setQuery}
        scrolled={scrolled || view !== 'home'}
        onSurprise={() => setTonight(true)}
      />

      {updateBanner && (
        <div className="banner">
          <IconDownload />
          <span>
            {update.status === 'ready'
              ? `Filmdex ${update.version} esta listo para instalarse.`
              : `Hay una version nueva de Filmdex (${update.version}).`}
          </span>
          <span className="spacer" />
          <button
            className="btn btn-light btn-sm"
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

      <div className="scroll" ref={scroller}>
        <div className="view-enter" key={view}>
        {view === 'home' && (
          <HomeView
            movies={movies}
            genre={genre}
            onGenre={setGenre}
            onOpen={openFromCatalog}
            onQuickAdd={(details) => void addMovie(details, 'owned')}
            onTrailer={playTrailer}
            busyId={busyId}
          />
        )}

        {view === 'collection' && (
          <CollectionView
            movies={movies}
            status="owned"
            onOpen={openFromCollection}
            onDiscover={() => setView('home')}
          />
        )}

        {view === 'wishlist' && (
          <CollectionView
            movies={movies}
            status="wishlist"
            onOpen={openFromCollection}
            onDiscover={() => setView('home')}
          />
        )}

        {view === 'search' && (
          <SearchView
            query={query}
            movies={movies}
            needsTmdbKey={needsTmdbKey}
            onOpen={openFromSearch}
            onGoSettings={() => setView('settings')}
          />
        )}

        {view === 'settings' && (
          <div className="page">
            <div className="page-head">
              <div>
                <h1 className="page-title">Ajustes</h1>
                <p className="page-sub">Fuente de fichas, copias y actualizaciones</p>
              </div>
            </div>
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
          </div>
        )}
        </div>
      </div>

      {sheet && (
        <MovieSheet
          details={sheet.details}
          owned={sheetOwned}
          loading={sheet.loading}
          busy={busyId === sheet.details.sourceId}
          onClose={() => setSheet(null)}
          onAdd={(status) => void addMovie(sheet.details, status)}
          onPatch={patchMovie}
          onDelete={(movie) => void deleteMovie(movie)}
          onTrailer={() => playTrailer(sheet.details)}
          hasTmdbKey={settings.tmdbApiKey.trim().length > 0}
          onGoSettings={() => {
            setSheet(null)
            setView('settings')
          }}
        />
      )}

      {tonight && (
        <TonightPicker
          movies={movies}
          onClose={() => setTonight(false)}
          onOpen={(movie) => {
            setTonight(false)
            openFromCollection(movie)
          }}
          onDiscover={() => {
            setTonight(false)
            setView('home')
          }}
        />
      )}

      {trailer && (
        <TrailerPlayer youtubeKey={trailer.key} title={trailer.title} onClose={() => setTrailer(null)} />
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
