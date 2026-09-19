import type { Movie } from '../../shared/types'
import { canonicalGenre, labelOf } from './taste'

export interface Bar {
  label: string
  value: number
}

export interface Stats {
  watched: number
  /** Minutos vistos, contando solo las películas de las que se sabe la duración. */
  minutes: number
  /** Vistas sin duración conocida: no suman horas y se avisa de ello. */
  unknownRuntime: number
  owned: number
  wishlist: number
  average: number | null
  genres: Bar[]
  directors: Bar[]
  decades: Bar[]
  months: Bar[]
  best: Movie[]
}

function countBy(values: string[]): Bar[] {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'es'))
}

/**
 * Las gráficas hablan de lo que has visto, no de lo que tienes: una estantería
 * llena de pendientes diría poco de tus gustos.
 */
export function computeStats(movies: Movie[], now = new Date()): Stats {
  const watched = movies.filter((movie) => movie.watched)
  const rated = movies.filter((movie) => movie.rating !== null)

  const genres = countBy(
    watched.flatMap((movie) => {
      const ids = movie.genres.map(canonicalGenre).filter((id): id is string => id !== null)
      return [...new Set(ids)].map(labelOf)
    })
  ).slice(0, 8)

  const directors = countBy(watched.map((movie) => movie.director).filter((name): name is string => Boolean(name))).slice(
    0,
    5
  )

  // Décadas seguidas, incluidas las vacías: un hueco también dice algo.
  const years = watched.map((movie) => movie.year).filter((year): year is number => year !== null)
  const decades: Bar[] = []
  if (years.length > 0) {
    const first = Math.floor(Math.min(...years) / 10) * 10
    const last = Math.floor(Math.max(...years) / 10) * 10
    for (let decade = first; decade <= last; decade += 10) {
      decades.push({
        label: `${decade}s`,
        value: years.filter((year) => Math.floor(year / 10) * 10 === decade).length
      })
    }
  }

  // Los últimos doce meses, con el actual al final.
  const months: Bar[] = []
  for (let back = 11; back >= 0; back--) {
    const start = new Date(now.getFullYear(), now.getMonth() - back, 1)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
    months.push({
      label: start.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
      value: watched.filter((movie) => {
        if (!movie.watchedAt) return false
        const when = new Date(movie.watchedAt)
        return when >= start && when < end
      }).length
    })
  }

  return {
    watched: watched.length,
    minutes: watched.reduce((sum, movie) => sum + (movie.runtime ?? 0), 0),
    unknownRuntime: watched.filter((movie) => !movie.runtime).length,
    owned: movies.filter((movie) => movie.status === 'owned').length,
    wishlist: movies.filter((movie) => movie.status === 'wishlist').length,
    average: rated.length ? rated.reduce((sum, movie) => sum + (movie.rating ?? 0), 0) / rated.length : null,
    genres,
    directors,
    decades,
    months,
    best: [...rated].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 5)
  }
}
