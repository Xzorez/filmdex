/**
 * Vista previa del interfaz en el navegador, sin Electron.
 *
 * Sustituye window.filmdex por un doble en memoria para poder trabajar el
 * diseno con `npm run preview:ui`. No entra en el empaquetado de la app.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '../src/App'
import { canonicalGenre } from '../src/lib/taste'
import '../src/styles.css'
import type {
  DiscoverQuery,
  Movie,
  MovieDetails,
  NewMovie,
  Settings,
  Source,
  UpdateState
} from '../shared/types'

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
    backdropUrl: null,
    runtime: 169,
    genres: ['Aventura', 'Drama', 'Ciencia ficcion'],
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
    voteAverage: 8.4,
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
    backdropUrl: null,
    runtime: 175,
    genres: ['Drama', 'Crimen'],
    director: 'Francis Ford Coppola',
    cast: ['Marlon Brando', 'Al Pacino', 'James Caan'],
    voteAverage: 8.7,
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
    backdropUrl: null,
    runtime: 148,
    genres: ['Accion', 'Ciencia ficcion'],
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt'],
    voteAverage: 8.4,
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
    backdropUrl: null,
    runtime: 133,
    genres: ['Drama', 'Thriller'],
    director: 'Bong Joon-ho',
    cast: ['Song Kang-ho', 'Lee Sun-kyun'],
    voteAverage: 8.5,
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
    backdropUrl: null,
    runtime: 125,
    genres: ['Animacion', 'Fantasia'],
    director: 'Hayao Miyazaki',
    cast: ['Rumi Hiiragi', 'Miyu Irino'],
    voteAverage: 8.5,
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
    backdropUrl: null,
    runtime: 154,
    genres: ['Thriller', 'Crimen'],
    director: 'Quentin Tarantino',
    cast: ['John Travolta', 'Samuel L. Jackson', 'Uma Thurman'],
    voteAverage: 8.5,
    status: 'wishlist',
    watched: false,
    rating: null,
    notes: '',
    tags: [],
    addedAt: '2026-05-20T10:00:00.000Z',
    watchedAt: null
  }
]


/** Catalogo de mentira para ver las filas de descubrir sin salir a la red. */
const catalog: MovieDetails[] = [
  {
    source: 'tmdb',
    sourceId: 'tt15398776',
    imdbId: 'tt15398776',
    tmdbId: 872585,
    title: 'Oppenheimer',
    originalTitle: 'Oppenheimer',
    year: 2023,
    overview:
      'La historia del fisico J. Robert Oppenheimer y su papel en el desarrollo de la bomba atomica.',
    posterUrl: 'https://image.tmdb.org/t/p/w342/ptpr0kGAckfQkJeJIt8st5dglvd.jpg',
    backdropUrl: null,
    voteAverage: 8.1,
    runtime: 181,
    genres: ['Drama', 'Historia'],
    director: 'Christopher Nolan',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Robert Downey Jr.'],
    trailerKey: 'om5Un9X720M'
  },
  {
    source: 'tmdb',
    sourceId: 'tt1517268',
    imdbId: 'tt1517268',
    tmdbId: 346698,
    title: 'Barbie',
    originalTitle: 'Barbie',
    year: 2023,
    overview:
      'Barbie vive en Barbieland siendo una muneca perfecta, hasta que empieza a hacerse preguntas.',
    posterUrl: 'https://image.tmdb.org/t/p/w342/yRRuLt7sMBEQkHsd1S3KaaofZn7.jpg',
    backdropUrl: null,
    voteAverage: 7.1,
    runtime: 114,
    genres: ['Comedia', 'Aventura'],
    director: 'Greta Gerwig',
    cast: ['Margot Robbie', 'Ryan Gosling'],
    trailerKey: 'om5Un9X720M'
  },
  {
    source: 'tmdb',
    sourceId: 'tt6710474',
    imdbId: 'tt6710474',
    tmdbId: 545611,
    title: 'Todo a la vez en todas partes',
    originalTitle: 'Everything Everywhere All at Once',
    year: 2022,
    overview:
      'Una mujer descubre que debe conectar con versiones de si misma de otros universos para salvar el mundo.',
    posterUrl: 'https://image.tmdb.org/t/p/w342/u68AjlvlutfEIcpmbYpKcdi09ut.jpg',
    backdropUrl: null,
    voteAverage: 7.8,
    runtime: 139,
    genres: ['Ciencia ficcion', 'Aventura'],
    director: 'Daniel Kwan',
    cast: ['Michelle Yeoh', 'Ke Huy Quan'],
    trailerKey: 'om5Un9X720M'
  },
  {
    source: 'tmdb',
    sourceId: 'tt1160419',
    imdbId: 'tt1160419',
    tmdbId: 438631,
    title: 'Dune',
    originalTitle: 'Dune',
    year: 2021,
    overview:
      'Paul Atreides viaja al planeta mas peligroso del universo para asegurar el futuro de su familia.',
    posterUrl: 'https://image.tmdb.org/t/p/w342/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',
    backdropUrl: null,
    voteAverage: 7.8,
    runtime: 155,
    genres: ['Ciencia ficcion', 'Aventura'],
    director: 'Denis Villeneuve',
    cast: ['Timothee Chalamet', 'Rebecca Ferguson'],
    trailerKey: 'om5Un9X720M'
  },
  {
    source: 'tmdb',
    sourceId: 'tt8579674',
    imdbId: 'tt8579674',
    tmdbId: 530915,
    title: '1917',
    originalTitle: '1917',
    year: 2019,
    overview:
      'Dos soldados britanicos cruzan el frente para entregar un mensaje que salvara mil vidas.',
    posterUrl: 'https://image.tmdb.org/t/p/w342/iZf0KyrE25z1sage4SYFLCCrMi9.jpg',
    backdropUrl: null,
    voteAverage: 7.9,
    runtime: 119,
    genres: ['Belica', 'Drama'],
    director: 'Sam Mendes',
    cast: ['George MacKay', 'Dean-Charles Chapman'],
    trailerKey: 'om5Un9X720M'
  },
  {
    source: 'tmdb',
    sourceId: 'tt7286456',
    imdbId: 'tt7286456',
    tmdbId: 475557,
    title: 'Joker',
    originalTitle: 'Joker',
    year: 2019,
    overview:
      'Arthur Fleck, un comico fracasado, encuentra en la violencia el camino hacia una nueva identidad.',
    posterUrl: 'https://image.tmdb.org/t/p/w342/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
    backdropUrl: null,
    voteAverage: 8.1,
    runtime: 122,
    genres: ['Crimen', 'Drama'],
    director: 'Todd Phillips',
    cast: ['Joaquin Phoenix', 'Robert De Niro'],
    trailerKey: 'om5Un9X720M'
  },
  {
    source: 'tmdb',
    sourceId: 'tt5052448',
    imdbId: 'tt5052448',
    tmdbId: 419430,
    title: 'Dejame salir',
    originalTitle: 'Get Out',
    year: 2017,
    overview:
      'Un joven visita a la familia de su novia y descubre que algo inquietante ocurre en esa casa.',
    posterUrl: 'https://image.tmdb.org/t/p/w342/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg',
    backdropUrl: null,
    voteAverage: 7.6,
    runtime: 104,
    genres: ['Terror', 'Misterio'],
    director: 'Jordan Peele',
    cast: ['Daniel Kaluuya', 'Allison Williams'],
    trailerKey: 'om5Un9X720M'
  },
  {
    source: 'tmdb',
    sourceId: 'tt2582802',
    imdbId: 'tt2582802',
    tmdbId: 244786,
    title: 'Whiplash',
    originalTitle: 'Whiplash',
    year: 2014,
    overview:
      'Un joven baterista se somete a la ensenanza brutal de un profesor que no acepta menos que la perfeccion.',
    posterUrl: 'https://image.tmdb.org/t/p/w342/oPxnRhyAIzJKGUEdSiwTJQBa3NM.jpg',
    backdropUrl: null,
    voteAverage: 8.4,
    runtime: 107,
    genres: ['Drama', 'Musica'],
    director: 'Damien Chazelle',
    cast: ['Miles Teller', 'J.K. Simmons'],
    trailerKey: 'om5Un9X720M'
  },
  {
    source: 'tmdb',
    sourceId: 'tt0114369',
    imdbId: 'tt0114369',
    tmdbId: 807,
    title: 'Seven',
    originalTitle: 'Se7en',
    year: 1995,
    overview:
      'Dos detectives persiguen a un asesino que usa los siete pecados capitales como firma.',
    posterUrl: 'https://image.tmdb.org/t/p/w342/6yoghtyTpznpBik8EngEmJskVUO.jpg',
    backdropUrl: null,
    voteAverage: 8.4,
    runtime: 127,
    genres: ['Crimen', 'Thriller'],
    director: 'David Fincher',
    cast: ['Brad Pitt', 'Morgan Freeman'],
    trailerKey: 'om5Un9X720M'
  },
  {
    source: 'tmdb',
    sourceId: 'tt0110413',
    imdbId: 'tt0110413',
    tmdbId: 101,
    title: 'Leon: el profesional',
    originalTitle: 'Leon',
    year: 1994,
    overview:
      'Un sicario solitario acoge a una nina de doce anos despues de que asesinen a su familia.',
    posterUrl: 'https://image.tmdb.org/t/p/w342/yI6X2cCM5YPJtxMhUd3dPGqDAhw.jpg',
    backdropUrl: null,
    voteAverage: 8.3,
    runtime: 110,
    genres: ['Crimen', 'Drama'],
    director: 'Luc Besson',
    cast: ['Jean Reno', 'Natalie Portman'],
    trailerKey: 'om5Un9X720M'
  }
]

let movies = [...sample]
let settings: Settings = { source: 'libre', tmdbApiKey: 'demo', language: 'es-ES', region: 'ES', autoUpdate: true }

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
        cast: found.cast,
        trailerKey: 'om5Un9X720M'
      })
    },
    discover: (query: DiscoverQuery) => {
      // Se filtra con el mismo criterio que la app: los generos guardados estan
      // traducidos y hay que devolverlos a su nombre comun.
      const pool = query.genre
        ? catalog.filter((movie) => movie.genres.some((name) => canonicalGenre(name) === query.genre))
        : catalog
      const list =
        query.catalog === 'rated'
          ? [...pool].sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0))
          : pool
      return wait(list)
    },
    watchProviders: () =>
      wait({
        link: 'https://www.themoviedb.org',
        stream: [
          { name: 'Netflix', logoUrl: null },
          { name: 'Prime Video', logoUrl: null }
        ],
        rent: [{ name: 'Apple TV', logoUrl: null }],
        buy: [{ name: 'Google Play', logoUrl: null }]
      }),
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
    openExternal: () => wait(undefined),
    onEscape: () => () => undefined
  },
  window: {
    minimize: () => wait(undefined),
    toggleMaximize: () => wait(false),
    close: () => wait(undefined),
    isMaximized: () => wait(false),
    onMaximized: () => () => undefined
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
