import { useEffect, useRef, useState, type JSX } from 'react'
import { WindowControls } from './WindowControls'
import { IconClose, IconSearch, IconSettings } from './icons'

export type View = 'home' | 'collection' | 'wishlist' | 'search' | 'settings'

interface Props {
  view: View
  onChange: (view: View) => void
  query: string
  onQuery: (query: string) => void
  scrolled: boolean
}

const LINKS: { id: View; label: string }[] = [
  { id: 'home', label: 'Inicio' },
  { id: 'collection', label: 'Mi coleccion' },
  { id: 'wishlist', label: 'Mi lista' }
]

export function TopNav({ view, onChange, query, onQuery, scrolled }: Props): JSX.Element {
  const [open, setOpen] = useState(view === 'search')
  const input = useRef<HTMLInputElement>(null)

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

      <div className="nav-links">
        {LINKS.map((link) => (
          <button
            key={link.id}
            className={`nav-link${view === link.id ? ' active' : ''}`}
            onClick={() => onChange(link.id)}
          >
            {link.label}
          </button>
        ))}
      </div>

      <div className="nav-right">
        <div className={`nav-search${open ? ' open' : ''}`}>
          <button
            onClick={() => (open ? close() : setOpen(true))}
            aria-label={open ? 'Cerrar busqueda' : 'Buscar'}
          >
            {open ? <IconClose /> : <IconSearch />}
          </button>
          <input
            ref={input}
            value={query}
            placeholder="Titulos, directores, generos"
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
