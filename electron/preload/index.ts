import { contextBridge, ipcRenderer } from 'electron'
import type {
  ImportSummary,
  Movie,
  MovieDetails,
  NewMovie,
  SearchResult,
  Settings,
  Source,
  UpdateState
} from '../../shared/types'

type Reply<T> = { ok: true; data: T } | { ok: false; error: string }

/** Desenvuelve la respuesta del main y lanza un Error normal si fallo. */
async function call<T>(channel: string, ...args: unknown[]): Promise<T> {
  const reply = (await ipcRenderer.invoke(channel, ...args)) as Reply<T>
  if (!reply.ok) throw new Error(reply.error)
  return reply.data
}

const api = {
  library: {
    list: () => call<Movie[]>('library:list'),
    add: (movie: NewMovie) => call<Movie>('library:add', movie),
    update: (id: string, patch: Partial<Movie>) => call<Movie | null>('library:update', id, patch),
    remove: (id: string) => call<boolean>('library:remove', id),
    export: () => call<string | null>('library:export'),
    import: () => call<ImportSummary | null>('library:import')
  },
  sources: {
    search: (query: string) => call<SearchResult[]>('sources:search', query),
    details: (source: Source, sourceId: string) => call<MovieDetails>('sources:details', source, sourceId),
    verifyTmdb: (apiKey: string, language: string) => call<boolean>('sources:verifyTmdb', apiKey, language)
  },
  settings: {
    get: () => call<Settings>('settings:get'),
    set: (patch: Partial<Settings>) => call<Settings>('settings:set', patch)
  },
  app: {
    info: () => call<{ version: string; dataDir: string }>('app:info'),
    openDataDir: () => call<void>('app:openDataDir'),
    openExternal: (url: string) => call<void>('app:openExternal', url)
  },
  updater: {
    state: () => call<UpdateState>('updater:state'),
    check: () => call<UpdateState>('updater:check'),
    download: () => call<void>('updater:download'),
    install: () => call<void>('updater:install'),
    onState: (listener: (state: UpdateState) => void): (() => void) => {
      const wrapped = (_event: unknown, state: UpdateState): void => listener(state)
      ipcRenderer.on('updater:state', wrapped)
      return () => {
        ipcRenderer.removeListener('updater:state', wrapped)
      }
    }
  }
}

export type FilmdexApi = typeof api

contextBridge.exposeInMainWorld('filmdex', api)
