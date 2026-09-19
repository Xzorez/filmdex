import { useMemo, type JSX } from 'react'
import { GENRES, type Movie, type MovieDetails } from '../../shared/types'
import { findOwned, ownedIndex } from '../lib/movie'
import { favouriteGenres, labelOf } from '../lib/taste'
import { useDiscover } from '../lib/useDiscover'
import { Card } from './Card'
import { Hero } from './Hero'
import { Row } from './Row'
import { IconFilm } from './icons'

interface Props {
  movies: Movie[]
  genre: string | null
  onGenre: (genre: string | null) => void
  onOpen: (movie: MovieDetails) => void
  onQuickAdd: (movie: MovieDetails) => void
  busyId: string | null
}

export function HomeView({ movies, genre, onGenre, onOpen, onQuickAdd, busyId }: Props): JSX.Element {
  const owned = useMemo(() => ownedIndex(movies), [movies])
  const favourites = useMemo(() => favouriteGenres(movies), [movies])

  // Con menos de tres peliculas no hay gusto que deducir todavia.
  const hasTaste = movies.length >= 3 && favourites.length > 0
  const topGenre = hasTaste ? favourites[0] : null
  const secondGenre = hasTaste && favourites.length > 1 ? favourites[1] : null

  const popular = useDiscover('popular', genre)
  const rated = useDiscover('rated', genre)
  const forYou = useDiscover('popular', topGenre, genre === null && topGenre !== null)
  const second = useDiscover('rated', secondGenre, genre === null && secondGenre !== null)

  // La portada sale de la primera lista que llegue con algo.
  const feature = popular.movies[0] ?? rated.movies[0] ?? null

  /** La destacada ya ocupa la portada: no se repite en la primera fila. */
  const withoutFeature = (list: MovieDetails[]): MovieDetails[] =>
    feature ? list.filter((movie) => movie.sourceId !== feature.sourceId) : list

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
          <h3>No se pudo cargar el catalogo</h3>
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
      {feature ? (
        <Hero
          movie={feature}
          owned={findOwned(owned, feature)}
          onOpen={() => onOpen(feature)}
          onAdd={() => onQuickAdd(feature)}
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
            note={`Porque en tu coleccion abunda ${labelOf(topGenre).toLowerCase()}`}
            loading={forYou.loading}
            count={unseen(forYou.movies).length}
          >
            {renderCards(unseen(forYou.movies))}
          </Row>
        )}

        <Row
          index={1}
          title={genre ? `${labelOf(genre)}: lo mas visto` : 'Populares ahora'}
          loading={popular.loading}
          count={withoutFeature(popular.movies).length}
        >
          {renderCards(withoutFeature(popular.movies))}
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
            title={`Mas ${labelOf(secondGenre).toLowerCase()} para ti`}
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
