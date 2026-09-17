import { useEffect, useState, type JSX } from 'react'

interface Props {
  backdropUrl: string | null
  posterUrl: string | null
  title: string
}

/**
 * Fondo apaisado con dos respaldos. No todas las peliculas tienen imagen de
 * fondo, y las que la tienen pueden servirla rota: primero se intenta el fondo,
 * luego la caratula y, si tampoco, queda un degradado con el titulo en vez de
 * un hueco negro.
 */
export function Backdrop({ backdropUrl, posterUrl, title }: Props): JSX.Element {
  const sources = [backdropUrl, posterUrl].filter((url): url is string => Boolean(url))
  const [index, setIndex] = useState(0)

  useEffect(() => setIndex(0), [backdropUrl, posterUrl])

  const current = sources[index]

  if (!current) {
    return (
      <div className="backdrop-fallback">
        <span>{title}</span>
      </div>
    )
  }

  return <img src={current} alt="" onError={() => setIndex((value) => value + 1)} />
}
