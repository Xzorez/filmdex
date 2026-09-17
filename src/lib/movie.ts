import type { Format, Movie, MovieDetails, NewMovie, SearchResult, Status } from '../../shared/types'

/**
 * Identidad de una pelicula entre fuentes distintas. Se prefiere el codigo de
 * IMDb porque lo entienden las dos, y se cae al de TMDB cuando no hay otro.
 */
export function identityOf(movie: { imdbId: string | null; tmdbId: number | null }): string {
  return movie.imdbId ?? (movie.tmdbId !== null ? `tmdb:${movie.tmdbId}` : '')
}

/** Indice de lo que ya esta en la coleccion, para marcarlo mientras exploras. */
export function ownedIndex(movies: Movie[]): Map<string, Movie> {
  const index = new Map<string, Movie>()
  for (const movie of movies) {
    const key = identityOf(movie)
    if (key) index.set(key, movie)
  }
  return index
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
