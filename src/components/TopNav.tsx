import { useEffect, useLayoutEffect, useRef, useState, type JSX } from 'react'
import { WindowControls } from './WindowControls'
import { IconClose, IconSearch, IconSettings, IconSparkle } from './icons'

export type View = 'home' | 'collection' | 'wishlist' | 'search' | 'settings' | 'stats'

interface Props {
  view: View
  onChange: (view: View) => void
  query: string
  onQuery: (query: string) => void
  scrolled: boolean
  onSurprise: () => void
}

const LINKS: { id: View; label: string }[] = [
  { id: 'home', label: 'Inicio' },
  { id: 'collection', label: 'Mi colección' },
  { id: 'wishlist', label: 'Mi lista' }
]

export function TopNav({ view, onChange, query, onQuery, scrolled, onSurprise }: Props): JSX.Element {
  const [open, setOpen] = useState(view === 'search')
  const input = useRef<HTMLInputElement>(null)
  const links = useRef<HTMLDivElement>(null)
  const [bar, setBar] = useState<{ x: number; width: number; visible: boolean }>({ x: 0, width: 0, visible: false })

  // La raya roja se desliza hasta la sección activa. Se mide después de pintar
  // la negrita, que cambia el ancho del enlace. Fuera de las secciones (ajustes,
  // búsqueda) se apaga donde está, sin volver al principio.
  useLayoutEffect(() => {
    const measure = (): void => {
      const active = links.current?.querySelector<HTMLElement>('.nav-link.active')
      setBar((current) =>
        active ? { x: active.offsetLeft, width: active.offsetWidth, visible: true } : { ...current, visible: false }
      )
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [view])

  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])

  // Volver a otra seccion cierra el buscador y limpia lo escrito.
  useEffect(() => {
    if (view !== 'search') setOpen(false)
  }, [view])

  const close = (): void => {
    setOpen(false)
    onQuery('')
    if (view === 'search') onChange('home')
  }

  return (
    <nav className={`nav${scrolled ? ' solid' : ''}`}>
      <button className="logo" onClick={() => onChange('home')}>
        Filmdex
      </button>

      <div className="nav-links" ref={links}>
        {LINKS.map((link) => (
          <button
            key={link.id}
            className={`nav-link${view === link.id ? ' active' : ''}`}
            onClick={() => onChange(link.id)}
          >
            {link.label}
          </button>
        ))}
        <button className="nav-link nav-surprise" onClick={onSurprise} title="¿Qué veo esta noche?">
          <IconSparkle />
          Sorpréndeme
        </button>
        <span
          className="nav-indicator"
          aria-hidden="true"
          style={{ transform: `translateX(${bar.x}px) scaleX(${bar.width / 100})`, opacity: bar.visible ? 1 : 0 }}
        />
      </div>

      <div className="nav-right">
        <div className={`nav-search${open ? ' open' : ''}`}>
          <button
            onClick={() => (open ? close() : setOpen(true))}
            aria-label={open ? 'Cerrar búsqueda' : 'Buscar'}
          >
            {open ? <IconClose /> : <IconSearch />}
          </button>
          <input
            ref={input}
            value={query}
            placeholder="Títulos, directores, géneros"
            onChange={(event) => {
              onQuery(event.target.value)
              if (event.target.value.trim()) onChange('search')
            }}
            onKeyDown={(event) => event.key === 'Escape' && close()}
            tabIndex={open ? 0 : -1}
          />
        </div>

        <button
          className="icon-btn"
          onClick={() => onChange('settings')}
          aria-label="Ajustes"
          title="Ajustes"
        >
          <IconSettings />
        </button>

        <WindowControls />
      </div>
    </nav>
  )
}
