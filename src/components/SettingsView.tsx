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
  /** Ajustes nuevos que devuelve el proceso principal tras una copia. */
  onSettings: (settings: Settings) => void
  /** La colección ha cambiado por fuera (al restaurar): hay que recargarla. */
  onLibraryChanged: () => void
}

const SOURCES: { id: Source; title: string; detail: string }[] = [
  {
    id: 'libre',
    title: 'Sin cuenta',
    detail:
      'Funciona nada más instalar. Carátulas y fichas del catálogo de IMDb, con el título y la sinopsis traducidos desde Wikipedia.'
  },
  {
    id: 'tmdb',
    title: 'TMDB',
    detail:
      'Mejor calidad: títulos de estreno, sinopsis comerciales y fichas más completas. Necesita una clave gratuita que se pide en dos minutos.'
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
  onNotify,
  onSettings,
  onLibraryChanged
}: Props): JSX.Element {
  const [apiKey, setApiKey] = useState(settings.tmdbApiKey)
  const [checking, setChecking] = useState(false)
  const [verdict, setVerdict] = useState<'ok' | 'bad' | null>(null)
  const [checkingAlerts, setCheckingAlerts] = useState(false)
  const [backupBusy, setBackupBusy] = useState(false)

  /** Cualquier acción de la copia devuelve los ajustes al día, o null si se canceló. */
  const runBackup = async (action: () => Promise<Settings | null>): Promise<void> => {
    setBackupBusy(true)
    try {
      const next = await action()
      if (!next) return
      onSettings(next)
      if (next.backupDir && !next.backupError && next.lastBackupAt) onNotify('Copia guardada')
    } catch (error) {
      onNotify((error as Error).message, 'bad')
    } finally {
      setBackupBusy(false)
    }
  }

  const restoreBackup = async (): Promise<void> => {
    setBackupBusy(true)
    try {
      const { added, skipped } = await window.filmdex.backup.restore()
      onLibraryChanged()
      onNotify(added === 0 ? 'La copia no tenía nada que no tuvieras ya' : `${added} restauradas, ${skipped} ya estaban`)
    } catch (error) {
      onNotify((error as Error).message, 'bad')
    } finally {
      setBackupBusy(false)
    }
  }

  const backupDate = (iso: string): string =>
    new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

  const checkAlerts = async (): Promise<void> => {
    setCheckingAlerts(true)
    try {
      const { checked, changes } = await window.filmdex.alerts.check()
      const found = changes === 0 ? 'sin novedades' : changes === 1 ? '1 novedad' : `${changes} novedades`
      onNotify(`Revisadas ${checked} películas de tu lista: ${found}`)
    } catch (error) {
      onNotify((error as Error).message, 'bad')
    } finally {
      setCheckingAlerts(false)
    }
  }

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
        onNotify('Clave guardada. Las fichas vendrán ya de TMDB.')
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
      onNotify('Primero añade una clave de TMDB aquí debajo.', 'bad')
      return
    }
    await onSave({ source })
  }

  const updateLine = ((): string => {
    switch (update.status) {
      case 'checking':
        return 'Buscando actualizaciones...'
      case 'available':
        return `Hay una versión nueva: ${update.version}`
      case 'downloading':
        return `Descargando... ${update.percent ?? 0}%`
      case 'ready':
        return `La versión ${update.version} está lista para instalarse`
      case 'none':
        return update.message === 'Modo desarrollo'
          ? 'En modo desarrollo no se comprueban actualizaciones'
          : 'Tienes la última versión'
      case 'error':
        return `No se pudo comprobar: ${update.message ?? 'error desconocido'}`
      default:
        return 'Sin comprobar todavía'
    }
  })()

  return (
    <>
      <div className="panel">
        <h3>De dónde salen las fichas</h3>
        <p className="hint">
          Las películas que ya tienes guardadas no cambian al cambiar de fuente: esto solo afecta a las que añadas a
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
          Solo hace falta si eliges TMDB. Crea una cuenta gratuita, entra en Ajustes - API y copia aquí la clave (vale
          la v3 o el token de lectura v4). Se guarda solo en tu equipo.{' '}
          <a onClick={() => void window.filmdex.app.openExternal('https://www.themoviedb.org/settings/api')}>
            Abrir TMDB
          </a>
        </p>
        <div className="inline-form">
          <input
            className="input"
            type="password"
            placeholder="Pega aquí tu clave"
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
        {verdict === 'bad' && <div className="status-line bad">La clave no es válida. Revísala en TMDB.</div>}
      </div>

      <div className="panel">
        <h3>Tu colección</h3>
        <p className="hint">Todo se guarda solo en este ordenador. Exporta de vez en cuando para tener copia.</p>
        <div className="stat-grid" style={{ marginBottom: 18 }}>
          <div className="stat">
            <div className="n">{owned.length}</div>
            <div className="l">películas</div>
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
        <h3>Copia de seguridad</h3>
        <p className="hint">
          Tu colección solo está en este ordenador. Elige una carpeta, mejor de OneDrive o Dropbox, y Filmdex guardará
          en ella una copia cada día, con las siete últimas por fecha. La clave de TMDB no se copia. En otro ordenador,
          elige la misma carpeta y pulsa «Restaurar» para traerte la colección.
        </p>

        {settings.backupDir ? (
          <>
            <div className="mono" style={{ marginBottom: 10 }}>
              {settings.backupDir}
            </div>
            <div className="status-line" style={{ marginTop: 0 }}>
              {settings.lastBackupAt ? `Última copia: ${backupDate(settings.lastBackupAt)}` : 'Aún no se ha hecho ninguna copia'}
            </div>
            {settings.backupError && <div className="status-line bad">{settings.backupError}</div>}
            <div className="chip-row" style={{ marginTop: 14 }}>
              <button className="btn" disabled={backupBusy} onClick={() => void runBackup(() => window.filmdex.backup.run())}>
                {backupBusy ? <span className="spinner" /> : <IconDownload />}
                Copiar ahora
              </button>
              <button className="btn" disabled={backupBusy} onClick={() => void restoreBackup()}>
                <IconUpload />
                Restaurar desde la copia
              </button>
              <button className="btn btn-ghost" disabled={backupBusy} onClick={() => void runBackup(() => window.filmdex.backup.choose())}>
                <IconFolder />
                Cambiar carpeta
              </button>
              <button className="btn btn-ghost" disabled={backupBusy} onClick={() => void runBackup(() => window.filmdex.backup.stop())}>
                Dejar de copiar
              </button>
            </div>
          </>
        ) : (
          <button className="btn" disabled={backupBusy} onClick={() => void runBackup(() => window.filmdex.backup.choose())}>
            {backupBusy ? <span className="spinner" /> : <IconFolder />}
            Elegir carpeta
          </button>
        )}
      </div>

      <div className="panel">
        <h3>Avisos de plataforma</h3>
        <p className="hint">
          Mientras Filmdex esté abierto, revisa cada seis horas las películas de tu lista y te avisa cuando alguna
          llega a una plataforma en tu país. La primera revisión solo toma nota de dónde está cada una, sin avisar.
        </p>
        {!settings.tmdbApiKey.trim() && (
          <p className="hint">Necesita la clave de TMDB de más arriba: sin ella no hay a quién preguntar.</p>
        )}
        <div className="switch-row">
          <div className="switch-text">
            <strong>Avisarme cuando algo de mi lista se pueda ver</strong>
            <span>Con una notificación de Windows que abre la ficha</span>
          </div>
          <button
            className={`switch${settings.watchAlerts ? ' on' : ''}`}
            onClick={() => void onSave({ watchAlerts: !settings.watchAlerts })}
            aria-label="Alternar avisos de plataforma"
          />
        </div>
        <div className="chip-row" style={{ marginTop: 14 }}>
          <button
            className="btn"
            disabled={checkingAlerts || !settings.watchAlerts || !settings.tmdbApiKey.trim()}
            onClick={() => void checkAlerts()}
          >
            {checkingAlerts ? <span className="spinner" /> : <IconRefresh />}
            Comprobar ahora
          </button>
        </div>
      </div>

      <div className="panel">
        <h3>Actualizaciones</h3>
        <p className="hint">
          Filmdex se actualiza solo desde las publicaciones de GitHub. Cuando se publica una versión nueva, la app la
          descarga y la instala al reiniciar.
        </p>

        <div className="switch-row">
          <div className="switch-text">
            <strong>Buscar actualizaciones al arrancar</strong>
            <span>Comprueba GitHub unos segundos después de abrir la app</span>
          </div>
          <button
            className={`switch${settings.autoUpdate ? ' on' : ''}`}
            onClick={() => void onSave({ autoUpdate: !settings.autoUpdate })}
            aria-label="Alternar búsqueda automática"
          />
        </div>

        <div className="status-line neutral" style={{ marginTop: 14 }}>
          Versión instalada: {version} · {updateLine}
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
              Descargar versión {update.version}
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
        <p className="hint">Idioma en el que se buscan los títulos y las sinopsis.</p>
        <select
          className="select"
          style={{ maxWidth: 240 }}
          value={settings.language}
          onChange={(event) => void onSave({ language: event.target.value })}
        >
          <option value="es-ES">Español</option>
          <option value="en-US">English</option>
          <option value="fr-FR">Français</option>
          <option value="pt-BR">Português</option>
          <option value="it-IT">Italiano</option>
        </select>
      </div>
    </>
  )
}
