import { useEffect, useState, type JSX } from 'react'

interface Props {
  url: string | null
  title: string
  className?: string
}

/**
 * Carátula con respaldo: si TMDB no responde o no hay red, en vez de un hueco
 * vacio se muestra el título de la película.
 */
export function Poster({ url, title, className }: Props): JSX.Element {
  const [broken, setBroken] = useState(false)

  useEffect(() => setBroken(false), [url])

  if (!url || broken) {
    return <div className={`poster-fallback${className ? ` ${className}` : ''}`}>{title}</div>
  }

  return <img className={className} src={url} alt="" loading="lazy" onError={() => setBroken(true)} />
}
