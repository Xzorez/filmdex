import { useMemo, useState, type JSX } from 'react'
import { FORMATS, type Movie, type Status } from '../../shared/types'
import { normalize } from '../lib/format'
import { MovieCard } from './MovieCard'
import { IconFilm, IconPlus, IconSearch } from './icons'

type SortKey = 'added' | 'title' | 'year' | 'rating'

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'added', label: 'Anadidas' },
  { id: 'title', label: 'Titulo' },
  { id: 'year', label: 'Ano' },
  { id: 'rating', label: 'Mi nota' }
]

interface Props {
  movies: Movie[]
  status: Status
  onOpen: (movie: Movie) => void
  onGoAdd: () => void
}

export function LibraryView({ movies, status, onOpen, onGoAdd }: Props): JSX.Element {
  const [query, setQuery] = useState('')
  const [format, setFormat] = useState<string>('todos')
  const [watched, setWatched] = useState<'todas' | 'vistas' | 'pendientes'>('todas')
  const [sort, setSort] = useState<SortKey>('added')

  const scoped = useMemo(() => movies.filter((m) => m.status === status), [movies, status])

  const visible = useMemo(() => {
    const needle = normalize(query.trim())
    const filtered = scoped.filter((movie) => {
      if (format !== 'todos' && movie.format !== format) return false
      if (watched === 'vistas' && !movie.watched) return false
      if (watched === 'pendientes' && movie.watched) return false
      if (!needle) return true
      const haystack = normalize(
        [movie.title, movie.originalTitle, movie.director ?? '', movie.genres.join(' '), movie.notes].join(' ')
      )
      return haystack.includes(needle)
    })

    return filtered.sort((a, b) => {
      switch (sort) {
        case 'title':
          return a.title.localeCompare(b.title, 'es')
        case 'year':
          return (b.year ?? 0) - (a.year ?? 0)
        case 'rating':
          return (b.rating ?? -1) - (a.rating ?? -1)
        default:
          return b.addedAt.localeCompare(a.addedAt)
      }
    })
  }, [scoped, query, format, watched, sort])

  if (scoped.length === 0) {
    return (
      <div className="empty">
        <IconFilm className="empty-icon" />
        <h3>{status === 'owned' ? 'Tu estanteria esta vacia' : 'No tienes peliculas deseadas'}</h3>
        <p>
          {status === 'owned'
            ? 'Busca una pelicula por titulo y guardala con su formato para empezar el catalogo.'
            : 'Apunta aqui las peliculas que quieres comprar o ver mas adelante.'}
        </p>
        <button className="btn btn-primary" onClick={onGoAdd}>
          <IconPlus />
          Anadir pelicula
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="toolbar">
        <div className="search-field">
          <IconSearch />
          <input
            className="input"
            placeholder="Filtrar por titulo, director, genero..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <select className="select" style={{ width: 128 }} value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="todos">Todo formato</option>
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <div className="chip-row">
          {(['todas', 'vistas', 'pendientes'] as const).map((option) => (
            <button
              key={option}
              className={`chip${watched === option ? ' active' : ''}`}
              onClick={() => setWatched(option)}
            >
              {option[0].toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>

        <span className="spacer" />

        <div className="chip-row">
          {SORTS.map((option) => (
            <button
              key={option.id}
              className={`chip${sort === option.id ? ' active' : ''}`}
              onClick={() => setSort(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <IconSearch className="empty-icon" />
          <h3>Sin resultados</h3>
          <p>Ninguna pelicula de tu coleccion encaja con estos filtros.</p>
        </div>
      ) : (
        <div className="grid">
          {visible.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onOpen={onOpen} />
          ))}
        </div>
      )}
    </>
  )
}
