import type { CSSProperties, JSX } from 'react'
import { Poster } from './Poster'
import { IconCheck } from './icons'

/** A partir de esta posicion, las fichas ya entran todas a la vez. */
const STAGGER_LIMIT = 16

export interface CardProps {
  title: string
  year: number | null
  posterUrl: string | null
  owned?: boolean
  score?: number | null
  /** Etiqueta pequena en la esquina, como la plataforma donde ya se puede ver. */
  tag?: string | null
  /** Posicion en la rejilla, para que las fichas entren escalonadas. */
  index?: number
  onOpen: () => void
}

export function Card({ title, year, posterUrl, owned, score, tag, index, onOpen }: CardProps): JSX.Element {
  return (
    <button
      className="card"
      onClick={onOpen}
      title={title}
      // El escalonado se corta pronto: con una colección larga, si no, las
      // últimas fichas tardarian segundos en aparecer.
      style={{ '--i': Math.min(index ?? 0, STAGGER_LIMIT) } as CSSProperties}
    >
      <div className="card-art">
        <Poster url={posterUrl} title={title} />
        {tag && <span className="card-tag">{tag}</span>}
        {owned && (
          <span className="card-owned" title="La tienes">
            <IconCheck />
          </span>
        )}
        <div className="card-info">
          <div className="card-name">{title}</div>
          <div className="card-sub">
            {year ?? 'Sin año'}
            {typeof score === 'number' && <span className="score">{score.toFixed(1)}</span>}
          </div>
        </div>
      </div>
    </button>
  )
}
