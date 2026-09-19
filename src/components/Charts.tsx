import { useRef, useState, type FocusEvent, type JSX, type PointerEvent, type RefObject } from 'react'
import type { Bar } from '../lib/stats'

interface Tip {
  x: number
  y: number
  value: string
  label: string
}

interface ChartProps {
  bars: Bar[]
  /** Cómo se lee cada valor en el tooltip y la tabla: "3 películas". */
  unit: (value: number) => string
  /** Nombre de la tabla de datos, para lectores de pantalla. */
  caption: string
  /** Texto secundario del tooltip; por defecto, la etiqueta de la barra. */
  note?: (bar: Bar) => string
}

/**
 * Tooltip de una gráfica. Se coloca sobre el puntero al pasar el ratón y sobre la
 * barra al llegar con el teclado, para que el dato no dependa del ratón.
 */
function useTip(): {
  frame: RefObject<HTMLDivElement | null>
  tip: Tip | null
  onPointer: (event: PointerEvent<HTMLElement>, value: string, label: string) => void
  onFocus: (event: FocusEvent<HTMLElement>, value: string, label: string) => void
  hide: () => void
} {
  const frame = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<Tip | null>(null)
  const origin = (): DOMRect | undefined => frame.current?.getBoundingClientRect()

  return {
    frame,
    tip,
    onPointer: (event, value, label) => {
      const box = origin()
      if (box) setTip({ x: event.clientX - box.left, y: event.clientY - box.top, value, label })
    },
    onFocus: (event, value, label) => {
      const box = origin()
      const mark = event.currentTarget.getBoundingClientRect()
      if (box) setTip({ x: mark.left + mark.width / 2 - box.left, y: mark.top - box.top, value, label })
    },
    hide: () => setTip(null)
  }
}

function Tooltip({ tip }: { tip: Tip | null }): JSX.Element | null {
  if (!tip) return null
  return (
    <div className="chart-tip" style={{ left: tip.x, top: tip.y }} role="presentation">
      <strong>{tip.value}</strong>
      <span>{tip.label}</span>
    </div>
  )
}

/** Los mismos datos en tabla, para quien no quiera o no pueda leer la gráfica. */
function DataTable({ bars, unit, caption }: ChartProps): JSX.Element {
  return (
    <details className="chart-table">
      <summary>Ver datos</summary>
      <table>
        <caption className="sr-only">{caption}</caption>
        <tbody>
          {bars.map((bar) => (
            <tr key={bar.label}>
              <th scope="row">{bar.label}</th>
              <td>{unit(bar.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}

/** Barras horizontales ordenadas, con el valor en la punta de cada una. */
export function BarChart({ bars, unit, caption, note }: ChartProps): JSX.Element {
  const { frame, tip, onPointer, onFocus, hide } = useTip()
  const max = Math.max(1, ...bars.map((bar) => bar.value))

  return (
    <>
      <div className="chart hbar" ref={frame} onPointerLeave={hide}>
        {bars.map((bar) => {
          const detail = note ? note(bar) : bar.label
          return (
            <div
              key={bar.label}
              className="hbar-row"
              tabIndex={0}
              aria-label={`${bar.label}: ${unit(bar.value)}`}
              onPointerMove={(event) => onPointer(event, unit(bar.value), detail)}
              onFocus={(event) => onFocus(event, unit(bar.value), detail)}
              onBlur={hide}
            >
              <span className="hbar-label">{bar.label}</span>
              <span className="hbar-track">
                <span className="hbar-fill" style={{ width: `${(bar.value / max) * 100}%` }} />
                <span className="hbar-value">{bar.value}</span>
              </span>
            </div>
          )
        })}
        <Tooltip tip={tip} />
      </div>
      <DataTable bars={bars} unit={unit} caption={caption} />
    </>
  )
}

/**
 * Columnas sobre una línea base. Solo se rotulan las que tienen valor: con doce
 * meses, un cero encima de cada hueco sería ruido.
 */
export function ColumnChart({ bars, unit, caption }: ChartProps): JSX.Element {
  const { frame, tip, onPointer, onFocus, hide } = useTip()
  const max = Math.max(1, ...bars.map((bar) => bar.value))

  return (
    <>
      <div className="chart columns" ref={frame} onPointerLeave={hide}>
        <div className="columns-plot">
          {bars.map((bar) => (
            <div
              key={bar.label}
              className="column"
              tabIndex={0}
              aria-label={`${bar.label}: ${unit(bar.value)}`}
              onPointerMove={(event) => onPointer(event, unit(bar.value), bar.label)}
              onFocus={(event) => onFocus(event, unit(bar.value), bar.label)}
              onBlur={hide}
            >
              {bar.value > 0 && <span className="column-value">{bar.value}</span>}
              <span className="column-fill" style={{ height: `${(bar.value / max) * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="columns-axis">
          {bars.map((bar) => (
            <span key={bar.label}>{bar.label}</span>
          ))}
        </div>
        <Tooltip tip={tip} />
      </div>
      <DataTable bars={bars} unit={unit} caption={caption} />
    </>
  )
}
