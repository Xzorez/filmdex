import { flushSync } from 'react-dom'

/**
 * Transiciones entre estados de la interfaz con View Transitions, la API nativa
 * de Chromium: el navegador fotografía el antes y el después y anima entre los
 * dos, así que no hace falta ninguna librería.
 *
 * - `open`: la tarjeta pulsada se expande hasta ser la ficha.
 * - `close`: la ficha vuelve a encogerse en la tarjeta de la que salió.
 * - `view`: cambio de sección; la barra superior se queda quieta.
 */
export type TransitionKind = 'open' | 'close' | 'view'

type Starter = (options: { update: () => void; types: string[] }) => { finished: Promise<void> }

const NAME = 'movie'

/** Lo último que se pulsó para abrir una película: de ahí sale y ahí vuelve. */
let origin: HTMLElement | null = null

export function rememberOrigin(element: HTMLElement | null): void {
  origin = element
}

function starter(): Starter | null {
  const start = (document as Document & { startViewTransition?: Starter }).startViewTransition
  if (typeof start !== 'function') return null
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  return start.bind(document)
}

/** Si se puede animar, `data-vt` en la raíz apaga las entradas CSS que duplicarían la transición. */
export function markTransitionSupport(): void {
  if (starter()) document.documentElement.dataset.vt = ''
}

/**
 * Un origen vale si sigue en pantalla y no está dentro de la propia ficha: al
 * abrir otra película desde el pie de una ficha, es la ficha la que se
 * transforma, no una tarjeta suya.
 */
function usableOrigin(): HTMLElement | null {
  return origin && origin.isConnected && !origin.closest('.sheet') ? origin : null
}

export function transition(kind: TransitionKind, update: () => void): void {
  const start = starter()
  if (!start) {
    update()
    return
  }

  const from = kind === 'open' ? usableOrigin() : null
  if (from) from.style.viewTransitionName = NAME

  let to: HTMLElement | null = null
  const running = start({
    types: [kind],
    update: () => {
      if (from) from.style.viewTransitionName = ''
      flushSync(update)
      // Al cerrar, la ficha vuelve a su tarjeta si esta sigue existiendo.
      if (kind === 'close') {
        to = usableOrigin()
        if (to) to.style.viewTransitionName = NAME
      }
    }
  })

  void running.finished.finally(() => {
    if (to) to.style.viewTransitionName = ''
  })
}
