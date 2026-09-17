import type { JSX } from 'react'
import { Poster } from './Poster'
import { IconCheck } from './icons'

export interface CardProps {
  title: string
  year: number | null
  posterUrl: string | null
  /** Etiqueta de la esquina: el formato cuando la pelicula ya es tuya. */
  badge?: string | null
  owned?: boolean
  score?: number | null
  onOpen: () => void
}

export function Card({ title, year, posterUrl, badge, owned, score, onOpen }: CardProps): JSX.Element {
  return (
    <button className="card" onClick={onOpen} title={title}>
      <div className="card-art">
        <Poster url={posterUrl} title={title} />
        {badge && <span className="card-badge">{badge}</span>}
        {owned && (
          <span className="card-owned" title="La tienes">
            <IconCheck />
          </span>
        )}
        <div className="card-info">
          <div className="card-name">{title}</div>
          <div className="card-sub">
            {year ?? 'Sin ano'}
            {typeof score === 'number' && <span className="score">{score.toFixed(1)}</span>}
          </div>
        </div>
      </div>
    </button>
  )
}
