import { useEffect, useState, type JSX } from 'react'

/**
 * Minimizar, maximizar y cerrar dibujados por la app. La ventana va sin marco,
 * asi que estos botones sustituyen a los de Windows y siguen el color de la
 * interfaz en vez de romperla por arriba.
 */
export function WindowControls(): JSX.Element {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    void window.filmdex.window.isMaximized().then(setMaximized)
    return window.filmdex.window.onMaximized(setMaximized)
  }, [])

  return (
    <div className="win-controls">
      <button
        className="win-btn"
        onClick={() => void window.filmdex.window.minimize()}
        aria-label="Minimizar"
        title="Minimizar"
      >
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M1.5 6h9" />
        </svg>
      </button>

      <button
        className="win-btn"
        onClick={() => void window.filmdex.window.toggleMaximize().then(setMaximized)}
        aria-label={maximized ? 'Restaurar' : 'Maximizar'}
        title={maximized ? 'Restaurar' : 'Maximizar'}
      >
        {maximized ? (
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3.5 3.5V2h6.5v6.5H8.5" />
            <rect x="2" y="3.5" width="6.5" height="6.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <rect x="2" y="2" width="8" height="8" />
          </svg>
        )}
      </button>

      <button
        className="win-btn danger"
        onClick={() => void window.filmdex.window.close()}
        aria-label="Cerrar"
        title="Cerrar"
      >
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.2 2.2l7.6 7.6M9.8 2.2l-7.6 7.6" />
        </svg>
      </button>
    </div>
  )
}
