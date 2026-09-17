import type { MovieDetails, SearchResult, Settings, Source } from '../../../shared/types'
import * as libre from './libre'
import * as tmdb from './tmdb'

export { SourceError } from './errors'
export const verifyTmdbKey = tmdb.verifyKey

function pick(source: Source): { search: typeof libre.search; details: typeof libre.details } {
  return source === 'tmdb' ? tmdb : libre
}

export async function search(settings: Settings, query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []
  return pick(settings.source).search(settings, query)
}

/**
 * La ficha se pide a la misma fuente que dio el resultado de busqueda, no a la
 * configurada: si el usuario cambia de fuente a mitad, lo que tiene delante
 * sigue funcionando.
 */
export async function details(settings: Settings, source: Source, sourceId: string): Promise<MovieDetails> {
  return pick(source).details(settings, sourceId)
}
