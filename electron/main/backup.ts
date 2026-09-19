/**
 * Copia de seguridad automática de la colección en una carpeta elegida por el
 * usuario, pensada para OneDrive, Dropbox o similar.
 *
 * En la carpeta quedan la última copia y un historial de las últimas por fecha.
 * Solo se copian las películas: los ajustes llevan la clave de TMDB, que es un
 * secreto y no debe acabar en una carpeta en la nube.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import type { Movie } from '../../shared/types'

/** Se guarda como mucho una vez al día. */
export const BACKUP_EVERY_MS = 24 * 60 * 60 * 1000
/** Copias con fecha que se conservan, además de la última. */
export const KEEP_DATED = 7

export const LATEST_NAME = 'filmdex-ultima-copia.json'
const DATED = /^filmdex-copia-(\d{4}-\d{2}-\d{2})\.json$/

export type BackupResult =
  | { kind: 'saved'; file: string; movies: number }
  | { kind: 'skipped-empty'; previous: number }

async function readMovies(file: string): Promise<Movie[] | null> {
  try {
    const data = JSON.parse(await fs.readFile(file, 'utf8')) as { movies?: Movie[] }
    return Array.isArray(data.movies) ? data.movies : null
  } catch {
    return null
  }
}

/** Escribe en un temporal y renombra, para no dejar nunca una copia a medias. */
async function writeAtomic(file: string, text: string): Promise<void> {
  await fs.writeFile(`${file}.tmp`, text, 'utf8')
  await fs.rename(`${file}.tmp`, file)
}

/**
 * Guarda la copia. Si la colección está vacía pero la última copia tenía
 * películas, no se toca: lo más probable es un fallo, y sobrescribirla dejaría
 * sin datos también la copia.
 */
export async function writeBackup(dir: string, movies: Movie[], now = new Date()): Promise<BackupResult> {
  await fs.mkdir(dir, { recursive: true })
  const latest = path.join(dir, LATEST_NAME)

  if (movies.length === 0) {
    const previous = await readMovies(latest)
    if (previous && previous.length > 0) return { kind: 'skipped-empty', previous: previous.length }
  }

  const text = JSON.stringify({ version: 1, savedAt: now.toISOString(), movies }, null, 2)
  await writeAtomic(latest, text)

  const day = now.toISOString().slice(0, 10)
  await writeAtomic(path.join(dir, `filmdex-copia-${day}.json`), text)

  // Historial: se quedan las más recientes y se borran solo copias propias.
  const dated = (await fs.readdir(dir)).filter((name) => DATED.test(name)).sort().reverse()
  await Promise.all(dated.slice(KEEP_DATED).map((name) => fs.rm(path.join(dir, name), { force: true })))

  return { kind: 'saved', file: latest, movies: movies.length }
}

/** Lee la última copia de una carpeta, para restaurarla. */
export async function readBackup(dir: string): Promise<Movie[]> {
  const movies = await readMovies(path.join(dir, LATEST_NAME))
  if (!movies) throw new Error('En esa carpeta no hay ninguna copia de Filmdex.')
  return movies
}

/** ¿Toca copia? Nunca hecha, o la última tiene más de un día. */
export function isDue(lastBackupAt: string | null, now = new Date()): boolean {
  if (!lastBackupAt) return true
  return now.getTime() - new Date(lastBackupAt).getTime() >= BACKUP_EVERY_MS
}
