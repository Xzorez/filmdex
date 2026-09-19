import { useEffect, useState, type JSX } from 'react'
import type { WatchOptions, WatchProvider } from '../../shared/types'

/** Lo ya consultado durante la sesión: reabrir una ficha no repite la peticion. */
const cache = new Map<number, WatchOptions | null>()

interface Props {
  tmdbId: number | null
  hasTmdbKey: boolean
  onGoSettings: () => void
}

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; options: WatchOptions | null }
  | { kind: 'error' }

export function WatchPanel({ tmdbId, hasTmdbKey, onGoSettings }: Props): JSX.Element | null {
  const [state, setState] = useState<State>(() =>
    tmdbId !== null && cache.has(tmdbId) ? { kind: 'ready', options: cache.get(tmdbId) ?? null } : { kind: 'loading' }
  )

  useEffect(() => {
    if (!hasTmdbKey || tmdbId === null) return
    if (cache.has(tmdbId)) {
      setState({ kind: 'ready', options: cache.get(tmdbId) ?? null })
      return
    }

    let cancelled = false
    setState({ kind: 'loading' })
    window.filmdex.sources
      .watchProviders(tmdbId)
      .then((options) => {
        cache.set(tmdbId, options)
        if (!cancelled) setState({ kind: 'ready', options })
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [tmdbId, hasTmdbKey])

  // Sin código de TMDB no hay a quien preguntar: mejor no mostrar nada.
  if (tmdbId === null) return null

  if (!hasTmdbKey) {
    return (
      <section className="watch">
        <h4>Dónde verla</h4>
        <p className="watch-note">
          Para saber en qué plataformas está, añade tu clave de TMDB.{' '}
          <a onClick={onGoSettings}>Ir a Ajustes</a>
        </p>
      </section>
    )
  }

  if (state.kind === 'error') return null

  const options = state.kind === 'ready' ? state.options : null
  const open = (): void => {
    if (options?.link) void window.filmdex.app.openExternal(options.link)
  }

  return (
    <section className="watch">
      <h4>Dónde verla</h4>

      {state.kind === 'loading' && (
        <div className="watch-row">
          {Array.from({ length: 4 }, (_, slot) => (
            <span key={slot} className="watch-logo skeleton" />
          ))}
        </div>
      )}

      {state.kind === 'ready' && !options && (
        <p className="watch-note">No está en ninguna plataforma en tu país ahora mismo.</p>
      )}

      {options && (
        <>
          <Group label="Incluida" providers={options.stream} onOpen={open} />
          <Group label="Alquiler" providers={options.rent} onOpen={open} />
          <Group label="Compra" providers={options.buy} onOpen={open} />
          {/* TMDB exige citar a JustWatch, que es de donde salen estos datos. */}
          <p className="watch-credit">Disponibilidad según JustWatch</p>
        </>
      )}
    </section>
  )
}

function Group({
  label,
  providers,
  onOpen
}: {
  label: string
  providers: WatchProvider[]
  onOpen: () => void
}): JSX.Element | null {
  if (providers.length === 0) return null
  return (
    <div className="watch-group">
      <span className="watch-label">{label}</span>
      <div className="watch-row">
        {providers.map((provider) => (
          <button key={provider.name} className="watch-logo" onClick={onOpen} title={provider.name}>
            {provider.logoUrl ? <img src={provider.logoUrl} alt={provider.name} /> : provider.name.slice(0, 2)}
          </button>
        ))}
      </div>
    </div>
  )
}
