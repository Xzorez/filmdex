import { useEffect, useState } from 'react'
import type { Catalog, MovieDetails } from '../../shared/types'

/**
 * Las listas ya pedidas se quedan aqui mientras la app este abierta: moverse
 * entre secciones o volver a un genero no repite la peticion.
 */
const cache = new Map<string, MovieDetails[]>()

export interface RowState {
  movies: MovieDetails[]
  loading: boolean
  error: string | null
}

/**
 * Pide una lista para descubrir. `enabled` en falso deja la fila en blanco sin
 * llegar a pedir nada, que es lo que hace falta para las filas que dependen de
 * la coleccion cuando todavia esta vacia.
 */
export function useDiscover(catalog: Catalog, genre: string | null, enabled = true): RowState {
  const key = `${catalog}|${genre ?? 'todos'}`
  const [state, setState] = useState<RowState>(() => ({
    movies: cache.get(key) ?? [],
    loading: enabled && !cache.has(key),
    error: null
  }))

  useEffect(() => {
    if (!enabled) {
      setState({ movies: [], loading: false, error: null })
      return
    }

    const cached = cache.get(key)
    if (cached) {
      setState({ movies: cached, loading: false, error: null })
      return
    }

    let cancelled = false
    setState({ movies: [], loading: true, error: null })

    void (async () => {
      try {
        const movies = await window.filmdex.sources.discover({ catalog, genre })
        cache.set(key, movies)
        if (!cancelled) setState({ movies, loading: false, error: null })
      } catch (error) {
        if (!cancelled) setState({ movies: [], loading: false, error: (error as Error).message })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [key, catalog, genre, enabled])

  return state
}

/** Se vacia al cambiar de fuente o de idioma: lo guardado ya no vale. */
export function clearDiscoverCache(): void {
  cache.clear()
}
