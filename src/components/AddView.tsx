import { useEffect, useRef, useState, type JSX } from 'react'
import { FORMATS, type Format, type Movie, type NewMovie, type SearchResult, type Status } from '../../shared/types'
import { Poster } from './Poster'
import { IconCheck, IconPlus, IconSearch, IconSettings } from './icons'

interface Props {
  movies: Movie[]
  /** La fuente elegida es TMDB pero todavia no hay clave: no se puede buscar. */
  needsTmdbKey: boolean
  onAdd: (movie: NewMovie) => Promise<void>
  onGoSettings: () => void
  onError: (message: string) => void
}

export function AddView({ movies, needsTmdbKey, onAdd, onGoSettings, onError }: Props): JSX.Element {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)
  const [format, setFormat] = useState<Format>('Blu-ray')
  const [status, setStatus] = useState<Status>('owned')
  const [busyId, setBusyId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => inputRef.current?.focus(), [])

  // Busqueda con retardo: no lanzamos una peticion por cada tecla.
  useEffect(() => {
    if (needsTmdbKey) return
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      setTouched(false)
      return
    }
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const found = await window.filmdex.sources.search(term)
        if (!cancelled) {
          setResults(found)
          setTouched(true)
        }
      } catch (error) {
        if (!cancelled) onError((error as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, needsTmdbKey, onError])

  const ownedIds = new Set(movies.map((m) => m.imdbId ?? String(m.tmdbId)))

  /** Al guardar pedimos la ficha completa: duracion, generos, director y reparto. */
  const handleAdd = async (result: SearchResult): Promise<void> => {
    setBusyId(result.sourceId)
    try {
      const full = await window.filmdex.sources.details(result.source, result.sourceId)
      await onAdd({
        source: full.source,
        imdbId: full.imdbId,
        tmdbId: full.tmdbId,
        title: full.title,
        originalTitle: full.originalTitle,
        year: full.year,
        overview: full.overview,
        posterUrl: full.posterUrl,
        backdropUrl: full.backdropUrl,
        runtime: full.runtime,
        genres: full.genres,
        director: full.director,
        cast: full.cast,
        voteAverage: full.voteAverage,
        format,
        status,
        watched: false,
        rating: null,
        notes: '',
        tags: [],
        watchedAt: null
      })
    } catch (error) {
      onError((error as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  if (needsTmdbKey) {
    return (
      <div className="empty">
        <IconSettings className="empty-icon" />
        <h3>Falta la clave de TMDB</h3>
        <p>
          Tienes elegida la fuente TMDB, que necesita una clave gratuita. Puedes anadirla en Ajustes o volver a la
          fuente que no pide cuenta.
        </p>
        <button className="btn btn-primary" onClick={onGoSettings}>
          Ir a Ajustes
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="toolbar">
        <div className="search-field" style={{ maxWidth: 480 }}>
          <IconSearch />
          <input
            ref={inputRef}
            className="input"
            placeholder="Escribe un titulo: Interstellar, El padrino..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <select className="select" style={{ width: 128 }} value={format} onChange={(e) => setFormat(e.target.value as Format)}>
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <select className="select" style={{ width: 140 }} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
          <option value="owned">La tengo</option>
          <option value="wishlist">La quiero</option>
        </select>
      </div>

      {loading && (
        <div className="loading-row">
          <span className="spinner" />
          Buscando en TMDB...
        </div>
      )}

      {!loading && touched && results.length === 0 && (
        <div className="empty">
          <IconSearch className="empty-icon" />
          <h3>Ninguna coincidencia</h3>
          <p>Prueba con el titulo original o quita el ano de la busqueda.</p>
        </div>
      )}

      {!loading && !touched && query.trim().length < 2 && (
        <div className="empty">
          <IconPlus className="empty-icon" />
          <h3>Busca una pelicula</h3>
          <p>
            Elige arriba el formato que tienes y el estado, y anade con un clic. Puedes cambiar los dos datos despues
            desde la ficha.
          </p>
        </div>
      )}

      <div className="result-list">
        {!loading &&
          results.map((result) => {
            const already = ownedIds.has(result.imdbId ?? String(result.tmdbId))
            return (
              <div key={result.sourceId} className="result">
                <Poster url={result.posterUrl} title={result.title} className="result-poster" />
                <div className="result-info">
                  <div className="result-title">
                    {result.title} {result.year && <span style={{ color: 'var(--text-faint)' }}>({result.year})</span>}
                  </div>
                  <div className="result-overview">{result.overview || 'Sin sinopsis en espanol.'}</div>
                </div>
                {already ? (
                  <span className="owned-flag">
                    <IconCheck className="nav-icon" />
                    Ya la tienes
                  </span>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={busyId === result.sourceId}
                    onClick={() => void handleAdd(result)}
                  >
                    {busyId === result.sourceId ? <span className="spinner" /> : <IconPlus />}
                    Anadir
                  </button>
                )}
              </div>
            )
          })}
      </div>
    </>
  )
}
