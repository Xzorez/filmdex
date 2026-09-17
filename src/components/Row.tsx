import { useRef, type JSX, type ReactNode } from 'react'
import { IconChevronLeft, IconChevronRight } from './icons'

interface Props {
  title: string
  note?: string
  loading?: boolean
  children: ReactNode
  /** Cuantas tarjetas hay: sin ninguna, la fila no se pinta. */
  count: number
}

/** Carrusel horizontal con flechas que aparecen al pasar por encima. */
export function Row({ title, note, loading, children, count }: Props): JSX.Element | null {
  const track = useRef<HTMLDivElement>(null)

  if (!loading && count === 0) return null

  // Se desplaza casi una pantalla, dejando una tarjeta a la vista como ancla.
  const slide = (direction: -1 | 1): void => {
    const element = track.current
    if (!element) return
    element.scrollBy({ left: direction * (element.clientWidth - 180), behavior: 'smooth' })
  }

  return (
    <section className="row">
      <div className="row-head">
        <h2 className="row-title">{title}</h2>
        {note && <span className="row-note">{note}</span>}
      </div>

      {loading ? (
        <div className="skeleton-row">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="skeleton-card" />
          ))}
        </div>
      ) : (
        <div className="row-viewport">
          <button className="row-arrow left" onClick={() => slide(-1)} aria-label="Anterior">
            <IconChevronLeft />
          </button>
          <div className="row-track" ref={track}>
            {children}
          </div>
          <button className="row-arrow right" onClick={() => slide(1)} aria-label="Siguiente">
            <IconChevronRight />
          </button>
        </div>
      )}
    </section>
  )
}
