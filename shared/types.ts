export const FORMATS = ['Blu-ray', '4K UHD', 'DVD', 'Digital', 'VHS', 'Otro'] as const
export type Format = (typeof FORMATS)[number]

export type Status = 'owned' | 'wishlist'

/** Una pelicula tal y como vive en la coleccion del usuario. */
export interface Movie {
  /** Identificador interno estable, independiente de TMDB. */
  id: string
  tmdbId: number | null
  title: string
  originalTitle: string
  year: number | null
  overview: string
  posterPath: string | null
  backdropPath: string | null
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
  tmdbApiKey: string
  language: string
  region: string
  autoUpdate: boolean
}

/** Resultado resumido de una busqueda en TMDB. */
export interface SearchResult {
  tmdbId: number
  title: string
  originalTitle: string
  year: number | null
  overview: string
  posterPath: string | null
  voteAverage: number | null
}

/** Ficha completa de TMDB, ya normalizada para la app. */
export interface MovieDetails extends SearchResult {
  backdropPath: string | null
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
