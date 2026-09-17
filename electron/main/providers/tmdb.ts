import type { MovieDetails, SearchResult, Settings } from '../../../shared/types'
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
  runtime?: number | null
  genres?: { name: string }[]
  credits?: {
    crew?: { job?: string; name?: string }[]
    cast?: { name?: string }[]
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
    throw new SourceError('Falta la clave de TMDB. Anadela en Ajustes o cambia a la fuente sin cuenta.')
  }
  const auth = authFor(settings.tmdbApiKey)
  const search = new URLSearchParams({ language: settings.language, ...params })
  const url = `${API}${endpoint}?${search.toString()}${auth.query ? `&${auth.query}` : ''}`

  let response: Response
  try {
    response = await fetch(url, { headers: { accept: 'application/json', ...auth.headers } })
  } catch {
    throw new SourceError('No hay conexion con TMDB. Revisa tu red.')
  }

  if (response.status === 401) throw new SourceError('La clave de TMDB no es valida.')
  if (response.status === 429) throw new SourceError('Demasiadas peticiones a TMDB. Prueba en unos segundos.')
  if (!response.ok) throw new SourceError(`TMDB respondio ${response.status}.`)

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
    title: raw.title ?? raw.original_title ?? 'Sin titulo',
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
  const raw = await request<TmdbMovie>(settings, `/movie/${sourceId}`, { append_to_response: 'credits' })
  const director = raw.credits?.crew?.find((member) => member.job === 'Director')?.name ?? null
  return {
    ...toSearchResult(raw),
    posterUrl: raw.poster_path ? `${IMAGES}/w500${raw.poster_path}` : null,
    backdropUrl: raw.backdrop_path ? `${IMAGES}/w780${raw.backdrop_path}` : null,
    runtime: raw.runtime ?? null,
    genres: (raw.genres ?? []).map((genre) => genre.name).filter(Boolean),
    director,
    cast: (raw.credits?.cast ?? []).slice(0, 8).map((person) => person.name ?? '').filter(Boolean)
  }
}

export async function verifyKey(apiKey: string, language: string): Promise<boolean> {
  try {
    await request<unknown>(
      { source: 'tmdb', tmdbApiKey: apiKey, language, region: 'ES', autoUpdate: true },
      '/configuration',
      {}
    )
    return true
  } catch (error) {
    if (error instanceof SourceError) return false
    throw error
  }
}
