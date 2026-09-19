/**
 * Avisos de plataforma: vigila las películas de "Mi lista" y avisa cuando una
 * llega a una plataforma de streaming en tu país.
 *
 * La primera vez que se mira una película solo se apunta dónde está, sin avisar:
 * si ya estaba en Netflix cuando la guardaste, eso no es una novedad. A partir
 * de ahí, cada plataforma nueva que aparezca genera un aviso.
 */
import { BrowserWindow, Notification, app } from 'electron'
import type { Movie, Settings, WatchOptions } from '../../shared/types'

/** Cada cuánto se vuelve a mirar mientras la app está abierta. */
const INTERVAL_MS = 6 * 60 * 60 * 1000
/** Margen tras arrancar, para no competir con la carga de la portada. */
const FIRST_CHECK_MS = 30 * 1000
/** Pausa entre películas: son peticiones seguidas a TMDB. */
const PAUSE_MS = 250
/** Más avisos que estos de golpe serían una lluvia: se resumen en uno. */
const MAX_SEPARATE_NOTICES = 3

export interface Change {
  movie: Movie
  added: string[]
}

export interface Deps {
  getSettings: () => Promise<Settings>
  listMovies: () => Promise<Movie[]>
  updateMovie: (id: string, patch: Partial<Movie>) => Promise<unknown>
  watchProviders: (settings: Settings, tmdbId: number) => Promise<WatchOptions | null>
  sleep?: (ms: number) => Promise<void>
}

/**
 * Plataformas nuevas respecto a la última vez. Sin comprobación anterior no hay
 * nada con qué comparar, así que no se avisa de nada: solo se toma nota.
 */
export function newProviders(previous: string[] | undefined, current: string[]): string[] {
  if (previous === undefined) return []
  return current.filter((name) => !previous.includes(name))
}

/** Revisa toda la lista y devuelve lo que ha cambiado. */
export async function checkWishlist(deps: Deps): Promise<{ checked: number; changes: Change[] }> {
  const settings = await deps.getSettings()
  if (!settings.watchAlerts || !settings.tmdbApiKey.trim()) return { checked: 0, changes: [] }

  const wait = deps.sleep ?? ((ms: number) => new Promise<void>((done) => setTimeout(done, ms)))
  const watching = (await deps.listMovies()).filter((movie) => movie.status === 'wishlist' && movie.tmdbId !== null)
  const changes: Change[] = []
  let checked = 0

  for (const movie of watching) {
    try {
      const options = await deps.watchProviders(settings, movie.tmdbId!)
      const stream = options?.stream.map((provider) => provider.name) ?? []
      const added = newProviders(movie.availability?.stream, stream)
      await deps.updateMovie(movie.id, { availability: { checkedAt: new Date().toISOString(), stream } })
      if (added.length > 0) changes.push({ movie, added })
      checked++
    } catch {
      // Sin red, o TMDB caído: se deja como estaba y se reintenta la próxima vez.
    }
    await wait(PAUSE_MS)
  }
  return { checked, changes }
}

const listJoin = (items: string[]): string =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}` : (items[0] ?? '')

function notify(window: BrowserWindow, changes: Change[]): void {
  if (!Notification.isSupported() || changes.length === 0) return

  const open = (movieId: string | null): void => {
    if (window.isDestroyed()) return
    if (window.isMinimized()) window.restore()
    window.show()
    window.focus()
    if (movieId) window.webContents.send('alerts:open', movieId)
  }

  if (changes.length > MAX_SEPARATE_NOTICES) {
    const notice = new Notification({
      title: `${changes.length} películas de tu lista ya se pueden ver`,
      body: changes.map((change) => change.movie.title).join(', ')
    })
    notice.on('click', () => open(null))
    notice.show()
    return
  }

  for (const change of changes) {
    const notice = new Notification({
      title: `${change.movie.title} ya está en ${listJoin(change.added)}`,
      body: 'Estaba en tu lista. Pulsa para ver la ficha.'
    })
    notice.on('click', () => open(change.movie.id))
    notice.show()
  }
}

let running = false

/** Una pasada completa: revisa, avisa y le cuenta a la interfaz qué ha cambiado. */
export async function runOnce(window: BrowserWindow, deps: Deps): Promise<{ checked: number; changes: number }> {
  if (running) return { checked: 0, changes: 0 }
  running = true
  try {
    const { checked, changes } = await checkWishlist(deps)
    if (!window.isDestroyed()) {
      window.webContents.send(
        'alerts:checked',
        changes.map((change) => ({ id: change.movie.id, title: change.movie.title, added: change.added }))
      )
    }
    notify(window, changes)
    return { checked, changes: changes.length }
  } finally {
    running = false
  }
}

export function startAlerts(window: BrowserWindow, deps: Deps): void {
  // Sin esto, Windows no muestra las notificaciones de una app en desarrollo.
  if (process.platform === 'win32') app.setAppUserModelId('com.xzorez.filmdex')

  const tick = (): void => void runOnce(window, deps).catch(() => undefined)
  const first = setTimeout(tick, FIRST_CHECK_MS)
  const every = setInterval(tick, INTERVAL_MS)
  window.on('closed', () => {
    clearTimeout(first)
    clearInterval(every)
  })
}
