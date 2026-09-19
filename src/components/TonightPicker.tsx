import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react'
import { GENRES, type Movie, type MovieDetails } from '../../shared/types'
import { runtimeLabel } from '../lib/format'
import { blurbOf, findOwned, ownedIndex } from '../lib/movie'
import { rememberOrigin } from '../lib/transition'
import { useDiscover } from '../lib/useDiscover'
import { Poster } from './Poster'
import { IconClose, IconFilm, IconInfo, IconPlay, IconRefresh, IconSparkle } from './icons'

interface Props {
  /** La colección y la lista: lo que ya tienes no se te propone. */
  movies: Movie[]
  onClose: () => void
  onOpen: (movie: MovieDetails) => void
  onTrailer: (movie: MovieDetails) => void
}

/** Topes de duración, en minutos. `null` es "me da igual". */
const DURATIONS: { label: string; max: number | null }[] = [
  { label: 'Me da igual', max: null },
  { label: 'Menos de 1 h 45', max: 105 },
  { label: 'Menos de 2 h 15', max: 135 }
]

/** Pausas de la ruleta: arranca rápida y frena como una de verdad. */
const ROLL_STEPS = [45, 45, 50, 55, 60, 70, 80, 95, 110, 130, 155, 185, 220, 270]

type Phase = 'idle' | 'rolling' | 'done'

/**
 * Propone una película al azar del catálogo: de las populares y las mejor
 * valoradas, del género que elijas, dejando fuera las que ya tienes guardadas.
 */
export function TonightPicker({ movies, onClose, onOpen, onTrailer }: Props): JSX.Element {
  const [maxMinutes, setMaxMinutes] = useState<number | null>(null)
  const [genre, setGenre] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [current, setCurrent] = useState<MovieDetails | null>(null)
  const timers = useRef<number[]>([])
  const shown = useRef(new Set<string>())
  const posterRef = useRef<HTMLDivElement>(null)

  const popular = useDiscover('popular', genre)
  const rated = useDiscover('rated', genre)
  const loading = popular.loading || rated.loading
  const error = popular.error ?? rated.error

  const owned = useMemo(() => ownedIndex(movies), [movies])

  // Las dos listas se solapan: se juntan sin repetir y sin lo que ya tienes.
  const candidates = useMemo(() => {
    const seen = new Set<string>()
    return [...popular.movies, ...rated.movies].filter((movie) => {
      if (seen.has(movie.sourceId) || findOwned(owned, movie)) return false
      seen.add(movie.sourceId)
      return true
    })
  }, [popular.movies, rated.movies, owned])

  // El catálogo de TMDB no trae la duración: sin ese dato el filtro no puede
  // decidir nada, así que se esconde en vez de dejarlo sin resultados.
  const knowsRuntime = candidates.some((movie) => movie.runtime !== null)

  const pool = useMemo(
    () =>
      candidates.filter(
        (movie) =>
          !knowsRuntime ||
          maxMinutes === null ||
          (movie.runtime !== null && movie.runtime <= maxMinutes)
      ),
    [candidates, knowsRuntime, maxMinutes]
  )

  const clearTimers = (): void => {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
  }

  useEffect(() => clearTimers, [])

  // Cambiar un filtro invalida lo que hubiera elegido.
  useEffect(() => {
    clearTimers()
    setPhase('idle')
    setCurrent(null)
  }, [maxMinutes, genre])

  /** Elige sin repetir hasta haber pasado por todas las que encajan. */
  const choose = useCallback((): MovieDetails | null => {
    if (pool.length === 0) return null
    let options = pool.filter((movie) => !shown.current.has(movie.sourceId))
    if (options.length === 0) {
      shown.current.clear()
      options = pool
    }
    const pick = options[Math.floor(Math.random() * options.length)]
    shown.current.add(pick.sourceId)
    return pick
  }, [pool])

  /**
   * La ficha del catálogo trae la sinopsis en inglés y, con TMDB, sin duración.
   * Al pararse la ruleta se pide la ficha completa, que la tiene en español.
   */
  const land = useCallback((pick: MovieDetails): void => {
    setCurrent(pick)
    setPhase('done')
    window.filmdex.sources
      .details(pick.source, pick.sourceId)
      .then((full) => setCurrent((shownNow) => (shownNow?.sourceId === pick.sourceId ? full : shownNow)))
      .catch(() => {
        // Sin la ficha completa se queda la del catálogo, que ya sirve.
      })
  }, [])

  const roll = useCallback((): void => {
    const pick = choose()
    if (!pick) return
    clearTimers()

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (calm || pool.length === 1) {
      land(pick)
      return
    }

    setPhase('rolling')
    let elapsed = 0
    let previous: MovieDetails | null = null
    ROLL_STEPS.forEach((pause) => {
      elapsed += pause
      timers.current.push(
        window.setTimeout(() => {
          // Carátulas al azar, sin repetir la inmediatamente anterior.
          const others = pool.filter((movie) => movie !== previous)
          previous = others[Math.floor(Math.random() * others.length)] ?? pick
          setCurrent(previous)
        }, elapsed)
      )
    })
    timers.current.push(window.setTimeout(() => land(pick), elapsed + 320))
  }, [choose, land, pool])

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
      const typing = event.target instanceof HTMLSelectElement
      if ((event.key === 'Enter' || event.key === ' ') && !typing && phase !== 'rolling' && !loading) {
        event.preventDefault()
        roll()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, roll, phase, loading])

  const facts = current
    ? [current.year, runtimeLabel(current.runtime), current.genres.slice(0, 2).join(', ')].filter(Boolean)
    : []

  const subtitle = loading
    ? 'Buscando películas...'
    : pool.length === 0
      ? 'Ninguna película encaja'
      : pool.length === 1
        ? 'Solo queda 1 película que aún no tienes'
        : `Entre ${pool.length} películas que aún no tienes`

  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="tonight">
        <button className="sheet-close" onClick={onClose} title="Cerrar (Esc)">
          <IconClose />
        </button>

        <header className="tonight-head">
          <h2>¿Qué veo esta noche?</h2>
          <p>{subtitle}</p>
        </header>

        {error && !loading && candidates.length === 0 ? (
          <div className="empty" style={{ margin: '40px auto' }}>
            <IconFilm className="empty-icon" />
            <h3>No se pudo cargar el catálogo</h3>
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="tonight-filters">
              <div className="chip-row">
                {knowsRuntime &&
                  DURATIONS.map((option) => (
                    <button
                      key={option.label}
                      className={`chip${maxMinutes === option.max ? ' active' : ''}`}
                      onClick={() => setMaxMinutes(option.max)}
                    >
                      {option.label}
                    </button>
                  ))}
              </div>
              <select
                className="select"
                value={genre ?? ''}
                onChange={(event) => setGenre(event.target.value || null)}
              >
                <option value="">Cualquier género</option>
                {GENRES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={`tonight-stage ${phase}`}>
              <div className="tonight-poster" ref={posterRef}>
                {current ? (
                  <Poster url={current.posterUrl} title={current.title} />
                ) : (
                  <div className="tonight-placeholder">
                    <IconSparkle />
                  </div>
                )}
              </div>

              <div className="tonight-info">
                {phase === 'done' && current ? (
                  <>
                    <span className="tonight-kicker">Esta noche toca</span>
                    <h3>{current.title}</h3>
                    <div className="tonight-facts">
                      {current.voteAverage !== null && <span className="score">{current.voteAverage.toFixed(1)}</span>}
                      {current.voteAverage !== null && facts.length > 0 && '  ·  '}
                      {facts.join('  ·  ')}
                    </div>
                    {blurbOf(current) && <p>{blurbOf(current)}</p>}
                  </>
                ) : phase === 'rolling' ? (
                  <span className="tonight-kicker">Barajando...</span>
                ) : loading ? (
                  <p className="tonight-hint">Preparando el catálogo...</p>
                ) : pool.length === 0 ? (
                  <p className="tonight-hint">Nada encaja con esos filtros. Prueba a quitar alguno.</p>
                ) : (
                  <p className="tonight-hint">
                    Elige un género si quieres y deja que el azar decida. También puedes pulsar Espacio.
                  </p>
                )}
              </div>
            </div>

            <div className="tonight-actions">
              {phase === 'done' && current ? (
                <>
                  {current.trailerKey && (
                    <button className="btn btn-light" onClick={() => onTrailer(current)}>
                      <IconPlay />
                      Ver tráiler
                    </button>
                  )}
                  <button className={`btn${current.trailerKey ? '' : ' btn-light'}`} onClick={() => {
                      rememberOrigin(posterRef.current)
                      onOpen(current)
                    }}>
                    <IconInfo />
                    Ver ficha
                  </button>
                  <button className="btn" onClick={roll}>
                    <IconRefresh />
                    Otra
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-brand"
                  onClick={roll}
                  disabled={phase === 'rolling' || loading || pool.length === 0}
                >
                  {loading ? <span className="spinner" /> : <IconSparkle />}
                  Elegir por mí
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
