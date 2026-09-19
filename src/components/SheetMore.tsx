import { useEffect, useMemo, useRef, useState, type JSX } from 'react'
import type { Movie, MovieDetails, PersonQuery } from '../../shared/types'
import { findOwned, ownedIndex } from '../lib/movie'
import { canonicalGenre, labelOf } from '../lib/taste'
import { useDiscover } from '../lib/useDiscover'
import { Card } from './Card'
import { Row } from './Row'

interface Props {
  details: MovieDetails
  library: Movie[]
  hasTmdbKey: boolean
  person: PersonQuery | null
  onOpen: (movie: MovieDetails) => void
}

type Load = { loading: boolean; movies: MovieDetails[]; error: string | null }

/** Una peticion que se relanza al cambiar su clave y se descarta si ya no toca. */
function useFetch(key: string | null, fetcher: () => Promise<MovieDetails[]>): Load {
  const [state, setState] = useState<Load>({ loading: key !== null, movies: [], error: null })
  useEffect(() => {
    if (key === null) {
      setState({ loading: false, movies: [], error: null })
      return
    }
    let cancelled = false
    setState({ loading: true, movies: [], error: null })
    fetcher()
      .then((movies) => !cancelled && setState({ loading: false, movies, error: null }))
      .catch((error: Error) => !cancelled && setState({ loading: false, movies: [], error: error.message }))
    return () => {
      cancelled = true
    }
    // La clave ya resume todo lo que cambia la peticion.
  }, [key])
  return state
}

/**
 * Filas al pie de la ficha: otras películas de la persona que pulsaste y
 * parecidas a esta. Las parecidas solo existen con TMDB; sin clave, se ofrecen
 * otras del mismo género y se dice así, en vez de llamarlas parecidas.
 */
export function SheetMore({ details, library, hasTmdbKey, person, onOpen }: Props): JSX.Element {
  const owned = useMemo(() => ownedIndex(library), [library])
  const personRef = useRef<HTMLDivElement>(null)

  const personKey = person ? `${person.role}|${person.name}|${details.sourceId}` : null
  const films = useFetch(personKey, () => window.filmdex.sources.personFilms(person!))

  const canSimilar = hasTmdbKey && details.tmdbId !== null
  const similar = useFetch(canSimilar ? `similar|${details.tmdbId}` : null, () =>
    window.filmdex.sources.similar(details.tmdbId!)
  )

  const genre = details.genres.map(canonicalGenre).find((id): id is string => id !== null) ?? null
  const byGenre = useDiscover('rated', genre, !canSimilar && genre !== null)

  // Al elegir a alguien, su fila aparece al pie: se lleva la vista hasta ella.
  // Se repite al terminar de cargar, porque mientras carga la ficha cambia de
  // alto y el primer desplazamiento puede quedarse corto. Si ya se ve, no se mueve.
  useEffect(() => {
    if (personKey) personRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [personKey, films.loading])

  const cards = (list: MovieDetails[]): JSX.Element[] =>
    list
      .filter((movie) => movie.sourceId !== details.sourceId)
      .map((movie) => (
        <Card
          key={movie.sourceId}
          title={movie.title}
          year={movie.year}
          posterUrl={movie.posterUrl}
          owned={Boolean(findOwned(owned, movie))}
          score={movie.voteAverage}
          onOpen={() => onOpen(movie)}
        />
      ))

  const personTitle = person
    ? person.role === 'director'
      ? `Dirigidas por ${person.name}`
      : `Con ${person.name}`
    : ''

  const others = canSimilar ? similar : { loading: byGenre.loading, movies: byGenre.movies, error: byGenre.error }
  const othersTitle = canSimilar ? 'Parecidas a esta' : genre ? `Más de ${labelOf(genre).toLowerCase()}` : ''

  return (
    <div className="sheet-more">
      {person && (
        <div ref={personRef}>
          {films.error ? (
            <section className="row">
              <div className="row-head">
                <h2 className="row-title">{personTitle}</h2>
              </div>
              <p className="sheet-more-note">{films.error}</p>
            </section>
          ) : !films.loading && cards(films.movies).length === 0 ? (
            <section className="row">
              <div className="row-head">
                <h2 className="row-title">{personTitle}</h2>
              </div>
              <p className="sheet-more-note">No encuentro otras películas suyas.</p>
            </section>
          ) : (
            <Row title={personTitle} loading={films.loading} count={cards(films.movies).length}>
              {cards(films.movies)}
            </Row>
          )}
        </div>
      )}

      {othersTitle && (
        <Row index={1} title={othersTitle} loading={others.loading} count={cards(others.movies).length}>
          {cards(others.movies)}
        </Row>
      )}
    </div>
  )
}
