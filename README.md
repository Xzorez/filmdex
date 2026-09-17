# Filmdex

Catálogo personal de películas para escritorio. Buscas una película por título, la guardas con el formato que tienes en casa (Blu-ray, 4K UHD, DVD…) y Filmdex te monta la estantería con carátulas, fichas y tus notas.

Todo se guarda **solo en tu ordenador**. No hay cuentas, ni servidores, ni nada que subir a ninguna parte.

## Qué hace

- Búsqueda por título con carátula, año, duración, director, reparto y sinopsis en español. **Sin cuentas ni claves**: funciona nada más instalarla.
- Colección y lista de deseos separadas, con filtros por formato y por vistas/pendientes.
- Tu propia nota del 1 al 10, marcar como vista (con fecha) y notas libres por película.
- Exportar e importar la colección en JSON para tener copia o llevártela a otro equipo.
- Se actualiza sola: cuando se publica una versión nueva en GitHub, la app la detecta, la descarga y la instala al reiniciar.

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
