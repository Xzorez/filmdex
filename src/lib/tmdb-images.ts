const BASE = 'https://image.tmdb.org/t/p'

export function posterUrl(path: string | null, size: 'w154' | 'w342' | 'w500' = 'w342'): string | null {
  return path ? `${BASE}/${size}${path}` : null
}

export function backdropUrl(path: string | null): string | null {
  return path ? `${BASE}/w780${path}` : null
}
