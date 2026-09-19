import { useMemo, type JSX } from 'react'
import type { Movie } from '../../shared/types'
import { computeStats } from '../lib/stats'
import { rememberOrigin } from '../lib/transition'
import { BarChart, ColumnChart } from './Charts'
import { Poster } from './Poster'
import { IconFilm } from './icons'

interface Props {
  movies: Movie[]
  onOpen: (movie: Movie) => void
}

const films = (count: number): string => `${count} ${count === 1 ? 'película' : 'películas'}`

/** Horas con una cifra decimal si son pocas, redondeadas si ya son muchas. */
function hoursLabel(minutes: number): string {
  const hours = minutes / 60
  if (hours === 0) return '0'
  return hours < 10 ? hours.toFixed(1).replace('.', ',') : Math.round(hours).toLocaleString('es-ES')
}

export function StatsView({ movies, onOpen }: Props): JSX.Element {
  const stats = useMemo(() => computeStats(movies), [movies])
  const seenThisYear = stats.months.reduce((sum, month) => sum + month.value, 0)

  const tiles = [
    { label: 'Películas vistas', value: stats.watched.toLocaleString('es-ES') },
    {
      label: 'Horas de cine',
      value: hoursLabel(stats.minutes),
      hint: stats.unknownRuntime > 0 ? `Sin contar ${films(stats.unknownRuntime)} sin duración conocida` : undefined
    },
    { label: 'En tu colección', value: stats.owned.toLocaleString('es-ES') },
    { label: 'En tu lista', value: stats.wishlist.toLocaleString('es-ES') },
    { label: 'Tu nota media', value: stats.average === null ? '-' : stats.average.toFixed(1).replace('.', ',') }
  ]

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Tus estadísticas</h1>
          <p className="page-sub">Lo que has visto, en números</p>
        </div>
      </div>

      <div className="stats-tiles">
        {tiles.map((tile) => (
          <div key={tile.label} className="stats-tile" title={tile.hint}>
            <div className="stats-tile-label">{tile.label}</div>
            <div className="stats-tile-value">{tile.value}</div>
            {tile.hint && <div className="stats-tile-hint">{tile.hint}</div>}
          </div>
        ))}
      </div>

      {stats.watched === 0 ? (
        <div className="empty">
          <IconFilm className="empty-icon" />
          <h3>Aún no hay nada que contar</h3>
          <p>
            Las gráficas salen de las películas que marcas como vistas. Abre una de tu colección y pulsa «Marcar como
            vista».
          </p>
        </div>
      ) : (
        <div className="stats-grid">
          <section className="stats-card">
            <h2>Los géneros que más ves</h2>
            <BarChart
              bars={stats.genres}
              unit={films}
              caption="Películas vistas por género"
              note={(bar) => `${bar.label} · ${Math.round((bar.value / stats.watched) * 100)} % de lo que has visto`}
            />
          </section>

          <section className="stats-card">
            <h2>Por décadas de estreno</h2>
            <ColumnChart bars={stats.decades} unit={films} caption="Películas vistas por década de estreno" />
          </section>

          <section className="stats-card wide">
            <h2>Tu ritmo en el último año</h2>
            <p className="stats-card-sub">
              {seenThisYear === 0
                ? 'Ninguna marcada como vista en los últimos doce meses.'
                : `${films(seenThisYear)} en los últimos doce meses.`}
            </p>
            <ColumnChart bars={stats.months} unit={films} caption="Películas vistas cada mes del último año" />
          </section>

          <section className="stats-card">
            <h2>Los directores que más ves</h2>
            {stats.directors.length === 0 ? (
              <p className="stats-card-sub">Sin datos de dirección en lo que has visto.</p>
            ) : (
              <ol className="stats-rank">
                {stats.directors.map((director) => (
                  <li key={director.label}>
                    <span>{director.label}</span>
                    <span className="stats-rank-value">{films(director.value)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="stats-card">
            <h2>Tus mejores notas</h2>
            {stats.best.length === 0 ? (
              <p className="stats-card-sub">Aún no has puntuado ninguna película.</p>
            ) : (
              <ol className="stats-best">
                {stats.best.map((movie) => (
                  <li key={movie.id}>
                    <button
                      onClick={(event) => {
                        rememberOrigin(event.currentTarget)
                        onOpen(movie)
                      }}
                    >
                      <span className="stats-best-poster">
                        <Poster url={movie.posterUrl} title={movie.title} />
                      </span>
                      <span className="stats-best-title">{movie.title}</span>
                      <span className="stats-rank-value">{movie.rating}/10</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
