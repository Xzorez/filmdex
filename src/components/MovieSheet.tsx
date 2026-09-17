import { useEffect, useState, type JSX } from 'react'
import { FORMATS, type Format, type Movie, type Status } from '../../shared/types'
import { dateLabel, runtimeLabel } from '../lib/format'
import { Poster } from './Poster'
import { Rating } from './Rating'
import { IconClose, IconTrash } from './icons'

interface Props {
  movie: Movie
  onClose: () => void
  onPatch: (id: string, patch: Partial<Movie>) => void
  onDelete: (movie: Movie) => void
}

export function MovieSheet({ movie, onClose, onPatch, onDelete }: Props): JSX.Element {
  const [notes, setNotes] = useState(movie.notes)

  useEffect(() => setNotes(movie.notes), [movie.id, movie.notes])

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const runtime = runtimeLabel(movie.runtime)

  const meta = [movie.year, runtime, movie.director].filter(Boolean).join('  ·  ')

  /** Marcar como vista guarda tambien la fecha, para poder ordenar por ella. */
  const toggleWatched = (): void => {
    const watched = !movie.watched
    onPatch(movie.id, { watched, watchedAt: watched ? new Date().toISOString() : null })
  }

  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-backdrop">
          {movie.backdropUrl && <img src={movie.backdropUrl} alt="" />}
          <button className="sheet-close" onClick={onClose} title="Cerrar (Esc)">
            <IconClose />
          </button>
        </div>

        <div className="sheet-body">
          <div>
            <div className="sheet-poster">
              <Poster url={movie.posterUrl} title={movie.title} />
            </div>
            {movie.genres.length > 0 && (
              <div className="chip-row" style={{ marginTop: 14 }}>
                {movie.genres.map((genre) => (
                  <span key={genre} className="tag">
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="sheet-main">
            <h2 className="sheet-title">{movie.title}</h2>
            <p className="sheet-meta">{meta || 'Sin datos adicionales'}</p>

            {movie.overview && <p className="sheet-overview">{movie.overview}</p>}

            <div className="field-grid">
              <div className="field">
                <label htmlFor="fmt">Formato</label>
                <select
                  id="fmt"
                  className="select"
                  value={movie.format}
                  onChange={(event) => onPatch(movie.id, { format: event.target.value as Format })}
                >
                  {FORMATS.map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="sts">Estado</label>
                <select
                  id="sts"
                  className="select"
                  value={movie.status}
                  onChange={(event) => onPatch(movie.id, { status: event.target.value as Status })}
                >
                  <option value="owned">La tengo</option>
                  <option value="wishlist">La quiero</option>
                </select>
              </div>
            </div>

            <div className="field" style={{ marginBottom: 16 }}>
              <label>Mi nota</label>
              <Rating value={movie.rating} onChange={(rating) => onPatch(movie.id, { rating })} />
            </div>

            <div className="field" style={{ marginBottom: 16 }}>
              <label htmlFor="notes">Notas</label>
              <textarea
                id="notes"
                className="textarea"
                value={notes}
                placeholder="Edicion especial, donde la compraste, con quien la viste..."
                onChange={(event) => setNotes(event.target.value)}
                onBlur={() => notes !== movie.notes && onPatch(movie.id, { notes })}
              />
            </div>

            <div className="section-divider" />

            <dl className="detail-rows">
              {movie.cast.length > 0 && (
                <div className="detail-row">
                  <dt>Reparto</dt>
                  <dd>{movie.cast.join(', ')}</dd>
                </div>
              )}
              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <div className="detail-row">
                  <dt>Titulo original</dt>
                  <dd>{movie.originalTitle}</dd>
                </div>
              )}
              {movie.voteAverage !== null && (
                <div className="detail-row">
                  <dt>Nota TMDB</dt>
                  <dd>{movie.voteAverage.toFixed(1)} / 10</dd>
                </div>
              )}
              <div className="detail-row">
                <dt>Anadida</dt>
                <dd>{dateLabel(movie.addedAt) ?? '-'}</dd>
              </div>
              {movie.watchedAt && (
                <div className="detail-row">
                  <dt>Vista el</dt>
                  <dd>{dateLabel(movie.watchedAt)}</dd>
                </div>
              )}
            </dl>

            <div className="sheet-actions">
              <button className={`btn${movie.watched ? '' : ' btn-primary'}`} onClick={toggleWatched}>
                {movie.watched ? 'Marcar como no vista' : 'Marcar como vista'}
              </button>
              {movie.tmdbId !== null && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => void window.filmdex.app.openExternal(`https://www.themoviedb.org/movie/${movie.tmdbId}`)}
                >
                  Ver en TMDB
                </button>
              )}
              <span className="spacer" />
              <button className="btn btn-danger btn-sm" onClick={() => onDelete(movie)}>
                <IconTrash />
                Quitar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
