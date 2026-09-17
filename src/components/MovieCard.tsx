import type { JSX } from 'react'
import type { Movie } from '../../shared/types'
import { posterUrl } from '../lib/tmdb-images'
import { Poster } from './Poster'
import { IconCheck } from './icons'

export function MovieCard({ movie, onOpen }: { movie: Movie; onOpen: (movie: Movie) => void }): JSX.Element {
  return (
    <button className="card" onClick={() => onOpen(movie)} title={movie.title}>
      <div className="poster">
        <Poster url={posterUrl(movie.posterPath)} title={movie.title} />
        <span className="poster-badge">{movie.format}</span>
        {movie.watched && (
          <span className="poster-mark" title="Vista">
            <IconCheck />
          </span>
        )}
        {movie.rating !== null && <span className="poster-rating">{movie.rating.toFixed(1)}</span>}
      </div>
      <div>
        <div className="card-title">{movie.title}</div>
        <div className="card-meta">
          {movie.year ?? 'Sin ano'}
          {movie.status === 'wishlist' && <span className="dot">Deseada</span>}
        </div>
      </div>
    </button>
  )
}
