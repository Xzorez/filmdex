import { useEffect, type JSX } from 'react'
import { IconClose } from './icons'

interface Props {
  youtubeKey: string
  title: string
  onClose: () => void
}

/**
 * Trailer a pantalla completa sobre la app. Se usa el dominio sin cookies de
 * YouTube, y el proceso principal le anade la cabecera de origen sin la que
 * YouTube se niega a reproducir en una app de escritorio.
 *
 * Arranca en silencio a proposito. Con sonido, Chromium y YouTube lo pausan y
 * reanudan a trompicones, porque el clic en "Ver trailer" ocurre en la app y no
 * dentro del reproductor. En silencio empieza al instante, como las vistas
 * previas de Netflix, y el altavoz del reproductor activa el sonido de forma
 * fiable porque ese clic si es dentro de el.
 */
export function TrailerPlayer({ youtubeKey, title, onClose }: Props): JSX.Element {
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        // La ficha de debajo tambien escucha Escape: esta tecla es solo nuestra.
        event.stopImmediatePropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    // Cuando el foco esta dentro del reproductor, el Escape solo llega por aqui.
    const stopEscape = window.filmdex.app.onEscape(onClose)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      stopEscape()
    }
  }, [onClose])

  const params = new URLSearchParams({ autoplay: '1', mute: '1', rel: '0', modestbranding: '1', hl: 'es' })

  return (
    <div className="trailer" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="trailer-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeKey)}?${params.toString()}`}
          title={`Trailer de ${title}`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
      <button className="trailer-close" onClick={onClose} aria-label="Cerrar trailer" title="Cerrar (Esc)">
        <IconClose />
      </button>
    </div>
  )
}
