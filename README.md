# redesign-dapta

La pantalla de inicio de Dapta rehecha con el sistema de diseño de **blindem-liquidaciones**: los mismos tokens
(Lime, claro y oscuro), componentes, iconos Hugeicons, tipografías (Hanken Grotesk, SN Pro, Geist Mono) y scripts.

```bash
npm install
npm run dev      # http://localhost:5180
npm run build    # dist/
```

### Vercel

Importa el repositorio en Vercel y despliega sin tocar nada: `vercel.json` fija Vite, `npm run build` y `dist/`.
Las dos rutas que en local sirve el middleware de `vite.config.js` (`GET /buscar` de la paleta ⌘K y
`POST /notificaciones/leer`) se reescriben a las funciones de `api/`, que usan los mismos datos de `mock/records.js`.

## Qué viene de blindem y qué es nuevo

| Archivo | Origen |
| --- | --- |
| `public/css/app.css` | blindem `public/css/app.css`, sin cambios |
| `public/js/app.js`, `ui.js`, `controls.js`, `nav.js`, `ai.js`, `sounds.js`, `vendor/cuelume` | blindem, sin cambios |
| `public/js/command.js` | blindem; solo cambian los tipos de registro (`KIND`) y el texto de «Preguntar» |
| `icons-src/blindem.svg` | sprite de blindem; `npm run icons` lo copia a `public/icons/hugeicons.svg` y añade los iconos de Dapta desde `@hugeicons/core-free-icons` (mismo set, Stroke Rounded) |
| `icons-src/dapta-wordmark.svg`, `dapta-iso.svg` | logo oficial de Dapta; `npm run icons` los convierte en los símbolos `dapta-wordmark` y `dapta-iso` (letras en `currentColor`, acentos lima `#cbe84f`) y genera `public/favicon.svg` |
| `public/logos/*.svg` | logos de integraciones de [svgl.app](https://svgl.app) (HubSpot no está en svgl: se usa Salesforce) |
| `public/css/dapta.css` | nuevo: selector de espacio, pills del menú, compositor de Dapti, integraciones y Dapta Academy, todo con tokens de `app.css` |
| `public/js/dapta.js` | nuevo: compositor de Dapti, filtros e idioma de Academy, grupos del menú en modo riel, `window.agent` para la paleta |
| `index.html` | el marcado de `layouts/app.blade.php` y `dashboard/index.blade.php` con el contenido de Dapta |

## Mapeo de la pantalla

La home es minimalista: el chat con Dapti es la pieza principal y lo demás queda debajo.

| Dapta | Componente |
| --- | --- |
| Menú lateral, colapsar, redimensionar, menú móvil | blindem `.sidebar`, `.nav-link`, `.nav-group`; el wordmark pasa a isotipo en el riel |
| Cambiar espacio de trabajo | `<select>` mejorado por `app.js` (`.custom-select`) |
| Cuenta, tema, sonido | blindem `.account-trigger` + `.account-panel` |
| Buscar o ir a… (⌘K) | blindem `dialog.command` + `command.js` (`GET /buscar`, simulado en `vite.config.js`); «Preguntar» envía a Dapti |
| Notificaciones | blindem `.notif-panel` + `nav.js` (`public/data/notifications.json`) |
| «Hola Manuel, ¿cómo te ayudo?» + chat | `.home-hero` + `.composer-xl` (campo de blindem a tamaño grande), `.ai-chip`, `.ai-send`; el hilo usa `thinking()` y `stream()` de `ai.js` |
| Dapti alrededor del chat | 4 poses (`public/img/dapti-peek-*.webp`, `dapti-wave-right.webp`): arriba, derecha, izquierda y saludando. Salen desde detrás del chat (se deslizan bajo el compositor y solo pasan delante al llegar, para que las patas agarren el borde) y cambian una vez por hora; las laterales solo si hay espacio |
| Créditos usados | `.plan-meter` (dapta.css/dapta.js): ficha con icono de monedas, barra con brillo y «Mejorar plan»; `data-used`/`data-total` deciden el estado (lima, ámbar desde 80 %, rojo al agotarse) |
| Conecta tu IA | `.connect-ai`: logos de Claude, OpenAI y Cursor (svgl.app, en línea) que se turnan con el «Icon swap» de transitions.dev (`.ai-swap`) |
| Dapti en las respuestas | solo su nombre sobre el texto, sin imagen |
| Conecta tus herramientas | logos de svgl.app en discos blancos juntos, solapados como un grupo de avatares, con «Avatar group hover» de transitions.dev (`.t-avatar`, `dapta.js`) |
| Continúa donde lo dejaste | lista simple `.home-recent` con `.status` de blindem |
| Dapta Academy | `.section-head`, `.segmented`, `.ai-chip`, tarjetas `.surface` |
