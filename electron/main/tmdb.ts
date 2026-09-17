import type { MovieDetails, SearchResult, Settings } from '../../shared/types'

const API = 'https://api.themoviedb.org/3'

export class TmdbError extends Error {}

interface TmdbMovie {
  id: number
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
    throw new TmdbError('Falta la clave de TMDB. Anadela en Ajustes.')
  }
  const auth = authFor(settings.tmdbApiKey)
  const search = new URLSearchParams({ language: settings.language, ...params })
  const url = `${API}${endpoint}?${search.toString()}${auth.query ? `&${auth.query}` : ''}`

  let response: Response
  try {
    response = await fetch(url, { headers: { accept: 'application/json', ...auth.headers } })
  } catch {
    throw new TmdbError('No hay conexion con TMDB. Revisa tu red.')
  }

  if (response.status === 401) throw new TmdbError('La clave de TMDB no es valida.')
  if (response.status === 429) throw new TmdbError('Demasiadas peticiones a TMDB. Prueba en unos segundos.')
  if (!response.ok) throw new TmdbError(`TMDB respondio ${response.status}.`)

  return (await response.json()) as T
}

function yearOf(date?: string): number | null {
  const year = Number.parseInt(date?.slice(0, 4) ?? '', 10)
  return Number.isFinite(year) ? year : null
}

function toSearchResult(raw: TmdbMovie): SearchResult {
  return {
    tmdbId: raw.id,
    title: raw.title ?? raw.original_title ?? 'Sin titulo',
    originalTitle: raw.original_title ?? raw.title ?? '',
    year: yearOf(raw.release_date),
    overview: raw.overview ?? '',
    posterPath: raw.poster_path ?? null,
    voteAverage: typeof raw.vote_average === 'number' ? raw.vote_average : null
  }
}

export async function search(settings: Settings, query: string, page = 1): Promise<SearchResult[]> {
  if (!query.trim()) return []
  const data = await request<{ results?: TmdbMovie[] }>(settings, '/search/movie', {
    query: query.trim(),
    include_adult: 'false',
    page: String(page)
  })
  return (data.results ?? []).map(toSearchResult)
}

export async function details(settings: Settings, tmdbId: number): Promise<MovieDetails> {
  const raw = await request<TmdbMovie>(settings, `/movie/${tmdbId}`, { append_to_response: 'credits' })
  const director = raw.credits?.crew?.find((member) => member.job === 'Director')?.name ?? null
  return {
    ...toSearchResult(raw),
    backdropPath: raw.backdrop_path ?? null,
    runtime: raw.runtime ?? null,
    genres: (raw.genres ?? []).map((g) => g.name).filter(Boolean),
    director,
    cast: (raw.credits?.cast ?? []).slice(0, 8).map((p) => p.name ?? '').filter(Boolean)
  }
}

/** Peliculas populares: sirve de escaparate cuando la coleccion esta vacia. */
export async function popular(settings: Settings): Promise<SearchResult[]> {
  const data = await request<{ results?: TmdbMovie[] }>(settings, '/movie/popular', {
    page: '1',
    region: settings.region
  })
  return (data.results ?? []).map(toSearchResult)
}

export async function verifyKey(apiKey: string, language: string): Promise<boolean> {
  try {
    await request<unknown>({ tmdbApiKey: apiKey, language, region: 'ES', autoUpdate: true }, '/configuration', {})
    return true
  } catch (error) {
    if (error instanceof TmdbError) return false
    throw error
  }
}
