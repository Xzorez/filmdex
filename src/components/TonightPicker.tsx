import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react'
import { GENRES, type Movie } from '../../shared/types'
import { runtimeLabel } from '../lib/format'
import { canonicalGenre } from '../lib/taste'
import { Poster } from './Poster'
import { IconClose, IconFilm, IconInfo, IconRefresh, IconSparkle } from './icons'

interface Props {
  movies: Movie[]
  onClose: () => void
  onOpen: (movie: Movie) => void
  onDiscover: () => void
}

/** Topes de duracion, en minutos. `null` es "me da igual". */
const DURATIONS: { label: string; max: number | null }[] = [
  { label: 'Me da igual', max: null },
  { label: 'Menos de 1 h 45', max: 105 },
  { label: 'Menos de 2 h 15', max: 135 }
]

/** Pausas de la ruleta: arranca rapida y frena como una de verdad. */
const ROLL_STEPS = [45, 45, 50, 55, 60, 70, 80, 95, 110, 130, 155, 185, 220, 270]

type Phase = 'idle' | 'rolling' | 'done'

export function TonightPicker({ movies, onClose, onOpen, onDiscover }: Props): JSX.Element {
  const [maxMinutes, setMaxMinutes] = useState<number | null>(null)
  const [genre, setGenre] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [current, setCurrent] = useState<Movie | null>(null)
  const timers = useRef<number[]>([])
  const shown = useRef(new Set<string>())

  const unwatched = useMemo(() => movies.filter((movie) => !movie.watched), [movies])

  // Si hay tope de duracion, las que no la tienen se quedan fuera: no se
  // puede prometer que una pelicula dure menos de dos horas sin saberlo.
  const pool = useMemo(
    () =>
      unwatched.filter((movie) => {
        if (maxMinutes !== null && (movie.runtime === null || movie.runtime > maxMinutes)) return false
        if (genre !== null && !movie.genres.some((name) => canonicalGenre(name) === genre)) return false
        return true
      }),
    [unwatched, maxMinutes, genre]
  )

  // Solo se ofrecen los generos que de verdad hay entre las pendientes.
  const genres = useMemo(() => {
    const present = new Set(unwatched.flatMap((movie) => movie.genres.map(canonicalGenre)))
    return GENRES.filter((item) => present.has(item.id))
  }, [unwatched])

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
  const choose = useCallback((): Movie | null => {
    if (pool.length === 0) return null
    let candidates = pool.filter((movie) => !shown.current.has(movie.id))
    if (candidates.length === 0) {
      shown.current.clear()
      candidates = pool
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)]
    shown.current.add(pick.id)
    return pick
  }, [pool])

  const roll = useCallback((): void => {
    const pick = choose()
    if (!pick) return
    clearTimers()

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (calm || pool.length === 1) {
      setCurrent(pick)
      setPhase('done')
      return
    }

    setPhase('rolling')
    let elapsed = 0
    let previous: Movie | null = null
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
    timers.current.push(
      window.setTimeout(() => {
        setCurrent(pick)
        setPhase('done')
      }, elapsed + 320)
    )
  }, [choose, pool])

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
      const typing = event.target instanceof HTMLSelectElement
      if ((event.key === 'Enter' || event.key === ' ') && !typing && phase !== 'rolling') {
        event.preventDefault()
        roll()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, roll, phase])

  const facts = current
    ? [current.year, runtimeLabel(current.runtime), current.genres.slice(0, 2).join(', ')].filter(Boolean)
    : []

  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="tonight">
        <button className="sheet-close" onClick={onClose} title="Cerrar (Esc)">
          <IconClose />
        </button>

        <header className="tonight-head">
          <h2>Que veo esta noche?</h2>
          <p>
            {unwatched.length === 0
              ? 'No te queda ninguna pelicula sin ver.'
              : `Entre ${pool.length} de tus ${unwatched.length} peliculas sin ver`}
          </p>
        </header>

        {unwatched.length === 0 ? (
          <div className="empty" style={{ margin: '40px auto' }}>
            <IconFilm className="empty-icon" />
            <h3>Estas al dia</h3>
            <p>Guarda en tu coleccion o en tu lista peliculas que aun no hayas visto y aqui te elegire una.</p>
            <button className="btn btn-light" onClick={onDiscover}>
              Descubrir peliculas
            </button>
          </div>
        ) : (
          <>
            <div className="tonight-filters">
              <div className="chip-row">
                {DURATIONS.map((option) => (
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
                <option value="">Cualquier genero</option>
                {genres.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={`tonight-stage ${phase}`}>
              <div className="tonight-poster">
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
                    <div className="tonight-facts">{facts.join('  ·  ')}</div>
                    {current.overview && <p>{current.overview}</p>}
                  </>
                ) : phase === 'rolling' ? (
                  <span className="tonight-kicker">Barajando...</span>
                ) : pool.length === 0 ? (
                  <p className="tonight-hint">Nada encaja con esos filtros. Prueba a quitar alguno.</p>
                ) : (
                  <p className="tonight-hint">
                    Filtra si quieres y deja que el azar decida. Tambien puedes pulsar Espacio.
                  </p>
                )}
              </div>
            </div>

            <div className="tonight-actions">
              {phase === 'done' && current ? (
                <>
                  <button className="btn btn-light" onClick={() => onOpen(current)}>
                    <IconInfo />
                    Ver ficha
                  </button>
                  <button className="btn" onClick={roll}>
                    <IconRefresh />
                    Otra
                  </button>
                </>
              ) : (
                <button className="btn btn-brand" onClick={roll} disabled={phase === 'rolling' || pool.length === 0}>
                  <IconSparkle />
                  Elegir por mi
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
