/**
 * Memoria en disco de los titulos ya traducidos.
 *
 * El endpoint publico de Wikidata es compartido y su latencia va de un segundo
 * a mas de un minuto sin previo aviso. Como los catalogos repiten peliculas
 * entre filas y entre sesiones, guardar lo ya resuelto evita casi todas las
 * consultas y hace que la interfaz cargue al momento.
 */
import { app } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'

export interface TitleEntry {
  title: string
  article: string | null
}

type Store = Record<string, TitleEntry>

let entries: Store = {}
let loaded = false
let dirty = false
let saveTimer: NodeJS.Timeout | null = null

function file(): string {
  return path.join(app.getPath('userData'), 'titles-cache.json')
}

function keyFor(imdbId: string, language: string): string {
  return `${language}|${imdbId}`
}

export async function load(): Promise<void> {
  if (loaded) return
  loaded = true
  try {
    entries = JSON.parse(await fs.readFile(file(), 'utf8')) as Store
  } catch {
    entries = {}
  }
}

export function get(imdbId: string, language: string): TitleEntry | undefined {
  return entries[keyFor(imdbId, language)]
}

export function put(imdbId: string, language: string, entry: TitleEntry): void {
  entries[keyFor(imdbId, language)] = entry
  dirty = true
  scheduleSave()
}

/**
 * Se guarda en diferido: una fila entera produce muchas altas seguidas y no
 * tiene sentido reescribir el fichero con cada una.
 */
function scheduleSave(): void {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    void flush()
  }, 2000)
}

export async function flush(): Promise<void> {
  if (!dirty) return
  dirty = false
  const target = file()
  try {
    await fs.writeFile(`${target}.tmp`, JSON.stringify(entries), 'utf8')
    await fs.rename(`${target}.tmp`, target)
  } catch {
    // Que no se pueda guardar la cache no es motivo para romper nada: la
    // proxima vez simplemente se vuelve a preguntar.
  }
}
