import { useEffect, useMemo, useState, type JSX } from 'react'
import { GENRES, type Movie, type MovieDetails } from '../../shared/types'
import { findOwned, ownedIndex } from '../lib/movie'
import { favouriteGenres, labelOf } from '../lib/taste'
import { useDiscover } from '../lib/useDiscover'
import { Card } from './Card'
import { Hero } from './Hero'
import { Row } from './Row'
import { IconFilm } from './icons'

/** Cuántas películas rotan en la portada. */
const FEATURED = 5

/** Cuánto se espera antes de preparar la siguiente destacada. */
const PREFETCH_DELAY_MS = 2500

/** Fichas completas de las destacadas ya pedidas: volver al inicio no las repite. */
const featureDetails = new Map<string, MovieDetails>()

interface Props {
  movies: Movie[]
  genre: string | null
  onGenre: (genre: string | null) => void
  onOpen: (movie: MovieDetails) => void
  onQuickAdd: (movie: MovieDetails) => void
  onTrailer: (movie: MovieDetails) => void
  busyId: string | null
  /** Hay algo abierto encima (ficha, sorteo, tráiler): la portada no rota. */
  paused: boolean
}

export function HomeView({ movies, genre, onGenre, onOpen, onQuickAdd, onTrailer, busyId, paused }: Props): JSX.Element {
  const owned = useMemo(() => ownedIndex(movies), [movies])
  const favourites = useMemo(() => favouriteGenres(movies), [movies])

  // Con menos de tres películas no hay gusto que deducir todavía.
  const hasTaste = movies.length >= 3 && favourites.length > 0
  const topGenre = hasTaste ? favourites[0] : null
  const secondGenre = hasTaste && favourites.length > 1 ? favourites[1] : null

  const popular = useDiscover('popular', genre)
  const rated = useDiscover('rated', genre)
  const forYou = useDiscover('popular', topGenre, genre === null && topGenre !== null)
  const second = useDiscover('rated', secondGenre, genre === null && secondGenre !== null)

  // La portada rota entre las primeras de la primera lista que llegue.
  const features = useMemo(
    () => (popular.movies.length > 0 ? popular.movies : rated.movies).filter((movie) => movie.backdropUrl ?? movie.posterUrl).slice(0, FEATURED),
    [popular.movies, rated.movies]
  )
  const [slot, setSlot] = useState(0)
  const [hovering, setHovering] = useState(false)
  // Otro género, otras destacadas: se empieza por la primera.
  useEffect(() => setSlot(0), [features])
  const feature = features[slot % Math.max(features.length, 1)] ?? null

  // La ficha del catálogo trae la sinopsis en inglés; la completa la tiene en
  // español. Se pide aparte y la portada espera a tenerla para enseñarla, en
  // vez de mostrar una y cambiarla por otra delante del usuario.
  const [full, setFull] = useState<MovieDetails | null>(null)
  useEffect(() => {
    if (!feature) return
    const cached = featureDetails.get(feature.sourceId)
    if (cached) {
      setFull(cached)
      return
    }
    setFull(null)
    let cancelled = false
    window.filmdex.sources
      .details(feature.source, feature.sourceId)
      .then((details) => {
        featureDetails.set(feature.sourceId, details)
        if (!cancelled) setFull(details)
      })
      // Sin ficha completa se queda la del catálogo: mejor en inglés que nada.
      .catch(() => {
        if (!cancelled) setFull(feature)
      })
    return () => {
      cancelled = true
    }
  }, [feature?.sourceId])

  const featured = feature && full?.sourceId === feature.sourceId ? { ...feature, ...full } : feature

  // La siguiente se prepara mientras se ve esta: su ficha y su imagen, para que
  // al rotar el fundido no tenga que esperar a la red.
  useEffect(() => {
    if (features.length < 2) return
    const next = features[(slot + 1) % features.length]
    // Con un respiro: que no le quite red a la imagen que se está viendo.
    const timer = window.setTimeout(() => {
      const image = next.backdropUrl ?? next.posterUrl
      if (image) new Image().src = image
      if (!featureDetails.has(next.sourceId)) {
        void window.filmdex.sources
          .details(next.source, next.sourceId)
          .then((details) => featureDetails.set(next.sourceId, details))
          .catch(() => undefined)
      }
    }, PREFETCH_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [slot, features])

  const renderCards = (list: MovieDetails[]): JSX.Element[] =>
    list
      .map((movie) => {
        const mine = findOwned(owned, movie)
        return (
          <Card
            key={movie.sourceId}
            title={movie.title}
            year={movie.year}
            posterUrl={movie.posterUrl}
            owned={Boolean(mine)}
            score={movie.voteAverage}
            onOpen={() => onOpen(movie)}
          />
        )
      })

  /** Lo que ya tienes no hace falta recomendartelo. */
  const unseen = (list: MovieDetails[]): MovieDetails[] =>
    list.filter((movie) => !findOwned(owned, movie))

  const error = popular.error ?? rated.error
  if (error && !popular.loading && popular.movies.length === 0) {
    return (
      <div className="page">
        <div className="empty">
          <IconFilm className="empty-icon" />
          <h3>No se pudo cargar el catálogo</h3>
          <p>{error}</p>
          <button className="btn btn-light" onClick={() => onGenre(genre)}>
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {feature && featured ? (
        <Hero
          movie={featured}
          overviewPending={full?.sourceId !== feature.sourceId}
          owned={findOwned(owned, featured)}
          onOpen={() => onOpen(featured)}
          onAdd={() => onQuickAdd(featured)}
          onTrailer={() => onTrailer(featured)}
          onHover={setHovering}
          rotation={{
            index: slot % Math.max(features.length, 1),
            count: features.length,
            paused: paused || hovering,
            onSelect: setSlot,
            onDone: () => setSlot((current) => (current + 1) % features.length)
          }}
          busy={busyId === feature.sourceId}
        />
      ) : (
        <div style={{ height: 'calc(var(--nav-h) + 30px)' }} />
      )}

      <div className="rows">
        <div className="genre-bar">
          <button className={`chip${genre === null ? ' active' : ''}`} onClick={() => onGenre(null)}>
            Todo
          </button>
          {GENRES.map((item) => (
            <button
              key={item.id}
              className={`chip${genre === item.id ? ' active' : ''}`}
              onClick={() => onGenre(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {genre === null && topGenre && (
          <Row
            index={0}
            title="Recomendadas para ti"
            note={`Porque en tu colección abunda ${labelOf(topGenre).toLowerCase()}`}
            loading={forYou.loading}
            count={unseen(forYou.movies).length}
          >
            {renderCards(unseen(forYou.movies))}
          </Row>
        )}

        <Row
          index={1}
          title={genre ? `${labelOf(genre)}: lo más visto` : 'Populares ahora'}
          loading={popular.loading}
          count={popular.movies.length}
        >
          {renderCards(popular.movies)}
        </Row>

        <Row
          index={2}
          title={genre ? `${labelOf(genre)}: mejor valoradas` : 'Mejor valoradas'}
          loading={rated.loading}
          count={rated.movies.length}
        >
          {renderCards(rated.movies)}
        </Row>

        {genre === null && secondGenre && (
          <Row
            index={3}
            title={`Más ${labelOf(secondGenre).toLowerCase()} para ti`}
            loading={second.loading}
            count={unseen(second.movies).length}
          >
            {renderCards(unseen(second.movies))}
          </Row>
        )}
      </div>
    </>
  )
}
