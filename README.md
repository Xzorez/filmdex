# Filmdex

Catálogo personal de películas para escritorio. Descubres qué ver, guardas lo que te interesa y Filmdex te monta la estantería con carátulas, fichas y tus notas.

Todo se guarda **solo en tu ordenador**. No hay cuentas, ni servidores, ni nada que subir a ninguna parte.

## Qué hace

- **Descubre qué ver**: una portada que rota sola entre cinco destacadas (se para al pasar el ratón) y filas por categoría, filtrables por 17 géneros.
- **Te recomienda**: deduce tus géneros favoritos de lo que ya tienes — dando más peso a lo que puntuaste alto — y te propone películas de esos géneros que aún no tienes.
- **Tráileres** dentro de la app, desde la portada o desde cualquier ficha. Arrancan al instante en silencio; el altavoz del reproductor activa el sonido.
- **Dónde verla**: en qué plataformas está cada película en tu país (incluida en la suscripción, alquiler o compra). Los datos son de JustWatch a través de TMDB, así que necesita la clave de TMDB guardada, uses la fuente que uses.
- **Sorpréndeme**: te propone una película al azar del catálogo, de las populares y las mejor valoradas del género que elijas, sin repetir las que ya tienes. Desde ahí puedes ver el tráiler o abrir su ficha para guardarla.
- **Más de esta persona**: en la ficha, pulsa el director o alguien del reparto para ver sus otras películas. Debajo, «Parecidas a esta» (con clave de TMDB) o más del mismo género.
- **Estadísticas**: películas y horas vistas, nota media, géneros y directores que más ves, décadas y tu ritmo del último año. Desde «Mi colección».
- **Avisos de plataforma**: con la app abierta, revisa cada seis horas las películas de tu lista y te avisa con una notificación cuando alguna llega a una plataforma en tu país. Necesita la clave de TMDB.
- Búsqueda por título con carátula, año, duración, director, reparto y sinopsis en español. **Sin cuentas ni claves**: funciona nada más instalarla.
- Colección y lista aparte, organizadas en filas (pendientes, mejor puntuadas, por género) o en rejilla con filtros.
- Tu propia nota del 1 al 10, marcar como vista con fecha y notas libres por película.
- **Copia de seguridad automática**: una copia diaria de la colección en la carpeta que elijas (mejor de OneDrive o Dropbox), con las siete últimas por fecha. Si la colección aparece vacía de repente, no sobrescribe la copia buena. «Restaurar» la trae de vuelta, también en otro ordenador. La clave de TMDB no se copia.
- Exportar e importar la colección en JSON para tener copia o llevártela a otro equipo.
- **Se mueve como una app de cine**: la carátula que pulsas se transforma en la ficha y vuelve a su sitio al cerrarla, las secciones se funden entre sí, las imágenes se enfocan al cargar y las filas encajan tarjeta a tarjeta. Si en Windows tienes activado reducir las animaciones, todo pasa a fundidos suaves y la portada deja de rotar sola.
- Ventana sin el marco de Windows: la barra de título y los botones de minimizar, maximizar y cerrar los dibuja la propia app.
- Se actualiza sola: cuando se publica una versión nueva en GitHub, la app la detecta, la descarga y la instala al reiniciar.

Las animaciones (entrada escalonada de las filas, acercamiento lento de la portada, respuesta al pulsar) se desactivan solas si tienes activado *Reducir movimiento* en Windows.

## Instalar

Descarga el instalador `.exe` más reciente desde [Releases](https://github.com/Xzorez/filmdex/releases) y ejecútalo.

A partir de ahí no hay que volver a descargar nada: la propia app avisa de las versiones nuevas.

## De dónde salen las fichas

Filmdex trae dos fuentes y se elige en **Ajustes**:

**Sin cuenta** (la de serie). No hay que registrarse en ningún sitio. Combina tres servicios públicos:

| Servicio | Aporta |
| --- | --- |
| Cinemeta | carátula, fondo, director, reparto, duración y nota de IMDb |
| Wikidata | el título traducido, cruzando por código de IMDb |
| Wikipedia | la sinopsis en tu idioma |

Si Wikidata o Wikipedia no conocen una película, la ficha se guarda igual con los datos en inglés en vez de fallar.

Los títulos ya traducidos se guardan en `titles-cache.json`, junto a la colección. El endpoint público de Wikidata es compartido y su latencia va de un segundo a más de un minuto sin avisar, así que la app recuerda lo resuelto — incluido lo que no tiene traducción — y corta cualquier consulta que pase de seis segundos. Con la caché caliente, la pantalla de inicio carga en decenas de milisegundos.

El catálogo de Cinemeta va sobre todo de cine reciente, así que descubrir sirve para «qué ver ahora» más que para rescatar clásicos. Para eso está la búsqueda, que sí llega al fondo del catálogo — o la fuente TMDB, cuyo `discover` cubre toda la historia del cine y llena **Mejor valoradas** de clásicos.

**TMDB** (opcional). Da títulos de estreno y sinopsis comerciales, algo más finas que el resumen enciclopédico de Wikipedia. Pide una clave gratuita: cuenta en [themoviedb.org](https://www.themoviedb.org) → **Ajustes → API**, y se pega en Ajustes dentro de Filmdex. Vale la clave v3 o el token v4, y se guarda solo en tu equipo.

## Desarrollo

```bash
npm install
npm run dev
```

Otros comandos:

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Arranca la app con recarga en caliente |
| `npm run preview:ui` | Solo el interfaz en el navegador, con datos de prueba y sin Electron |
| `npm run build` | Comprueba tipos y compila |
| `npm run dist` | Genera el instalador en `release/` sin publicarlo |

### Estructura

```
electron/main/      Proceso principal: ventana, almacenamiento y actualizador
electron/main/providers/  Las dos fuentes de fichas, con una interfaz común
electron/preload/   Puente seguro entre el interfaz y el proceso principal
src/                Interfaz en React
shared/types.ts     Tipos que comparten ambos lados
```

La colección vive en `%APPDATA%/filmdex/library.json` y los ajustes en `settings.json`, junto a él. El botón **Abrir carpeta de datos** de Ajustes te lleva ahí.

## Publicar una versión nueva

El actualizador automático se alimenta de las publicaciones de GitHub. Para sacar una versión:

```bash
npm version patch
git push --follow-tags
```

Eso sube una etiqueta `vX.Y.Z`, el flujo de [Release](.github/workflows/release.yml) compila el instalador en Windows y lo publica. Las copias instaladas lo detectan en su siguiente arranque.

## Créditos

Los datos vienen de Wikipedia, Wikidata, el catálogo Cinemeta de Stremio y, opcionalmente, TMDB. Este producto usa la API de TMDB, pero no está avalado ni certificado por TMDB.

Licencia MIT.
