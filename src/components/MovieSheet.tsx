import { useEffect, useState, type JSX } from 'react'
import { FORMATS, type Format, type Movie, type MovieDetails, type Status } from '../../shared/types'
import { dateLabel, runtimeLabel } from '../lib/format'
import { Backdrop } from './Backdrop'
import { Rating } from './Rating'
import { IconCheck, IconClose, IconEye, IconHeart, IconPlus, IconTrash } from './icons'

interface Props {
  details: MovieDetails
  /** La copia guardada, si esta pelicula ya esta en la coleccion. */
  owned: Movie | null
  loading: boolean
  busy: boolean
  onClose: () => void
  onAdd: (status: Status) => void
  onPatch: (id: string, patch: Partial<Movie>) => void
  onDelete: (movie: Movie) => void
}

export function MovieSheet({
  details,
  owned,
  loading,
  busy,
  onClose,
  onAdd,
  onPatch,
  onDelete
}: Props): JSX.Element {
  const [notes, setNotes] = useState(owned?.notes ?? '')

  useEffect(() => setNotes(owned?.notes ?? ''), [owned?.id, owned?.notes])

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const runtime = runtimeLabel(details.runtime)

  const toggleWatched = (): void => {
    if (!owned) return
    const watched = !owned.watched
    onPatch(owned.id, { watched, watchedAt: watched ? new Date().toISOString() : null })
  }

  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-art">
          <Backdrop backdropUrl={details.backdropUrl} posterUrl={details.posterUrl} title={details.title} />

          <button className="sheet-close" onClick={onClose} title="Cerrar (Esc)">
            <IconClose />
          </button>

          <div className="sheet-overlay-body">
            <h2 className="sheet-title">{details.title}</h2>

            <div className="sheet-actions">
              {owned ? (
                <>
                  <button className="btn btn-light" onClick={toggleWatched}>
                    {owned.watched ? <IconCheck /> : <IconEye />}
                    {owned.watched ? 'Vista' : 'Marcar como vista'}
                  </button>
                  {owned.status === 'wishlist' && (
                    <button className="btn btn-brand" onClick={() => onPatch(owned.id, { status: 'owned' })}>
                      <IconPlus />
                      Ya la tengo
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button className="btn btn-light" onClick={() => onAdd('owned')} disabled={busy}>
                    {busy ? <span className="spinner" /> : <IconPlus />}
                    Anadir a mi coleccion
                  </button>
                  <button className="btn" onClick={() => onAdd('wishlist')} disabled={busy}>
                    <IconHeart />
                    Guardar en mi lista
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="sheet-body">
          <div>
            <div className="sheet-facts">
              {details.voteAverage !== null && <span className="score">{details.voteAverage.toFixed(1)}</span>}
              {details.year && <span>{details.year}</span>}
              {runtime && <span>{runtime}</span>}
              {details.genres[0] && <span className="pill">{details.genres[0]}</span>}
              {loading && <span className="spinner" />}
            </div>

            <p className="sheet-overview">
              {details.overview || 'No hay sinopsis disponible para esta pelicula.'}
            </p>
          </div>

          <dl className="meta-list">
            {details.cast.length > 0 && (
              <div>
                <dt>Reparto: </dt>
                <dd>{details.cast.slice(0, 4).join(', ')}</dd>
              </div>
            )}
            {details.director && (
              <div>
                <dt>Direccion: </dt>
                <dd>{details.director}</dd>
              </div>
            )}
            {details.genres.length > 0 && (
              <div>
                <dt>Generos: </dt>
                <dd>{details.genres.join(', ')}</dd>
              </div>
            )}
            {details.originalTitle && details.originalTitle !== details.title && (
              <div>
                <dt>Titulo original: </dt>
                <dd>{details.originalTitle}</dd>
              </div>
            )}
            {details.imdbId && (
              <div>
                <dt>Ficha: </dt>
                <dd>
                  <a
                    style={{ color: '#fff', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() =>
                      void window.filmdex.app.openExternal(`https://www.imdb.com/title/${details.imdbId}/`)
                    }
                  >
                    Ver en IMDb
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {owned && (
          <div className="sheet-mine">
            <h4>Tu ficha</h4>

            <div className="field-row">
              <div className="field">
                <label htmlFor="fmt">Formato</label>
                <select
                  id="fmt"
                  className="select"
                  value={owned.format}
                  onChange={(event) => onPatch(owned.id, { format: event.target.value as Format })}
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
                  value={owned.status}
                  onChange={(event) => onPatch(owned.id, { status: event.target.value as Status })}
                >
                  <option value="owned">En mi coleccion</option>
                  <option value="wishlist">En mi lista</option>
                </select>
              </div>

              <div className="field">
                <label>Mi nota</label>
                <Rating value={owned.rating} onChange={(rating) => onPatch(owned.id, { rating })} />
              </div>
            </div>

            <div className="field" style={{ marginBottom: 16, minWidth: 0 }}>
              <label htmlFor="notes">Notas</label>
              <textarea
                id="notes"
                className="textarea"
                value={notes}
                placeholder="Edicion especial, donde la compraste, con quien la viste..."
                onChange={(event) => setNotes(event.target.value)}
                onBlur={() => notes !== owned.notes && onPatch(owned.id, { notes })}
              />
            </div>

            <div className="sheet-actions">
              <span className="tag">Anadida el {dateLabel(owned.addedAt) ?? '-'}</span>
              {owned.watchedAt && <span className="tag">Vista el {dateLabel(owned.watchedAt)}</span>}
              <div style={{ flex: 1 }} />
              <button className="btn btn-danger btn-sm" onClick={() => onDelete(owned)}>
                <IconTrash />
                Quitar de mi coleccion
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
