import type { DiscoverQuery, MovieDetails, SearchResult, Settings, Source } from '../../../shared/types'
import * as libre from './libre'
import * as tmdb from './tmdb'

export { SourceError } from './errors'
export const verifyTmdbKey = tmdb.verifyKey

/**
 * Donde verla sale siempre de TMDB, uses la fuente que uses: la fuente sin
 * cuenta también trae el código de TMDB de cada película, así que basta con
 * tener la clave guardada.
 */
export const watchProviders = tmdb.watchProviders

function pick(source: Source): {
  search: typeof libre.search
  details: typeof libre.details
  discover: typeof libre.discover
} {
  return source === 'tmdb' ? tmdb : libre
}

export async function search(settings: Settings, query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []
  return pick(settings.source).search(settings, query)
}

/**
 * La ficha se pide a la misma fuente que dio el resultado de búsqueda, no a la
 * configurada: si el usuario cambia de fuente a mitad, lo que tiene delante
 * sigue funcionando.
 */
export async function details(settings: Settings, source: Source, sourceId: string): Promise<MovieDetails> {
  const result = await pick(source).details(settings, sourceId)

  // Si la sinopsis no esta en tu idioma y hay clave de TMDB, se toma de alli,
  // que la tiene traducida casi siempre. Sin clave, o si falla, se deja como esta.
  if (result.overviewLocalized === false && result.tmdbId !== null && settings.tmdbApiKey.trim()) {
    const overview = await tmdb.localizedOverview(settings, result.tmdbId).catch(() => null)
    if (overview) return { ...result, overview, overviewLocalized: true }
  }
  return result
}

/** Listas para descubrir, opcionalmente acotadas a un género. */
export async function discover(settings: Settings, query: DiscoverQuery): Promise<MovieDetails[]> {
  return pick(settings.source).discover(settings, query)
}
