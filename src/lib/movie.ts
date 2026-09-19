import type { Movie, MovieDetails, NewMovie, SearchResult, Status } from '../../shared/types'

type Identifiable = { imdbId: string | null; tmdbId: number | null }

/**
 * Todas las formas de nombrar una misma película. Hacen falta las dos: el
 * catálogo de TMDB no trae código de IMDb y el de Cinemeta no siempre trae el
 * de TMDB, así que una película guardada desde una fuente solo se reconoce en
 * la otra si se comparan todos sus identificadores.
 */
export function identitiesOf(movie: Identifiable): string[] {
  const ids: string[] = []
  if (movie.imdbId) ids.push(movie.imdbId)
  if (movie.tmdbId !== null) ids.push(`tmdb:${movie.tmdbId}`)
  return ids
}

/** Indice de lo que ya esta en la colección, para marcarlo mientras exploras. */
export function ownedIndex(movies: Movie[]): Map<string, Movie> {
  const index = new Map<string, Movie>()
  for (const movie of movies) {
    for (const id of identitiesOf(movie)) index.set(id, movie)
  }
  return index
}

/** Busca una película del catálogo en la colección por cualquiera de sus códigos. */
export function findOwned(index: Map<string, Movie>, candidate: Identifiable): Movie | null {
  for (const id of identitiesOf(candidate)) {
    const found = index.get(id)
    if (found) return found
  }
  return null
}

/**
 * Una película guardada tiene los mismos datos que una ficha del catálogo, solo
 * que además lleva los del coleccionista. Esta conversion permite que la ficha
 * sea la misma vengas de donde vengas.
 */
export function toDetails(movie: Movie): MovieDetails {
  return {
    source: movie.source,
    // Cada fuente pide sus fichas con su propio código: TMDB no entiende los de IMDb.
    sourceId: movie.source === 'tmdb' ? String(movie.tmdbId ?? '') : (movie.imdbId ?? ''),
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
    cast: movie.cast,
    trailerKey: movie.trailerKey ?? null
  }
}

/**
 * Un resultado de búsqueda trae menos datos que una ficha. Se completa con
 * huecos para poder abrirlo al momento mientras llega el resto.
 */
export function fromSearchResult(result: SearchResult): MovieDetails {
  return { ...result, backdropUrl: null, runtime: null, genres: [], director: null, cast: [], trailerKey: null }
}

/** Convierte una ficha en una película lista para guardar en la colección. */
export function toNewMovie(details: MovieDetails, status: Status): NewMovie {
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
    trailerKey: details.trailerKey,
    status,
    watched: false,
    rating: null,
    notes: '',
    tags: [],
    watchedAt: null
  }
}
