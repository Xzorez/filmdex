import { useEffect, useState, type JSX } from 'react'
import type { Movie, SearchResult } from '../../shared/types'
import { findOwned, ownedIndex } from '../lib/movie'
import { Card } from './Card'
import { IconSearch, IconSettings } from './icons'

interface Props {
  query: string
  movies: Movie[]
  needsTmdbKey: boolean
  onOpen: (result: SearchResult) => void
  onGoSettings: () => void
}

export function SearchView({ query, movies, needsTmdbKey, onOpen, onGoSettings }: Props): JSX.Element {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const owned = ownedIndex(movies)

  // Con retardo: no se lanza una peticion por cada tecla.
  useEffect(() => {
    if (needsTmdbKey) return
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      setSearched(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    const timer = setTimeout(async () => {
      try {
        const found = await window.filmdex.sources.search(term)
        if (!cancelled) {
          setResults(found)
          setSearched(true)
        }
      } catch (problem) {
        if (!cancelled) setError((problem as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, needsTmdbKey])

  if (needsTmdbKey) {
    return (
      <div className="page">
        <div className="empty">
          <IconSettings className="empty-icon" />
          <h3>Falta la clave de TMDB</h3>
          <p>
            Tienes elegida la fuente TMDB, que necesita una clave gratuita. Anadela en Ajustes o vuelve a la fuente
            que no pide cuenta.
          </p>
          <button className="btn btn-light" onClick={onGoSettings}>
            Ir a Ajustes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{query.trim() ? `Resultados para "${query.trim()}"` : 'Buscar'}</h1>
          <p className="page-sub">
            {loading ? 'Buscando...' : searched ? `${results.length} peliculas encontradas` : 'Escribe al menos dos letras'}
          </p>
        </div>
      </div>

      {loading && (
        <div className="loading-row">
          <span className="spinner" />
          Buscando peliculas...
        </div>
      )}

      {error && !loading && (
        <div className="empty">
          <IconSearch className="empty-icon" />
          <h3>No se pudo buscar</h3>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && searched && results.length === 0 && (
        <div className="empty">
          <IconSearch className="empty-icon" />
          <h3>Ninguna coincidencia</h3>
          <p>Prueba con el titulo original, o quita el ano de la busqueda.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="grid">
          {results.map((result, position) => {
            const mine = findOwned(owned, result)
            return (
              <Card
                key={result.sourceId}
                index={position}
                title={result.title}
                year={result.year}
                posterUrl={result.posterUrl}
                badge={mine?.format ?? null}
                owned={Boolean(mine)}
                score={result.voteAverage}
                onOpen={() => onOpen(result)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
