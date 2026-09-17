/**
 * Fuente de fichas que no pide cuenta ni clave, combinando tres servicios
 * publicos:
 *
 *   Cinemeta   caratula, fondo, director, reparto, duracion y nota (en ingles)
 *   Wikidata   traduce el titulo al idioma del usuario, cruzando por codigo IMDb
 *   Wikipedia  sinopsis en ese mismo idioma
 *
 * Los dos ultimos son un extra: si fallan o no conocen la pelicula, se devuelve
 * lo que dio Cinemeta en vez de romper la busqueda.
 */
import type { MovieDetails, SearchResult, Settings } from '../../../shared/types'
import { SourceError } from './errors'

const CINEMETA = 'https://v3-cinemeta.strem.io'
const WIKIDATA = 'https://query.wikidata.org/sparql'
const AGENT = 'Filmdex/1.0 (https://github.com/Xzorez/filmdex)'

interface CinemetaMeta {
  id?: string
  imdb_id?: string
  name?: string
  poster?: string
  background?: string
  releaseInfo?: string
  year?: string
  description?: string
  imdbRating?: string
  runtime?: string
  genres?: string[]
  genre?: string[]
  director?: string[]
  cast?: string[]
  moviedb_id?: number
}

/**
 * Cinemeta da los generos siempre en ingles y son una lista corta y cerrada,
 * asi que se traducen aqui. En otros idiomas se dejan tal cual.
 */
const GENRES_ES: Record<string, string> = {
  Action: 'Accion',
  Adventure: 'Aventura',
  Animation: 'Animacion',
  Biography: 'Biografia',
  Comedy: 'Comedia',
  Crime: 'Crimen',
  Documentary: 'Documental',
  Drama: 'Drama',
  Family: 'Familiar',
  Fantasy: 'Fantasia',
  'Film-Noir': 'Cine negro',
  History: 'Historia',
  Horror: 'Terror',
  Music: 'Musica',
  Musical: 'Musical',
  Mystery: 'Misterio',
  Romance: 'Romance',
  'Sci-Fi': 'Ciencia ficcion',
  Short: 'Cortometraje',
  Sport: 'Deporte',
  Thriller: 'Thriller',
  War: 'Belica',
  Western: 'Western'
}

function translateGenres(genres: string[], language: string): string[] {
  if (shortLang(language) !== 'es') return genres
  return genres.map((genre) => GENRES_ES[genre] ?? genre)
}

/** "es-ES" -> "es". Wikidata y Wikipedia trabajan con el codigo corto. */
function shortLang(language: string): string {
  return language.split('-')[0]?.toLowerCase() || 'es'
}

async function getJson<T>(url: string, what: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, { headers: { accept: 'application/json', 'user-agent': AGENT } })
  } catch {
    throw new SourceError(`No hay conexion con ${what}. Revisa tu red.`)
  }
  if (!response.ok) throw new SourceError(`${what} respondio ${response.status}.`)
  return (await response.json()) as T
}

function yearOf(meta: CinemetaMeta): number | null {
  const raw = meta.releaseInfo ?? meta.year ?? ''
  const year = Number.parseInt(raw.slice(0, 4), 10)
  return Number.isFinite(year) ? year : null
}

function runtimeOf(meta: CinemetaMeta): number | null {
  const minutes = Number.parseInt(meta.runtime ?? '', 10)
  return Number.isFinite(minutes) ? minutes : null
}

function ratingOf(meta: CinemetaMeta): number | null {
  const rating = Number.parseFloat(meta.imdbRating ?? '')
  return Number.isFinite(rating) ? rating : null
}

function toSearchResult(meta: CinemetaMeta): SearchResult {
  const imdbId = meta.imdb_id ?? meta.id ?? null
  return {
    source: 'libre',
    sourceId: imdbId ?? '',
    imdbId,
    tmdbId: typeof meta.moviedb_id === 'number' ? meta.moviedb_id : null,
    title: meta.name ?? 'Sin titulo',
    originalTitle: meta.name ?? '',
    year: yearOf(meta),
    overview: meta.description ?? '',
    posterUrl: meta.poster ?? null,
    voteAverage: ratingOf(meta)
  }
}

/**
 * Pide a Wikidata el titulo traducido de varias peliculas de una vez, cruzando
 * por su codigo de IMDb. Devuelve tambien el articulo de Wikipedia, que es de
 * donde sale luego la sinopsis.
 */
async function translateTitles(
  imdbIds: string[],
  language: string
): Promise<Map<string, { title: string; article: string | null }>> {
  const found = new Map<string, { title: string; article: string | null }>()
  const ids = imdbIds.filter(Boolean)
  if (ids.length === 0) return found

  const lang = shortLang(language)
  const values = ids.map((id) => `"${id}"`).join(' ')
  const query = `SELECT ?imdb ?itemLabel ?article WHERE {
    VALUES ?imdb { ${values} }
    ?item wdt:P345 ?imdb.
    OPTIONAL {
      ?article schema:about ?item;
               schema:isPartOf <https://${lang}.wikipedia.org/>.
    }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "${lang}". }
  }`

  try {
    const data = await getJson<{
      results?: { bindings?: { imdb?: { value: string }; itemLabel?: { value: string }; article?: { value: string } }[] }
    }>(`${WIKIDATA}?format=json&query=${encodeURIComponent(query)}`, 'Wikidata')

    for (const row of data.results?.bindings ?? []) {
      const imdb = row.imdb?.value
      const title = row.itemLabel?.value
      if (!imdb || !title) continue
      // Wikidata devuelve el codigo Q cuando no hay etiqueta en ese idioma.
      if (/^Q\d+$/.test(title)) continue
      found.set(imdb, { title, article: row.article?.value ?? null })
    }
  } catch {
    // Sin traduccion nos quedamos con el titulo original: no es motivo de error.
  }
  return found
}

/** Saca la entradilla del articulo de Wikipedia, que hace las veces de sinopsis. */
async function wikipediaSummary(articleUrl: string, language: string): Promise<string | null> {
  const title = decodeURIComponent(articleUrl.split('/wiki/')[1] ?? '')
  if (!title) return null

  const lang = shortLang(language)
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'extracts',
    exintro: '1',
    explaintext: '1',
    redirects: '1',
    titles: title,
    origin: '*'
  })

  try {
    const data = await getJson<{ query?: { pages?: Record<string, { extract?: string }> } }>(
      `https://${lang}.wikipedia.org/w/api.php?${params.toString()}`,
      'Wikipedia'
    )
    const page = Object.values(data.query?.pages ?? {})[0]
    const extract = page?.extract?.trim()
    return extract ? extract : null
  } catch {
    return null
  }
}

export async function search(settings: Settings, query: string): Promise<SearchResult[]> {
  const url = `${CINEMETA}/catalog/movie/top/search=${encodeURIComponent(query.trim())}.json`
  const data = await getJson<{ metas?: CinemetaMeta[] }>(url, 'el catalogo de peliculas')

  const results = (data.metas ?? []).filter((meta) => meta.id ?? meta.imdb_id).map(toSearchResult)
  const translations = await translateTitles(
    results.map((result) => result.imdbId ?? ''),
    settings.language
  )

  return results.map((result) => {
    const translated = result.imdbId ? translations.get(result.imdbId) : undefined
    return translated ? { ...result, title: translated.title } : result
  })
}

export async function details(settings: Settings, sourceId: string): Promise<MovieDetails> {
  const data = await getJson<{ meta?: CinemetaMeta }>(
    `${CINEMETA}/meta/movie/${encodeURIComponent(sourceId)}.json`,
    'el catalogo de peliculas'
  )
  const meta = data.meta
  if (!meta) throw new SourceError('No se encontro la ficha de esa pelicula.')

  const base = toSearchResult({ ...meta, imdb_id: meta.imdb_id ?? sourceId })
  const translations = await translateTitles([base.imdbId ?? ''], settings.language)
  const translated = base.imdbId ? translations.get(base.imdbId) : undefined

  const summary = translated?.article ? await wikipediaSummary(translated.article, settings.language) : null

  return {
    ...base,
    title: translated?.title ?? base.title,
    overview: summary ?? base.overview,
    backdropUrl: meta.background ?? null,
    runtime: runtimeOf(meta),
    genres: translateGenres(meta.genres ?? meta.genre ?? [], settings.language),
    director: meta.director?.[0] ?? null,
    cast: (meta.cast ?? []).slice(0, 8)
  }
}
