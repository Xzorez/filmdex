export type Status = 'owned' | 'wishlist'

/**
 * De dónde salen las fichas.
 * - `libre`: Cinemeta + Wikidata + Wikipedia. No pide cuenta ni clave.
 * - `tmdb`:  The Movie Database. Mejor calidad, pero exige una clave gratuita.
 */
export type Source = 'libre' | 'tmdb'

/** Una película tal y como vive en la colección del usuario. */
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
  /** URL completa de la carátula; cada fuente usa su propio servidor. */
  posterUrl: string | null
  backdropUrl: string | null
  runtime: number | null
  genres: string[]
  director: string | null
  cast: string[]
  voteAverage: number | null
  /**
   * Código del trailer en YouTube. Opcional porque las películas guardadas
   * antes de que existiera no lo tienen; se rellena al abrir su ficha.
   */
  trailerKey?: string | null

  // Datos propios del coleccionista
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

/** Resultado resumido de una búsqueda, ya normalizado venga de donde venga. */
export interface SearchResult {
  source: Source
  /** Identificador dentro de su fuente: número de TMDB o código de IMDb. */
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
  /** Código del trailer en YouTube, si la fuente lo conoce. */
  trailerKey: string | null
  /**
   * `false` cuando la sinopsis no esta en el idioma del usuario: la fuente sin
   * cuenta cae a la de IMDb, en ingles, si Wikipedia no tiene articulo.
   */
  overviewLocalized?: boolean
}

export interface WatchProvider {
  name: string
  logoUrl: string | null
}

/** Donde se puede ver una película en la region del usuario. */
export interface WatchOptions {
  /** Página de TMDB con los enlaces directos a cada plataforma. */
  link: string | null
  /** Incluida en una suscripcion, o gratis con o sin anuncios. */
  stream: WatchProvider[]
  rent: WatchProvider[]
  buy: WatchProvider[]
}

/** Géneros comunes a las dos fuentes, con su nombre en español para la interfaz. */
export const GENRES: { id: string; label: string }[] = [
  { id: 'Action', label: 'Acción' },
  { id: 'Adventure', label: 'Aventura' },
  { id: 'Animation', label: 'Animación' },
  { id: 'Comedy', label: 'Comedia' },
  { id: 'Crime', label: 'Crimen' },
  { id: 'Documentary', label: 'Documental' },
  { id: 'Drama', label: 'Drama' },
  { id: 'Family', label: 'Familiar' },
  { id: 'Fantasy', label: 'Fantasía' },
  { id: 'History', label: 'Historia' },
  { id: 'Horror', label: 'Terror' },
  { id: 'Mystery', label: 'Misterio' },
  { id: 'Romance', label: 'Romance' },
  { id: 'Sci-Fi', label: 'Ciencia ficción' },
  { id: 'Thriller', label: 'Thriller' },
  { id: 'War', label: 'Bélica' },
  { id: 'Western', label: 'Western' }
]

/** Que lista pedir al descubrir: las que más suenan o las mejor puntuadas. */
export type Catalog = 'popular' | 'rated'

export interface DiscoverQuery {
  catalog: Catalog
  /** Identificador de género de GENRES, o null para no filtrar. */
  genre: string | null
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
