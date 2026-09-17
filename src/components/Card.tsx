import type { CSSProperties, JSX } from 'react'
import { Poster } from './Poster'
import { IconCheck } from './icons'

/** A partir de esta posicion, las fichas ya entran todas a la vez. */
const STAGGER_LIMIT = 16

export interface CardProps {
  title: string
  year: number | null
  posterUrl: string | null
  /** Etiqueta de la esquina: el formato cuando la pelicula ya es tuya. */
  badge?: string | null
  owned?: boolean
  score?: number | null
  /** Posicion en la rejilla, para que las fichas entren escalonadas. */
  index?: number
  onOpen: () => void
}

export function Card({ title, year, posterUrl, badge, owned, score, index, onOpen }: CardProps): JSX.Element {
  return (
    <button
      className="card"
      onClick={onOpen}
      title={title}
      // El escalonado se corta pronto: con una coleccion larga, si no, las
      // ultimas fichas tardarian segundos en aparecer.
      style={{ '--i': Math.min(index ?? 0, STAGGER_LIMIT) } as CSSProperties}
    >
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
