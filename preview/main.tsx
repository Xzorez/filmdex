/**
 * Vista previa del interfaz en el navegador, sin Electron.
 *
 * Sustituye window.filmdex por un doble en memoria para poder trabajar el
 * diseno con `npm run preview:ui`. No entra en el empaquetado de la app.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '../src/App'
import '../src/styles.css'
import type { Movie, NewMovie, Settings, Source, UpdateState } from '../shared/types'

const sample: Movie[] = [
  {
    id: '1',
    tmdbId: 157336,
    imdbId: 'tt0816692',
    source: 'tmdb' as Source,
    title: 'Interstellar',
    originalTitle: 'Interstellar',
    year: 2014,
    overview:
      'Un grupo de exploradores emprende la mayor mision de la historia: viajar mas alla de nuestra galaxia para descubrir si la humanidad tiene futuro entre las estrellas.',
    posterUrl: 'https://image.tmdb.org/t/p/w342/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    runtime: 169,
    genres: ['Aventura', 'Drama', 'Ciencia ficcion'],
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
    voteAverage: 8.4,
    format: '4K UHD',
    status: 'owned',
    watched: true,
    rating: 9,
    notes: 'Edicion steelbook comprada en 2023.',
    tags: [],
    addedAt: '2026-02-11T10:00:00.000Z',
    watchedAt: '2026-03-02T21:30:00.000Z'
  },
  {
    id: '2',
    tmdbId: 238,
    imdbId: 'tt0068646',
    source: 'tmdb' as Source,
    title: 'El padrino',
    originalTitle: 'The Godfather',
    year: 1972,
    overview: 'Don Vito Corleone es el patriarca de una de las cinco familias que ejercen la mafia en Nueva York.',
    posterUrl: 'https://image.tmdb.org/t/p/w342/inHZOGA9Vw7B2UOOnlDUSUZTX2t.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
    runtime: 175,
    genres: ['Drama', 'Crimen'],
    director: 'Francis Ford Coppola',
    cast: ['Marlon Brando', 'Al Pacino', 'James Caan'],
    voteAverage: 8.7,
    format: 'Blu-ray',
    status: 'owned',
    watched: true,
    rating: 10,
    notes: '',
    tags: [],
    addedAt: '2026-01-20T10:00:00.000Z',
    watchedAt: '2026-01-25T20:00:00.000Z'
  },
  {
    id: '3',
    tmdbId: 27205,
    imdbId: 'tt1375666',
    source: 'tmdb' as Source,
    title: 'Origen',
    originalTitle: 'Inception',
    year: 2010,
    overview: 'Dom Cobb es un ladron con una extrana habilidad para entrar a los suenos de la gente y robarles sus secretos.',
    posterUrl: 'https://image.tmdb.org/t/p/w342/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    runtime: 148,
    genres: ['Accion', 'Ciencia ficcion'],
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt'],
    voteAverage: 8.4,
    format: 'DVD',
    status: 'owned',
    watched: false,
    rating: null,
    notes: '',
    tags: [],
    addedAt: '2026-03-14T10:00:00.000Z',
    watchedAt: null
  },
  {
    id: '4',
    tmdbId: 496243,
    imdbId: 'tt6751668',
    source: 'tmdb' as Source,
    title: 'Parasitos',
    originalTitle: '기생충',
    year: 2019,
    overview: 'Toda la familia de Ki-taek esta en el paro y se interesa por el tren de vida de la riquisima familia Park.',
    posterUrl: 'https://image.tmdb.org/t/p/w342/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg',
    runtime: 133,
    genres: ['Drama', 'Thriller'],
    director: 'Bong Joon-ho',
    cast: ['Song Kang-ho', 'Lee Sun-kyun'],
    voteAverage: 8.5,
    format: 'Blu-ray',
    status: 'owned',
    watched: true,
    rating: 8,
    notes: '',
    tags: [],
    addedAt: '2026-04-01T10:00:00.000Z',
    watchedAt: '2026-04-05T19:00:00.000Z'
  },
  {
    id: '5',
    tmdbId: 129,
    imdbId: 'tt0245429',
    source: 'tmdb' as Source,
    title: 'El viaje de Chihiro',
    originalTitle: '千と千尋の神隠し',
    year: 2001,
    overview: 'Chihiro es una nina de diez anos que viaja en coche con sus padres hacia su nueva casa.',
    posterUrl: 'https://image.tmdb.org/t/p/w342/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg',
    runtime: 125,
    genres: ['Animacion', 'Fantasia'],
    director: 'Hayao Miyazaki',
    cast: ['Rumi Hiiragi', 'Miyu Irino'],
    voteAverage: 8.5,
    format: 'Blu-ray',
    status: 'owned',
    watched: false,
    rating: null,
    notes: '',
    tags: [],
    addedAt: '2026-05-02T10:00:00.000Z',
    watchedAt: null
  },
  {
    id: '6',
    tmdbId: 680,
    imdbId: 'tt0110912',
    source: 'tmdb' as Source,
    title: 'Pulp Fiction',
    originalTitle: 'Pulp Fiction',
    year: 1994,
    overview: 'Jules y Vincent son dos matones a sueldo que trabajan para el gangster Marsellus Wallace.',
    posterUrl: 'https://image.tmdb.org/t/p/w342/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
    runtime: 154,
    genres: ['Thriller', 'Crimen'],
    director: 'Quentin Tarantino',
    cast: ['John Travolta', 'Samuel L. Jackson', 'Uma Thurman'],
    voteAverage: 8.5,
    format: 'DVD',
    status: 'wishlist',
    watched: false,
    rating: null,
    notes: '',
    tags: [],
    addedAt: '2026-05-20T10:00:00.000Z',
    watchedAt: null
  }
]

let movies = [...sample]
let settings: Settings = { source: 'libre', tmdbApiKey: '', language: 'es-ES', region: 'ES', autoUpdate: true }

const wait = <T,>(value: T): Promise<T> => new Promise((done) => setTimeout(() => done(value), 120))

window.filmdex = {
  library: {
    list: () => wait(movies),
    add: (movie: NewMovie) => {
      const saved: Movie = { ...movie, id: String(Date.now()), addedAt: new Date().toISOString() }
      movies = [saved, ...movies]
      return wait(saved)
    },
    update: (id, patch) => {
      movies = movies.map((m) => (m.id === id ? { ...m, ...patch } : m))
      return wait(movies.find((m) => m.id === id) ?? null)
    },
    remove: (id) => {
      movies = movies.filter((m) => m.id !== id)
      return wait(true)
    },
    export: () => wait('C:\\demo\\filmdex.json'),
    import: () => wait({ added: 0, skipped: 0 })
  },
  sources: {
    search: (query: string) =>
      wait(
        sample
          .filter((m) => m.title.toLowerCase().includes(query.toLowerCase()))
          .map((m) => ({
            source: m.source,
            sourceId: m.imdbId ?? '',
            imdbId: m.imdbId,
            tmdbId: m.tmdbId,
            title: m.title,
            originalTitle: m.originalTitle,
            year: m.year,
            overview: m.overview,
            posterUrl: m.posterUrl,
            voteAverage: m.voteAverage
          }))
      ),
    details: (_source: Source, sourceId: string) => {
      const found = sample.find((m) => m.imdbId === sourceId) ?? sample[0]
      return wait({
        source: found.source,
        sourceId: found.imdbId ?? '',
        imdbId: found.imdbId,
        tmdbId: found.tmdbId,
        title: found.title,
        originalTitle: found.originalTitle,
        year: found.year,
        overview: found.overview,
        posterUrl: found.posterUrl,
        voteAverage: found.voteAverage,
        backdropUrl: found.backdropUrl,
        runtime: found.runtime,
        genres: found.genres,
        director: found.director,
        cast: found.cast
      })
    },
    verifyTmdb: () => wait(true)
  },
  settings: {
    get: () => wait(settings),
    set: (patch) => {
      settings = { ...settings, ...patch }
      return wait(settings)
    }
  },
  app: {
    info: () => wait({ version: '0.1.0', dataDir: 'C:\\Users\\demo\\AppData\\Roaming\\filmdex' }),
    openDataDir: () => wait(undefined),
    openExternal: () => wait(undefined)
  },
  updater: {
    state: () => wait({ status: 'none' } as UpdateState),
    check: () => wait({ status: 'none' } as UpdateState),
    download: () => wait(undefined),
    install: () => wait(undefined),
    onState: () => () => undefined
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
