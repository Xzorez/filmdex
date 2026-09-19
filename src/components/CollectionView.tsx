import { useMemo, useState, type JSX } from 'react'
import { GENRES, type Movie, type Status } from '../../shared/types'
import { normalize } from '../lib/format'
import { canonicalGenre, labelOf } from '../lib/taste'
import { Card } from './Card'
import { Row } from './Row'
import { IconFilm, IconPlus } from './icons'

type SortKey = 'added' | 'title' | 'year' | 'rating'
type Mode = 'rows' | 'grid'

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'added', label: 'Añadidas' },
  { id: 'title', label: 'Título' },
  { id: 'year', label: 'Año' },
  { id: 'rating', label: 'Mi nota' }
]

interface Props {
  movies: Movie[]
  status: Status
  onOpen: (movie: Movie) => void
  onDiscover: () => void
}

export function CollectionView({ movies, status, onOpen, onDiscover }: Props): JSX.Element {
  const [mode, setMode] = useState<Mode>('rows')
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('todos')
  const [sort, setSort] = useState<SortKey>('added')

  const scoped = useMemo(() => movies.filter((movie) => movie.status === status), [movies, status])

  const filtered = useMemo(() => {
    const needle = normalize(query.trim())
    const list = scoped.filter((movie) => {
      if (genre !== 'todos' && !movie.genres.some((name) => canonicalGenre(name) === genre)) return false
      if (!needle) return true
      const haystack = normalize(
        [movie.title, movie.originalTitle, movie.director ?? '', movie.genres.join(' '), movie.notes].join(' ')
      )
      return haystack.includes(needle)
    })

    return list.sort((a, b) => {
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
  }, [scoped, query, genre, sort])

  const toCard = (movie: Movie, position = 0): JSX.Element => (
    <Card
      key={movie.id}
      index={position}
      title={movie.title}
      year={movie.year}
      posterUrl={movie.posterUrl}
      owned={movie.watched}
      score={movie.rating}
      onOpen={() => onOpen(movie)}
    />
  )

  if (scoped.length === 0) {
    return (
      <div className="page">
        <div className="empty">
          <IconFilm className="empty-icon" />
          <h3>{status === 'owned' ? 'Tu estantería está vacía' : 'Tu lista está vacía'}</h3>
          <p>
            {status === 'owned'
              ? 'Explora el inicio o busca un título arriba, y guarda las películas que tengas en casa.'
              : 'Aquí se guarda lo que quieres ver o comprar más adelante. Añade desde la ficha de cualquier película.'}
          </p>
          <button className="btn btn-light" onClick={onDiscover}>
            <IconPlus />
            Descubrir películas
          </button>
        </div>
      </div>
    )
  }

  // Filas tematicas: solo se pintan las que tengan material suficiente.
  const pending = scoped.filter((movie) => !movie.watched)
  const best = scoped.filter((movie) => (movie.rating ?? 0) >= 8).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  const recent = [...scoped].sort((a, b) => b.addedAt.localeCompare(a.addedAt))
  const byGenre = GENRES.map((item) => ({
    genre: item,
    list: scoped.filter((movie) => movie.genres.some((name) => canonicalGenre(name) === item.id))
  }))
    .filter((group) => group.list.length >= 3)
    .sort((a, b) => b.list.length - a.list.length)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{status === 'owned' ? 'Mi colección' : 'Mi lista'}</h1>
          <p className="page-sub">
            {scoped.length} {scoped.length === 1 ? 'película' : 'películas'}
            {status === 'owned' && ` · ${scoped.filter((movie) => movie.watched).length} vistas`}
          </p>
        </div>

        <div className="page-tools">
          {mode === 'grid' && (
            <>
              <input
                className="input"
                style={{ width: 210 }}
                placeholder="Filtrar por título, director..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <select className="select" value={genre} onChange={(event) => setGenre(event.target.value)}>
                <option value="todos">Todos los géneros</option>
                {GENRES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <select
                className="select"
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
              >
                {SORTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    Ordenar: {item.label}
                  </option>
                ))}
              </select>
            </>
          )}
          <button className="btn btn-outline btn-sm" onClick={() => setMode(mode === 'rows' ? 'grid' : 'rows')}>
            {mode === 'rows' ? 'Ver todas' : 'Ver por grupos'}
          </button>
        </div>
      </div>

      {mode === 'grid' ? (
        filtered.length === 0 ? (
          <div className="empty">
            <IconFilm className="empty-icon" />
            <h3>Sin resultados</h3>
            <p>Ninguna película encaja con ese filtro.</p>
          </div>
        ) : (
          <div className="grid">{filtered.map((movie, position) => toCard(movie, position))}</div>
        )
      ) : (
        <div className="rows">
          <Row index={0} title="Pendientes de ver" count={pending.length}>
            {pending.map(toCard)}
          </Row>
          <Row index={1} title="Tus mejores notas" count={best.length}>
            {best.map(toCard)}
          </Row>
          <Row index={2} title="Añadidas hace poco" count={recent.length}>
            {recent.map(toCard)}
          </Row>
          {byGenre.map((group, position) => (
            <Row key={group.genre.id} index={3 + position} title={labelOf(group.genre.id)} count={group.list.length}>
              {group.list.map(toCard)}
            </Row>
          ))}
        </div>
      )}
    </div>
  )
}
