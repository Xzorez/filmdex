import { useState, type JSX } from 'react'
import type { Movie, Settings, Source, UpdateState } from '../../shared/types'
import { IconCheck, IconDownload, IconFolder, IconRefresh, IconUpload } from './icons'

interface Props {
  settings: Settings
  onSave: (patch: Partial<Settings>) => Promise<void>
  movies: Movie[]
  version: string
  dataDir: string
  update: UpdateState
  onImport: () => void
  onExport: () => void
  onNotify: (message: string, kind?: 'ok' | 'bad') => void
}

const SOURCES: { id: Source; title: string; detail: string }[] = [
  {
    id: 'libre',
    title: 'Sin cuenta',
    detail:
      'Funciona nada mas instalar. Caratulas y fichas del catalogo de IMDb, con el titulo y la sinopsis traducidos desde Wikipedia. Los generos salen en ingles.'
  },
  {
    id: 'tmdb',
    title: 'TMDB',
    detail:
      'Mejor calidad: titulos de estreno, sinopsis comerciales y fichas mas completas. Necesita una clave gratuita que se pide en dos minutos.'
  }
]

export function SettingsView({
  settings,
  onSave,
  movies,
  version,
  dataDir,
  update,
  onImport,
  onExport,
  onNotify
}: Props): JSX.Element {
  const [apiKey, setApiKey] = useState(settings.tmdbApiKey)
  const [checking, setChecking] = useState(false)
  const [verdict, setVerdict] = useState<'ok' | 'bad' | null>(null)

  const owned = movies.filter((movie) => movie.status === 'owned')
  const watched = movies.filter((movie) => movie.watched)
  const rated = movies.filter((movie) => movie.rating !== null)
  const average = rated.length
    ? (rated.reduce((sum, movie) => sum + (movie.rating ?? 0), 0) / rated.length).toFixed(1)
    : '-'

  const saveKey = async (): Promise<void> => {
    setChecking(true)
    setVerdict(null)
    try {
      const valid = await window.filmdex.sources.verifyTmdb(apiKey, settings.language)
      setVerdict(valid ? 'ok' : 'bad')
      if (valid) {
        await onSave({ tmdbApiKey: apiKey, source: 'tmdb' })
        onNotify('Clave guardada. Las fichas vendran ya de TMDB.')
      }
    } catch (error) {
      setVerdict('bad')
      onNotify((error as Error).message, 'bad')
    } finally {
      setChecking(false)
    }
  }

  const pickSource = async (source: Source): Promise<void> => {
    if (source === 'tmdb' && !settings.tmdbApiKey.trim()) {
      onNotify('Primero anade una clave de TMDB aqui debajo.', 'bad')
      return
    }
    await onSave({ source })
  }

  const updateLine = ((): string => {
    switch (update.status) {
      case 'checking':
        return 'Buscando actualizaciones...'
      case 'available':
        return `Hay una version nueva: ${update.version}`
      case 'downloading':
        return `Descargando... ${update.percent ?? 0}%`
      case 'ready':
        return `La version ${update.version} esta lista para instalarse`
      case 'none':
        return update.message === 'Modo desarrollo'
          ? 'En modo desarrollo no se comprueban actualizaciones'
          : 'Tienes la ultima version'
      case 'error':
        return `No se pudo comprobar: ${update.message ?? 'error desconocido'}`
      default:
        return 'Sin comprobar todavia'
    }
  })()

  return (
    <>
      <div className="panel">
        <h3>De donde salen las fichas</h3>
        <p className="hint">
          Las peliculas que ya tienes guardadas no cambian al cambiar de fuente: esto solo afecta a las que anadas a
          partir de ahora.
        </p>

        <div className="source-grid">
          {SOURCES.map((option) => (
            <button
              key={option.id}
              className={`source-card${settings.source === option.id ? ' active' : ''}`}
              onClick={() => void pickSource(option.id)}
            >
              <div className="source-head">
                <span className="source-title">{option.title}</span>
                {settings.source === option.id && (
                  <span className="source-mark">
                    <IconCheck />
                  </span>
                )}
              </div>
              <span className="source-detail">{option.detail}</span>
            </button>
          ))}
        </div>

        <div className="section-divider" />

        <h3 style={{ fontSize: 13.5 }}>Clave de TMDB</h3>
        <p className="hint">
          Solo hace falta si eliges TMDB. Crea una cuenta gratuita, entra en Ajustes - API y copia aqui la clave (vale
          la v3 o el token de lectura v4). Se guarda solo en tu equipo.{' '}
          <a onClick={() => void window.filmdex.app.openExternal('https://www.themoviedb.org/settings/api')}>
            Abrir TMDB
          </a>
        </p>
        <div className="inline-form">
          <input
            className="input"
            type="password"
            placeholder="Pega aqui tu clave"
            value={apiKey}
            onChange={(event) => {
              setApiKey(event.target.value)
              setVerdict(null)
            }}
          />
          <button className="btn" disabled={checking || !apiKey.trim()} onClick={() => void saveKey()}>
            {checking ? <span className="spinner" /> : <IconCheck />}
            Comprobar y guardar
          </button>
        </div>
        {verdict === 'ok' && (
          <div className="status-line ok">
            <IconCheck className="nav-icon" />
            La clave funciona.
          </div>
        )}
        {verdict === 'bad' && <div className="status-line bad">La clave no es valida. Revisala en TMDB.</div>}
      </div>

      <div className="panel">
        <h3>Tu coleccion</h3>
        <p className="hint">Todo se guarda solo en este ordenador. Exporta de vez en cuando para tener copia.</p>
        <div className="stat-grid" style={{ marginBottom: 18 }}>
          <div className="stat">
            <div className="n">{owned.length}</div>
            <div className="l">peliculas</div>
          </div>
          <div className="stat">
            <div className="n">{watched.length}</div>
            <div className="l">vistas</div>
          </div>
          <div className="stat">
            <div className="n">{average}</div>
            <div className="l">nota media</div>
          </div>
        </div>
        <div className="chip-row">
          <button className="btn" onClick={onExport}>
            <IconDownload />
            Exportar a JSON
          </button>
          <button className="btn" onClick={onImport}>
            <IconUpload />
            Importar JSON
          </button>
          <button className="btn btn-ghost" onClick={() => void window.filmdex.app.openDataDir()}>
            <IconFolder />
            Abrir carpeta de datos
          </button>
        </div>
        <div className="mono" style={{ marginTop: 12 }}>
          {dataDir}
        </div>
      </div>

      <div className="panel">
        <h3>Actualizaciones</h3>
        <p className="hint">
          Filmdex se actualiza solo desde las publicaciones de GitHub. Cuando se publica una version nueva, la app la
          descarga y la instala al reiniciar.
        </p>

        <div className="switch-row">
          <div className="switch-text">
            <strong>Buscar actualizaciones al arrancar</strong>
            <span>Comprueba GitHub unos segundos despues de abrir la app</span>
          </div>
          <button
            className={`switch${settings.autoUpdate ? ' on' : ''}`}
            onClick={() => void onSave({ autoUpdate: !settings.autoUpdate })}
            aria-label="Alternar busqueda automatica"
          />
        </div>

        <div className="status-line neutral" style={{ marginTop: 14 }}>
          Version instalada: {version} · {updateLine}
        </div>

        <div className="chip-row" style={{ marginTop: 14 }}>
          <button
            className="btn"
            disabled={update.status === 'checking' || update.status === 'downloading'}
            onClick={() => void window.filmdex.updater.check()}
          >
            <IconRefresh />
            Buscar ahora
          </button>
          {update.status === 'available' && (
            <button className="btn btn-primary" onClick={() => void window.filmdex.updater.download()}>
              <IconDownload />
              Descargar version {update.version}
            </button>
          )}
          {update.status === 'ready' && (
            <button className="btn btn-primary" onClick={() => void window.filmdex.updater.install()}>
              Reiniciar e instalar
            </button>
          )}
        </div>
      </div>

      <div className="panel">
        <h3>Idioma de las fichas</h3>
        <p className="hint">Idioma en el que se buscan los titulos y las sinopsis.</p>
        <select
          className="select"
          style={{ maxWidth: 240 }}
          value={settings.language}
          onChange={(event) => void onSave({ language: event.target.value })}
        >
          <option value="es-ES">Espanol</option>
          <option value="en-US">English</option>
          <option value="fr-FR">Francais</option>
          <option value="pt-BR">Portugues</option>
          <option value="it-IT">Italiano</option>
        </select>
      </div>
    </>
  )
}
