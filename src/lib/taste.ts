import { GENRES, type Movie } from '../../shared/types'

const CANONICAL = new Map<string, string>()
for (const genre of GENRES) {
  CANONICAL.set(genre.id.toLowerCase(), genre.id)
  CANONICAL.set(genre.label.toLowerCase(), genre.id)
}

/** Los generos se guardan traducidos; esto los devuelve a su nombre comun. */
export function canonicalGenre(name: string): string | null {
  return CANONICAL.get(name.trim().toLowerCase()) ?? null
}

export function labelOf(id: string): string {
  return GENRES.find((genre) => genre.id === id)?.label ?? id
}

/**
 * Los generos que mas se repiten en la coleccion, de mas a menos. Las peliculas
 * puntuadas alto pesan mas: si le pusiste un 9 a tres de terror, el terror
 * cuenta mas que un drama que guardaste sin llegar a verlo.
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
