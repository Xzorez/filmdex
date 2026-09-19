import { useEffect, useState, type JSX } from 'react'
import { useReveal } from '../lib/useReveal'

interface Props {
  backdropUrl: string | null
  posterUrl: string | null
  title: string
}

/**
 * Fondo apaisado con dos respaldos. No todas las películas tienen imagen de
 * fondo, y las que la tienen pueden servirla rota: primero se intenta el fondo,
 * luego la carátula y, si tampoco, queda un degradado con el título en vez de
 * un hueco negro.
 */
export function Backdrop({ backdropUrl, posterUrl, title }: Props): JSX.Element {
  const sources = [backdropUrl, posterUrl].filter((url): url is string => Boolean(url))
  const [index, setIndex] = useState(0)

  useEffect(() => setIndex(0), [backdropUrl, posterUrl])

  const current = sources[index]
  const reveal = useReveal(current ?? null)

  if (!current) {
    return (
      <div className="backdrop-fallback">
        <span>{title}</span>
      </div>
    )
  }

  // Mientras llega el fondo, la carátula (casi siempre ya en caché) hace de
  // fondo provisional, difuminada. Así la imagen nunca se queda en blanco a
  // mitad de una transición.
  const placeholder = posterUrl && current !== posterUrl && reveal.state === 'waiting' ? posterUrl : null

  return (
    <>
      {placeholder && <img className="backdrop-placeholder" src={placeholder} alt="" aria-hidden="true" />}
    <img
      ref={reveal.ref}
      src={current}
      alt=""
      decoding="async"
      data-reveal={reveal.state}
      onLoad={reveal.onLoad}
      onError={() => setIndex((value) => value + 1)}
    />
    </>
  )
}
