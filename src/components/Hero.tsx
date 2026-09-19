import { useEffect, useRef, useState, type JSX } from 'react'
import type { Movie, MovieDetails } from '../../shared/types'
import { runtimeLabel } from '../lib/format'
import { blurbOf } from '../lib/movie'
import { rememberOrigin } from '../lib/transition'
import { Backdrop } from './Backdrop'
import { IconCheck, IconInfo, IconPlay, IconPlus } from './icons'

/** Rotación de la portada entre varias destacadas. */
export interface Rotation {
  index: number
  count: number
  /** Parada mientras pasas el ratón o hay una ficha abierta encima. */
  paused: boolean
  onSelect: (index: number) => void
  /** La barra de la destacada actual se ha llenado: toca la siguiente. */
  onDone: () => void
}

interface Props {
  movie: MovieDetails
  owned: Movie | null
  onOpen: () => void
  onAdd: () => void
  onTrailer: () => void
  busy: boolean
  /** La sinopsis en español aún no ha llegado: se guarda su hueco. */
  overviewPending?: boolean
  rotation?: Rotation
  onHover?: (hovering: boolean) => void
}

/** Lo que dura el fundido entre una destacada y la siguiente. */
const CROSSFADE_MS = 900

export function Hero({
  movie,
  owned,
  onOpen,
  onAdd,
  onTrailer,
  busy,
  overviewPending = false,
  rotation,
  onHover
}: Props): JSX.Element {
  const art = useRef<HTMLDivElement>(null)

  // La imagen anterior se queda debajo mientras la nueva se funde encima, en
  // vez de cambiar de golpe.
  const [layers, setLayers] = useState<MovieDetails[]>([movie])
  useEffect(() => {
    setLayers((current) => {
      const top = current[current.length - 1]
      if (top?.sourceId === movie.sourceId) return [...current.slice(0, -1), movie]
      return [...current.slice(-1), movie]
    })
  }, [movie])
  useEffect(() => {
    if (layers.length < 2) return
    const timer = window.setTimeout(() => setLayers((current) => current.slice(-1)), CROSSFADE_MS)
    return () => window.clearTimeout(timer)
  }, [layers])

  // La ficha se abre desde la imagen grande y vuelve a ella al cerrarse.
  const openFromArt = (): void => {
    rememberOrigin(art.current)
    onOpen()
  }
  const runtime = runtimeLabel(movie.runtime)

  return (
    <header className="hero" onPointerEnter={() => onHover?.(true)} onPointerLeave={() => onHover?.(false)}>
      <div className="hero-art" ref={art}>
        {layers.map((layer, position) => (
          <div
            key={layer.sourceId}
            className={`hero-layer${layers.length > 1 && position === layers.length - 1 ? ' entering' : ''}`}
          >
            <Backdrop backdropUrl={layer.backdropUrl} posterUrl={layer.posterUrl} title={layer.title} />
          </div>
        ))}
      </div>

      {/* Con clave por película: al rotar, el texto vuelve a entrar escalonado. */}
      <div className="hero-body" key={movie.sourceId}>
        <div className="hero-kicker">Película destacada</div>
        <h1 className="hero-title">{movie.title}</h1>

        <div className="hero-facts">
          {movie.voteAverage !== null && <span className="score">{movie.voteAverage.toFixed(1)} en IMDb</span>}
          {movie.year && <span>{movie.year}</span>}
          {runtime && <span>{runtime}</span>}
          {movie.genres.slice(0, 2).map((genre) => (
            <span key={genre}>{genre}</span>
          ))}
        </div>

        {overviewPending ? (
          // Mismo alto que tres líneas de sinopsis, para que los botones no salten.
          <div className="hero-overview-slot" />
        ) : (
          blurbOf(movie) && <p className="hero-overview">{blurbOf(movie)}</p>
        )}

        <div className="hero-actions">
          {movie.trailerKey && (
            <button className="btn btn-light" onClick={onTrailer}>
              <IconPlay />
              Ver tráiler
            </button>
          )}
          {owned ? (
            <button className="btn" onClick={openFromArt}>
              <span className="btn-swap" key="owned">
                <IconCheck />
                Ya en tu colección
              </span>
            </button>
          ) : (
            <button className={`btn${movie.trailerKey ? '' : ' btn-light'}`} onClick={onAdd} disabled={busy}>
              <span className="btn-swap" key="add">
                {busy ? <span className="spinner" /> : <IconPlus />}
                Añadir a mi colección
              </span>
            </button>
          )}
          <button className="btn" onClick={openFromArt}>
            <IconInfo />
            Más información
          </button>
        </div>

        {rotation && rotation.count > 1 && (
          <div className="hero-dots" role="tablist" aria-label="Películas destacadas">
            {Array.from({ length: rotation.count }, (_, slot) => (
              <button
                key={slot}
                role="tab"
                aria-selected={slot === rotation.index}
                aria-label={`Destacada ${slot + 1} de ${rotation.count}`}
                className={`hero-dot${slot === rotation.index ? ' active' : ''}${slot < rotation.index ? ' seen' : ''}`}
                onClick={() => rotation.onSelect(slot)}
              >
                {slot === rotation.index && (
                  <span
                    className="hero-dot-fill"
                    style={{ animationPlayState: rotation.paused ? 'paused' : 'running' }}
                    onAnimationEnd={rotation.onDone}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
