import { useCallback, useLayoutEffect, useRef, useState } from 'react'

export type RevealState = 'waiting' | 'done'

/**
 * Enfoque de cámara para una imagen: espera desenfocada y se enfoca al cargar.
 *
 * Si ya estaba en caché, se marca como lista antes del primer pintado, así que
 * aparece directamente sin repetir la animación cada vez que se vuelve a verla.
 */
export function useReveal(src: string | null): {
  ref: (element: HTMLImageElement | null) => void
  state: RevealState
  onLoad: () => void
} {
  const [state, setState] = useState<RevealState>('waiting')
  const node = useRef<HTMLImageElement | null>(null)

  useLayoutEffect(() => {
    const element = node.current
    setState(element && element.complete && element.naturalWidth > 0 ? 'done' : 'waiting')
  }, [src])

  const ref = useCallback((element: HTMLImageElement | null) => {
    node.current = element
  }, [])

  return { ref, state, onLoad: () => setState('done') }
}
