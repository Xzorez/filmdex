import { app } from 'electron'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { Library, Movie, NewMovie, Settings } from '../../shared/types'

const LIBRARY_VERSION = 1

const DEFAULT_SETTINGS: Settings = {
  tmdbApiKey: '',
  language: 'es-ES',
  region: 'ES',
  autoUpdate: true
}

function libraryPath(): string {
  return path.join(app.getPath('userData'), 'library.json')
}

function settingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json')
}

/**
 * Escribe en un temporal y renombra: si la app muere a media escritura,
 * el fichero original sigue intacto.
 */
async function writeAtomic(file: string, data: string): Promise<void> {
  const tmp = `${file}.tmp`
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(tmp, data, 'utf8')
  await fs.rename(tmp, file)
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as T
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === 'ENOENT') return fallback
    // El fichero existe pero no se puede leer: lo apartamos en vez de perderlo.
    await fs.rename(file, `${file}.corrupt-${Date.now()}`).catch(() => {})
    return fallback
  }
}

let cache: Library | null = null

async function load(): Promise<Library> {
  if (cache) return cache
  const data = await readJson<Library>(libraryPath(), { version: LIBRARY_VERSION, movies: [] })
  cache = { version: LIBRARY_VERSION, movies: Array.isArray(data.movies) ? data.movies : [] }
  return cache
}

async function persist(library: Library): Promise<void> {
  cache = library
  await writeAtomic(libraryPath(), JSON.stringify(library, null, 2))
}

export async function listMovies(): Promise<Movie[]> {
  return (await load()).movies
}

export async function addMovie(input: NewMovie): Promise<Movie> {
  const library = await load()
  const movie: Movie = { ...input, id: randomUUID(), addedAt: new Date().toISOString() }
  await persist({ ...library, movies: [movie, ...library.movies] })
  return movie
}

export async function updateMovie(id: string, patch: Partial<Movie>): Promise<Movie | null> {
  const library = await load()
  const index = library.movies.findIndex((m) => m.id === id)
  if (index === -1) return null
  const updated: Movie = { ...library.movies[index], ...patch, id }
  const movies = [...library.movies]
  movies[index] = updated
  await persist({ ...library, movies })
  return updated
}

export async function removeMovie(id: string): Promise<boolean> {
  const library = await load()
  const movies = library.movies.filter((m) => m.id !== id)
  if (movies.length === library.movies.length) return false
  await persist({ ...library, movies })
  return true
}

/** Anade peliculas de golpe saltando las que ya estan (por tmdbId + formato). */
export async function addMany(items: NewMovie[]): Promise<{ added: number; skipped: number }> {
  const library = await load()
  const seen = new Set(library.movies.map((m) => `${m.tmdbId}|${m.format}`))
  const fresh: Movie[] = []
  for (const item of items) {
    const key = `${item.tmdbId}|${item.format}`
    if (item.tmdbId !== null && seen.has(key)) continue
    seen.add(key)
    fresh.push({ ...item, id: randomUUID(), addedAt: new Date().toISOString() })
  }
  if (fresh.length > 0) await persist({ ...library, movies: [...fresh, ...library.movies] })
  return { added: fresh.length, skipped: items.length - fresh.length }
}

export async function replaceLibrary(movies: Movie[]): Promise<void> {
  await persist({ version: LIBRARY_VERSION, movies })
}

export async function getSettings(): Promise<Settings> {
  const stored = await readJson<Partial<Settings>>(settingsPath(), {})
  return { ...DEFAULT_SETTINGS, ...stored }
}

export async function setSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch }
  await writeAtomic(settingsPath(), JSON.stringify(next, null, 2))
  return next
}

export function dataDirectory(): string {
  return app.getPath('userData')
}
