import type { JSX } from 'react'
import type { Movie, Source } from '../../shared/types'
import { IconFilm, IconHeart, IconLibrary, IconPlus, IconSettings } from './icons'

export type View = 'library' | 'wishlist' | 'add' | 'settings'

interface Props {
  view: View
  onChange: (view: View) => void
  movies: Movie[]
  version: string
  source: Source
}

export function Sidebar({ view, onChange, movies, version, source }: Props): JSX.Element {
  const owned = movies.filter((m) => m.status === 'owned')
  const wishlist = movies.filter((m) => m.status === 'wishlist')
  const watched = owned.filter((m) => m.watched)

  const items: { id: View; label: string; icon: JSX.Element; count?: number }[] = [
    { id: 'library', label: 'Mi coleccion', icon: <IconLibrary />, count: owned.length },
    { id: 'wishlist', label: 'Quiero verla', icon: <IconHeart />, count: wishlist.length },
    { id: 'add', label: 'Anadir pelicula', icon: <IconPlus /> }
  ]

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">F</div>
        <div>
          <div className="brand-name">Filmdex</div>
          <div className="brand-version">v{version}</div>
        </div>
      </div>

      {items.map((item) => (
        <button
          key={item.id}
          className={`nav-item${view === item.id ? ' active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.icon}
          <span>{item.label}</span>
          {item.count !== undefined && <span className="count">{item.count}</span>}
        </button>
      ))}

      <div className="nav-label">Resumen</div>
      <div style={{ padding: '2px 10px 0' }}>
        <div className="stat-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="stat">
            <div className="n">{owned.length}</div>
            <div className="l">en la estanteria</div>
          </div>
          <div className="stat">
            <div className="n">{watched.length}</div>
            <div className="l">ya vistas</div>
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        <button
          className={`nav-item${view === 'settings' ? ' active' : ''}`}
          onClick={() => onChange('settings')}
        >
          <IconSettings />
          <span>Ajustes</span>
        </button>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center', padding: '10px 10px 0', color: 'var(--text-faint)', fontSize: 11 }}>
          <IconFilm className="nav-icon" />
          <span>{source === 'tmdb' ? 'Fichas de TMDB' : 'Fichas de IMDb y Wikipedia'}</span>
        </div>
      </div>
    </aside>
  )
}
