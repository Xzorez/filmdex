import type {
  DiscoverQuery,
  MovieDetails,
  PersonQuery,
  SearchResult,
  Settings,
  WatchOptions,
  WatchProvider
} from '../../../shared/types'
import { SourceError } from './errors'

const API = 'https://api.themoviedb.org/3'
const IMAGES = 'https://image.tmdb.org/t/p'

interface TmdbMovie {
  id: number
  imdb_id?: string | null
  title?: string
  original_title?: string
  overview?: string
  release_date?: string
  poster_path?: string | null
  backdrop_path?: string | null
  vote_average?: number
  popularity?: number
  job?: string
  runtime?: number | null
  genres?: { name: string }[]
  credits?: {
    crew?: { job?: string; name?: string }[]
    cast?: { name?: string }[]
  }
  videos?: {
    results?: { site?: string; type?: string; key?: string; official?: boolean; iso_639_1?: string | null }[]
  }
}

/**
 * TMDB acepta dos tipos de credencial: la clave v3 (query param) y el token
 * v4, que es un JWT y va en la cabecera. Detectamos cual nos han dado.
 */
function authFor(key: string): { headers: Record<string, string>; query: string } {
  const trimmed = key.trim()
  if (trimmed.startsWith('eyJ')) {
    return { headers: { Authorization: `Bearer ${trimmed}` }, query: '' }
  }
  return { headers: {}, query: `api_key=${encodeURIComponent(trimmed)}` }
}

async function request<T>(settings: Settings, endpoint: string, params: Record<string, string>): Promise<T> {
  if (!settings.tmdbApiKey.trim()) {
    throw new SourceError('Falta la clave de TMDB. Añádela en Ajustes o cambia a la fuente sin cuenta.')
  }
  const auth = authFor(settings.tmdbApiKey)
  const search = new URLSearchParams({ language: settings.language, ...params })
  const url = `${API}${endpoint}?${search.toString()}${auth.query ? `&${auth.query}` : ''}`

  let response: Response
  try {
    response = await fetch(url, { headers: { accept: 'application/json', ...auth.headers } })
  } catch {
    throw new SourceError('No hay conexión con TMDB. Revisa tu red.')
  }

  if (response.status === 401) throw new SourceError('La clave de TMDB no es válida.')
  if (response.status === 429) throw new SourceError('Demasiadas peticiones a TMDB. Prueba en unos segundos.')
  if (!response.ok) throw new SourceError(`TMDB respondió ${response.status}.`)

  return (await response.json()) as T
}

function yearOf(date?: string): number | null {
  const year = Number.parseInt(date?.slice(0, 4) ?? '', 10)
  return Number.isFinite(year) ? year : null
}

function toSearchResult(raw: TmdbMovie): SearchResult {
  return {
    source: 'tmdb',
    sourceId: String(raw.id),
    imdbId: raw.imdb_id ?? null,
    tmdbId: raw.id,
    title: raw.title ?? raw.original_title ?? 'Sin título',
    originalTitle: raw.original_title ?? raw.title ?? '',
    year: yearOf(raw.release_date),
    overview: raw.overview ?? '',
    posterUrl: raw.poster_path ? `${IMAGES}/w342${raw.poster_path}` : null,
    voteAverage: typeof raw.vote_average === 'number' ? raw.vote_average : null
  }
}

export async function search(settings: Settings, query: string): Promise<SearchResult[]> {
  const data = await request<{ results?: TmdbMovie[] }>(settings, '/search/movie', {
    query: query.trim(),
    include_adult: 'false',
    page: '1'
  })
  return (data.results ?? []).map(toSearchResult)
}

export async function details(settings: Settings, sourceId: string): Promise<MovieDetails> {
  const language = settings.language.split('-')[0]
  const raw = await request<TmdbMovie>(settings, `/movie/${sourceId}`, {
    append_to_response: 'credits,videos',
    // Sin esto TMDB solo devuelve videos en el idioma pedido, y muchas
    // películas no tienen trailer doblado.
    include_video_language: `${language},en,null`
  })
  const director = raw.credits?.crew?.find((member) => member.job === 'Director')?.name ?? null
  return {
    ...toSearchResult(raw),
    posterUrl: raw.poster_path ? `${IMAGES}/w500${raw.poster_path}` : null,
    backdropUrl: raw.backdrop_path ? `${IMAGES}/w780${raw.backdrop_path}` : null,
    runtime: raw.runtime ?? null,
    genres: (raw.genres ?? []).map((genre) => genre.name).filter(Boolean),
    director,
    cast: (raw.credits?.cast ?? []).slice(0, 8).map((person) => person.name ?? '').filter(Boolean),
    trailerKey: trailerOf(raw, language)
  }
}

/** Trailer de YouTube: primero el oficial en tu idioma, luego cualquier oficial, luego lo que haya. */
function trailerOf(raw: TmdbMovie, language: string): string | null {
  const videos = (raw.videos?.results ?? []).filter(
    (video) => video.site === 'YouTube' && video.key && (video.type === 'Trailer' || video.type === 'Teaser')
  )
  const rank = (video: (typeof videos)[number]): number =>
    (video.type === 'Trailer' ? 4 : 0) + (video.official ? 2 : 0) + (video.iso_639_1 === language ? 1 : 0)
  return [...videos].sort((a, b) => rank(b) - rank(a))[0]?.key ?? null
}

/**
 * Solo la sinopsis, en el idioma del usuario. Sirve para completar fichas de la
 * fuente sin cuenta cuando Wikipedia no tiene articulo en ese idioma.
 */
export async function localizedOverview(settings: Settings, tmdbId: number): Promise<string | null> {
  const raw = await request<TmdbMovie>(settings, `/movie/${tmdbId}`, {})
  return raw.overview?.trim() || null
}

/** Ficha de catalogo sin duracion ni reparto: se completan al abrirla. */
function toCatalogDetails(raw: TmdbMovie): MovieDetails {
  return {
    ...toSearchResult(raw),
    backdropUrl: raw.backdrop_path ? `${IMAGES}/w780${raw.backdrop_path}` : null,
    runtime: null,
    genres: [],
    director: null,
    cast: [],
    trailerKey: null
  }
}

const same = (a: string, b: string): boolean =>
  a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0

/**
 * Otras peliculas de alguien del reparto o de la direccion. La persona se busca
 * entre los creditos de la pelicula desde la que se pulso, no por su nombre en
 * todo TMDB: asi no hay homonimos.
 */
export async function personFilms(settings: Settings, query: PersonQuery): Promise<MovieDetails[]> {
  if (query.from.tmdbId === null) return []
  const credits = await request<{
    cast?: { id: number; name?: string }[]
    crew?: { id: number; name?: string; job?: string }[]
  }>(settings, `/movie/${query.from.tmdbId}/credits`, {})

  const person =
    query.role === 'director'
      ? credits.crew?.find((item) => item.job === 'Director' && same(item.name ?? '', query.name))
      : credits.cast?.find((item) => same(item.name ?? '', query.name))
  if (!person) return []

  const films = await request<{ cast?: TmdbMovie[]; crew?: TmdbMovie[] }>(
    settings,
    `/person/${person.id}/movie_credits`,
    {}
  )
  const list = query.role === 'director' ? (films.crew ?? []).filter((item) => item.job === 'Director') : films.cast ?? []

  const seen = new Set<number>([query.from.tmdbId])
  return list
    .filter((item) => item.poster_path && !seen.has(item.id) && seen.add(item.id))
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, 24)
    .map(toCatalogDetails)
}

/** Recomendaciones de TMDB para una pelicula: las "parecidas a esta". */
export async function similar(settings: Settings, tmdbId: number): Promise<MovieDetails[]> {
  const data = await request<{ results?: TmdbMovie[] }>(settings, `/movie/${tmdbId}/recommendations`, { page: '1' })
  return (data.results ?? [])
    .filter((item) => item.poster_path)
    .slice(0, 20)
    .map(toCatalogDetails)
}

export async function verifyKey(apiKey: string, language: string): Promise<boolean> {
  try {
    await request<unknown>(
      { source: 'tmdb', tmdbApiKey: apiKey, language, region: 'ES', autoUpdate: true, watchAlerts: false },
      '/configuration',
      {}
    )
    return true
  } catch (error) {
    if (error instanceof SourceError) return false
    throw error
  }
}

/**
 * TMDB filtra por identificador numerico de género, no por nombre. Son fijos y
 * están documentados, así que se mapean desde los nombres comunes de GENRES.
 * Los que TMDB no tiene se quedan fuera y la lista sale sin filtrar.
 */
const TMDB_GENRE_IDS: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Mystery: 9648,
  Romance: 10749,
  'Sci-Fi': 878,
  Thriller: 53,
  War: 10752,
  Western: 37
}

export async function discover(settings: Settings, query: DiscoverQuery): Promise<MovieDetails[]> {
  const genreId = query.genre ? TMDB_GENRE_IDS[query.genre] : undefined
  const params: Record<string, string> = {
    page: '1',
    include_adult: 'false',
    sort_by: query.catalog === 'rated' ? 'vote_average.desc' : 'popularity.desc',
    // Sin un minimo de votos, "mejor valoradas" se llena de rarezas con un voto.
    'vote_count.gte': query.catalog === 'rated' ? '500' : '0'
  }
  if (genreId !== undefined) params.with_genres = String(genreId)

  const data = await request<{ results?: TmdbMovie[] }>(settings, '/discover/movie', params)

  // discover no trae duración ni reparto: se completan al abrir la ficha.
  return (data.results ?? []).slice(0, 24).map((raw) => ({
    ...toSearchResult(raw),
    backdropUrl: raw.backdrop_path ? `${IMAGES}/w780${raw.backdrop_path}` : null,
    runtime: null,
    genres: [],
    director: null,
    cast: [],
    trailerKey: null
  }))
}

interface TmdbProvider {
  provider_name?: string
  logo_path?: string | null
  display_priority?: number
}

interface TmdbRegionProviders {
  link?: string
  flatrate?: TmdbProvider[]
  free?: TmdbProvider[]
  ads?: TmdbProvider[]
  rent?: TmdbProvider[]
  buy?: TmdbProvider[]
}

function toProviders(list: TmdbProvider[] | undefined): WatchProvider[] {
  return [...(list ?? [])]
    .sort((a, b) => (a.display_priority ?? 99) - (b.display_priority ?? 99))
    .filter((item) => item.provider_name)
    .map((item) => ({
      name: item.provider_name ?? '',
      logoUrl: item.logo_path ? `${IMAGES}/w92${item.logo_path}` : null
    }))
}

/**
 * Plataformas donde esta la película en la region del usuario. TMDB saca estos
 * datos de JustWatch. Devuelve null si alli no esta en ninguna.
 */
export async function watchProviders(settings: Settings, tmdbId: number): Promise<WatchOptions | null> {
  const data = await request<{ results?: Record<string, TmdbRegionProviders> }>(
    settings,
    `/movie/${tmdbId}/watch/providers`,
    {}
  )
  const region = data.results?.[settings.region]
  if (!region) return null

  // Una misma plataforma puede venir como gratis y con anuncios a la vez.
  const seen = new Set<string>()
  const stream = [...toProviders(region.flatrate), ...toProviders(region.free), ...toProviders(region.ads)].filter(
    (item) => !seen.has(item.name) && seen.add(item.name)
  )
  const options: WatchOptions = {
    link: region.link ?? null,
    stream,
    rent: toProviders(region.rent),
    buy: toProviders(region.buy)
  }
  return options.stream.length + options.rent.length + options.buy.length > 0 ? options : null
}
