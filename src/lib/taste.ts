import { GENRES, type Movie } from '../../shared/types'
import { normalize } from './format'

/**
 * Se compara sin tildes: las peliculas guardadas antes de la v0.4.1 tienen los
 * generos escritos como "Accion" o "Ciencia ficcion", y tienen que seguir
 * contando igual que las nuevas con "Acción".
 */
const CANONICAL = new Map<string, string>()
for (const genre of GENRES) {
  CANONICAL.set(normalize(genre.id), genre.id)
  CANONICAL.set(normalize(genre.label), genre.id)
}

/** Los géneros se guardan traducidos; esto los devuelve a su nombre común. */
export function canonicalGenre(name: string): string | null {
  return CANONICAL.get(normalize(name.trim())) ?? null
}

export function labelOf(id: string): string {
  return GENRES.find((genre) => genre.id === id)?.label ?? id
}

/**
 * Los géneros que más se repiten en la colección, de más a menos. Las películas
 * puntuadas alto pesan más: si le pusiste un 9 a tres de terror, el terror
 * cuenta más que un drama que guardaste sin llegar a verlo.
 */
export function favouriteGenres(movies: Movie[]): string[] {
  const score = new Map<string, number>()

  for (const movie of movies) {
    if (movie.status !== 'owned' && movie.status !== 'wishlist') continue
    const weight = movie.rating !== null ? 1 + (movie.rating - 5) / 5 : 1
    for (const raw of movie.genres) {
      const id = canonicalGenre(raw)
      if (!id) continue
      score.set(id, (score.get(id) ?? 0) + Math.max(weight, 0.2))
    }
  }

  return [...score.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
}
