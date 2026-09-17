import type { JSX } from 'react'
import type { Movie, MovieDetails } from '../../shared/types'
import { runtimeLabel } from '../lib/format'
import { Backdrop } from './Backdrop'
import { IconCheck, IconInfo, IconPlus } from './icons'

interface Props {
  movie: MovieDetails
  owned: Movie | null
  onOpen: () => void
  onAdd: () => void
  busy: boolean
}

export function Hero({ movie, owned, onOpen, onAdd, busy }: Props): JSX.Element {
  const runtime = runtimeLabel(movie.runtime)

  return (
    <header className="hero">
      <div className="hero-art">
        <Backdrop backdropUrl={movie.backdropUrl} posterUrl={movie.posterUrl} title={movie.title} />
      </div>

      <div className="hero-body">
        <div className="hero-kicker">Pelicula destacada</div>
        <h1 className="hero-title">{movie.title}</h1>

        <div className="hero-facts">
          {movie.voteAverage !== null && <span className="score">{movie.voteAverage.toFixed(1)} en IMDb</span>}
          {movie.year && <span>{movie.year}</span>}
          {runtime && <span>{runtime}</span>}
          {movie.genres.slice(0, 2).map((genre) => (
            <span key={genre}>{genre}</span>
          ))}
        </div>

        {movie.overview && <p className="hero-overview">{movie.overview}</p>}

        <div className="hero-actions">
          {owned ? (
            <button className="btn btn-light" onClick={onOpen}>
              <IconCheck />
              Ya en tu coleccion
            </button>
          ) : (
            <button className="btn btn-light" onClick={onAdd} disabled={busy}>
              {busy ? <span className="spinner" /> : <IconPlus />}
              Anadir a mi coleccion
            </button>
          )}
          <button className="btn" onClick={onOpen}>
            <IconInfo />
            Mas informacion
          </button>
        </div>
      </div>
    </header>
  )
}
