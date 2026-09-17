export const FORMATS = ['Blu-ray', '4K UHD', 'DVD', 'Digital', 'VHS', 'Otro'] as const
export type Format = (typeof FORMATS)[number]

export type Status = 'owned' | 'wishlist'

/**
 * De donde salen las fichas.
 * - `libre`: Cinemeta + Wikidata + Wikipedia. No pide cuenta ni clave.
 * - `tmdb`:  The Movie Database. Mejor calidad, pero exige una clave gratuita.
 */
export type Source = 'libre' | 'tmdb'

/** Una pelicula tal y como vive en la coleccion del usuario. */
export interface Movie {
  /** Identificador interno estable, independiente de la fuente. */
  id: string
  source: Source
  imdbId: string | null
  tmdbId: number | null
  title: string
  originalTitle: string
  year: number | null
  overview: string
  /** URL completa de la caratula; cada fuente usa su propio servidor. */
  posterUrl: string | null
  backdropUrl: string | null
  runtime: number | null
  genres: string[]
  director: string | null
  cast: string[]
  voteAverage: number | null

  // Datos propios del coleccionista
  format: Format
  status: Status
  watched: boolean
  /** Nota personal de 0 a 10, o null si no la has puntuado. */
  rating: number | null
  notes: string
  tags: string[]
  addedAt: string
  watchedAt: string | null
}

export type NewMovie = Omit<Movie, 'id' | 'addedAt'>

export interface Library {
  version: number
  movies: Movie[]
}

export interface Settings {
  source: Source
  tmdbApiKey: string
  language: string
  region: string
  autoUpdate: boolean
}

/** Resultado resumido de una busqueda, ya normalizado venga de donde venga. */
export interface SearchResult {
  source: Source
  /** Identificador dentro de su fuente: numero de TMDB o codigo de IMDb. */
  sourceId: string
  imdbId: string | null
  tmdbId: number | null
  title: string
  originalTitle: string
  year: number | null
  overview: string
  posterUrl: string | null
  voteAverage: number | null
}

/** Ficha completa, ya normalizada para la app. */
export interface MovieDetails extends SearchResult {
  backdropUrl: string | null
  runtime: number | null
  genres: string[]
  director: string | null
  cast: string[]
}

export interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'none' | 'error'
  version?: string
  percent?: number
  message?: string
}

export interface ImportSummary {
  added: number
  skipped: number
}
