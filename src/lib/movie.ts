import type { Format, Movie, MovieDetails, NewMovie, SearchResult, Status } from '../../shared/types'

type Identifiable = { imdbId: string | null; tmdbId: number | null }

/**
 * Todas las formas de nombrar una misma pelicula. Hacen falta las dos: el
 * catalogo de TMDB no trae codigo de IMDb y el de Cinemeta no siempre trae el
 * de TMDB, asi que una pelicula guardada desde una fuente solo se reconoce en
 * la otra si se comparan todos sus identificadores.
 */
export function identitiesOf(movie: Identifiable): string[] {
  const ids: string[] = []
  if (movie.imdbId) ids.push(movie.imdbId)
  if (movie.tmdbId !== null) ids.push(`tmdb:${movie.tmdbId}`)
  return ids
}

/** Indice de lo que ya esta en la coleccion, para marcarlo mientras exploras. */
export function ownedIndex(movies: Movie[]): Map<string, Movie> {
  const index = new Map<string, Movie>()
  for (const movie of movies) {
    for (const id of identitiesOf(movie)) index.set(id, movie)
  }
  return index
}

/** Busca una pelicula del catalogo en la coleccion por cualquiera de sus codigos. */
export function findOwned(index: Map<string, Movie>, candidate: Identifiable): Movie | null {
  for (const id of identitiesOf(candidate)) {
    const found = index.get(id)
    if (found) return found
  }
  return null
}

/**
 * Una pelicula guardada tiene los mismos datos que una ficha del catalogo, solo
 * que ademas lleva los del coleccionista. Esta conversion permite que la ficha
 * sea la misma vengas de donde vengas.
 */
export function toDetails(movie: Movie): MovieDetails {
  return {
    source: movie.source,
    sourceId: movie.imdbId ?? String(movie.tmdbId ?? ''),
    imdbId: movie.imdbId,
    tmdbId: movie.tmdbId,
    title: movie.title,
    originalTitle: movie.originalTitle,
    year: movie.year,
    overview: movie.overview,
    posterUrl: movie.posterUrl,
    backdropUrl: movie.backdropUrl,
    voteAverage: movie.voteAverage,
    runtime: movie.runtime,
    genres: movie.genres,
    director: movie.director,
    cast: movie.cast
  }
}

/**
 * Un resultado de busqueda trae menos datos que una ficha. Se completa con
 * huecos para poder abrirlo al momento mientras llega el resto.
 */
export function fromSearchResult(result: SearchResult): MovieDetails {
  return { ...result, backdropUrl: null, runtime: null, genres: [], director: null, cast: [] }
}

/** Convierte una ficha en una pelicula lista para guardar en la coleccion. */
export function toNewMovie(details: MovieDetails, format: Format, status: Status): NewMovie {
  return {
    source: details.source,
    imdbId: details.imdbId,
    tmdbId: details.tmdbId,
    title: details.title,
    originalTitle: details.originalTitle,
    year: details.year,
    overview: details.overview,
    posterUrl: details.posterUrl,
    backdropUrl: details.backdropUrl,
    runtime: details.runtime,
    genres: details.genres,
    director: details.director,
    cast: details.cast,
    voteAverage: details.voteAverage,
    format,
    status,
    watched: false,
    rating: null,
    notes: '',
    tags: [],
    watchedAt: null
  }
}
