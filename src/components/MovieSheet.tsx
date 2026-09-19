import { Fragment, useEffect, useRef, useState, type JSX } from 'react'
import type { Movie, MovieDetails, PersonQuery, Status } from '../../shared/types'
import { dateLabel, runtimeLabel } from '../lib/format'
import { Backdrop } from './Backdrop'
import { Rating } from './Rating'
import { SheetMore } from './SheetMore'
import { WatchPanel } from './WatchPanel'
import { IconCheck, IconClose, IconEye, IconHeart, IconPlay, IconPlus, IconTrash } from './icons'

interface Props {
  details: MovieDetails
  /** La copia guardada, si esta película ya esta en la colección. */
  owned: Movie | null
  loading: boolean
  busy: boolean
  onClose: () => void
  onAdd: (status: Status) => void
  onPatch: (id: string, patch: Partial<Movie>) => void
  onDelete: (movie: Movie) => void
  onTrailer: () => void
  hasTmdbKey: boolean
  onGoSettings: () => void
  /** La coleccion entera, para marcar lo que ya tienes en las filas del pie. */
  library: Movie[]
  /** Abrir otra pelicula desde las filas del pie, sin salir de la ficha. */
  onOpenMovie: (movie: MovieDetails) => void
}

export function MovieSheet({
  details,
  owned,
  loading,
  busy,
  onClose,
  onAdd,
  onPatch,
  onDelete,
  onTrailer,
  hasTmdbKey,
  onGoSettings,
  library,
  onOpenMovie
}: Props): JSX.Element {
  const [notes, setNotes] = useState(owned?.notes ?? '')
  const [person, setPerson] = useState<PersonQuery | null>(null)
  const overlay = useRef<HTMLDivElement>(null)

  // Al saltar a otra pelicula desde el pie, la ficha empieza de nuevo arriba.
  useEffect(() => {
    setPerson(null)
    overlay.current?.scrollTo({ top: 0 })
  }, [details.sourceId])

  const choose = (name: string, role: PersonQuery['role']): void =>
    setPerson({ name, role, from: { imdbId: details.imdbId, tmdbId: details.tmdbId } })

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
    <div
      className="overlay"
      ref={overlay}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="sheet">
        <div className="sheet-art">
          <Backdrop backdropUrl={details.backdropUrl} posterUrl={details.posterUrl} title={details.title} />

          <button className="sheet-close" onClick={onClose} title="Cerrar (Esc)">
            <IconClose />
          </button>

          <div className="sheet-overlay-body">
            <h2 className="sheet-title">{details.title}</h2>

            <div className="sheet-actions">
              {details.trailerKey && (
                <button className="btn btn-light" onClick={onTrailer}>
                  <IconPlay />
                  Ver tráiler
                </button>
              )}
              {owned ? (
                <>
                  <button className="btn" onClick={toggleWatched}>
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
                  <button className="btn" onClick={() => onAdd('owned')} disabled={busy}>
                    {busy ? <span className="spinner" /> : <IconPlus />}
                    Añadir a mi colección
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
              {details.overview || 'No hay sinopsis disponible para esta película.'}
            </p>

            <WatchPanel tmdbId={details.tmdbId} hasTmdbKey={hasTmdbKey} onGoSettings={onGoSettings} />
          </div>

          <dl className="meta-list">
            {details.cast.length > 0 && (
              <div>
                <dt>Reparto: </dt>
                <dd>
                  {details.cast.slice(0, 4).map((name, index) => (
                    <Fragment key={name}>
                      {index > 0 && ', '}
                      <button
                        className={`person-link${person?.name === name ? ' active' : ''}`}
                        onClick={() => choose(name, 'cast')}
                        title={`Ver películas con ${name}`}
                      >
                        {name}
                      </button>
                    </Fragment>
                  ))}
                </dd>
              </div>
            )}
            {details.director && (
              <div>
                <dt>Dirección: </dt>
                <dd>
                  <button
                    className={`person-link${person?.name === details.director ? ' active' : ''}`}
                    onClick={() => choose(details.director!, 'director')}
                    title={`Ver películas dirigidas por ${details.director}`}
                  >
                    {details.director}
                  </button>
                </dd>
              </div>
            )}
            {details.genres.length > 0 && (
              <div>
                <dt>Géneros: </dt>
                <dd>{details.genres.join(', ')}</dd>
              </div>
            )}
            {details.originalTitle && details.originalTitle !== details.title && (
              <div>
                <dt>Título original: </dt>
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
                <label htmlFor="sts">Estado</label>
                <select
                  id="sts"
                  className="select"
                  value={owned.status}
                  onChange={(event) => onPatch(owned.id, { status: event.target.value as Status })}
                >
                  <option value="owned">En mi colección</option>
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
                placeholder="Edición especial, donde la compraste, con quien la viste..."
                onChange={(event) => setNotes(event.target.value)}
                onBlur={() => notes !== owned.notes && onPatch(owned.id, { notes })}
              />
            </div>

            <div className="sheet-actions">
              <span className="tag">Añadida el {dateLabel(owned.addedAt) ?? '-'}</span>
              {owned.watchedAt && <span className="tag">Vista el {dateLabel(owned.watchedAt)}</span>}
              <div style={{ flex: 1 }} />
              <button className="btn btn-danger btn-sm" onClick={() => onDelete(owned)}>
                <IconTrash />
                Quitar de mi colección
              </button>
            </div>
          </div>
        )}

        <SheetMore
          details={details}
          library={library}
          hasTmdbKey={hasTmdbKey}
          person={person}
          onOpen={onOpenMovie}
        />
      </div>
    </div>
  )
}
