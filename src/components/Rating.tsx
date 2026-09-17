import type { JSX } from 'react'
import { IconStar } from './icons'

interface Props {
  value: number | null
  onChange: (value: number | null) => void
}

/** Diez estrellas, de 1 a 10. Pulsar la estrella actual borra la nota. */
export function Rating({ value, onChange }: Props): JSX.Element {
  return (
    <div className="rating">
      {Array.from({ length: 10 }, (_, index) => {
        const score = index + 1
        const on = value !== null && score <= value
        return (
          <button
            key={score}
            className={on ? 'on' : ''}
            title={`${score} de 10`}
            onClick={() => onChange(value === score ? null : score)}
          >
            <IconStar />
          </button>
        )
      })}
      <span className="value">{value === null ? 'Sin nota' : `${value}/10`}</span>
    </div>
  )
}
