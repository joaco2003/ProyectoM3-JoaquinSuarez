# ComicSansCon · Chatea con tu personaje favorito

Prueba de concepto (POC) de una Single Page Application donde el usuario puede
chatear con personajes ficticios usando **Google Gemini AI**, desarrollada como
ejercicio de frontend junior para la agencia **ComicSansCon**.

🔗 **Demo en producción:** https://proyecto-m3-joaquin-suarez.vercel.app/home

📦 **Repositorio:** [github.com/joaco2003/ProyectoM3-JoaquinSuarez](https://github.com/joaco2003/ProyectoM3-JoaquinSuarez)

## Personajes disponibles

La app incluye una galería con 3 personajes, cada uno con su propio system prompt:

| Personaje | Franquicia | Personalidad |
|---|---|---|
| **Naruto Uzumaki** | Naruto (Masashi Kishimoto) | Hiperactivo, optimista, leal, obsesionado con ser Hokage |
| **Sherlock Holmes** | Sherlock Holmes (A. Conan Doyle) | Analítico, deductivo, ligeramente arrogante |
| **Homero Simpson** | Los Simpson | Glotón, impulsivo, torpe, entrañable |

Podés elegir el personaje desde `/home` y el chat recuerda tu selección.

## Estructura del proyecto

```
comicsanscon-chat/
├── api/
│   └── chat.js            # Vercel Serverless Function: proxy seguro hacia Gemini
├── img/                   # Imágenes de los personajes y capturas
├── src/
│   ├── index.html
│   ├── css/
│   │   └── styles.css     # Diseño mobile-first, temas claro/oscuro
│   └── js/
│       ├── app.js         # Router (History API) + renderizado de vistas
│       ├── chat.js        # Fetch a /api/chat + manejo de errores
│       ├── characters.js  # Datos y system prompts de cada personaje
│       ├── storage.js     # Persistencia de historial en localStorage
│       └── utils.js       # Funciones puras de parseo/transformación
├── tests/
│   ├── utils.test.js
│   └── chat.test.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── vercel.json
```

## Requisitos

- Node.js 18+
- Una API key de Google Gemini: https://aistudio.google.com/app/apikey
- [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`) para correr `vercel dev` localmente

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `GEMINI_API_KEY` | Sí | Tu API key de Google Gemini |
| `GEMINI_MODEL` | No | Modelo a usar. Por defecto: `gemini-3.6-flash` |

## Cómo correr el proyecto localmente

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Copiar el archivo de variables de entorno y completar tu API key real:
   ```bash
   cp .env.example .env.local
   # editar .env.local y pegar tu GEMINI_API_KEY
   ```
3. Levantar el entorno de desarrollo (sirve tanto el frontend estático como las
   funciones serverless de `/api`):
   ```bash
   vercel dev
   ```
4. Abrir `http://localhost:3000/home` (o el puerto que indique la CLI).

> **Nota:** el frontend nunca ve la API key. Todo el llamado a Gemini pasa por
> `/api/chat.js`, que corre en el servidor y lee `process.env.GEMINI_API_KEY`.

## Cómo correr los tests

```bash
npm test
```

Esto ejecuta Vitest en modo `run` sobre todo `tests/` (22 tests en 2 archivos).
Hay tests para:

- `utils.js`: construcción del body de la petición, parseo de la respuesta de
  Gemini, formateo de timestamps, parseo de rutas, truncado de texto.
- `chat.js`: llamada a `/api/chat` con `fetch` **mockeado** (sin red real),
  cubriendo el caso feliz, error HTTP, error de red y validación de mensaje vacío.

Para modo watch mientras desarrollás:

```bash
npm run test:watch
```

## Cómo desplegar a Vercel

1. Subir el repo a GitHub.
2. En [vercel.com](https://vercel.com), **Add New Project** → importar el repo.
3. En **Environment Variables**, agregar:
   - `GEMINI_API_KEY` = tu clave real
   - `GEMINI_MODEL` (opcional, por defecto `gemini-3.6-flash`)
4. Deploy. Vercel detecta automáticamente `/api/chat.js` como función
   serverless y `src/` como el sitio estático (configurado en `vercel.json`).
   Si agregás o cambiás variables de entorno después, hay que hacer un
   **Redeploy** para que apliquen.
5. Verificar en producción que `/home`, `/chat` y `/about` cargan bien al
   navegar directo por URL (gracias a los rewrites de `vercel.json`), y que el
   chat responde sin exponer la key en las DevTools → Network.

**URL de la app desplegada:** https://proyecto-m3-joaquin-suarez.vercel.app/home

> **Nota sobre límites de uso:** la app usa el plan gratuito de Gemini, que
> tiene un tope de peticiones por minuto. Si aparece el mensaje *"Se alcanzó
> el límite de uso de la IA"* (error 429), esperá un minuto y volvé a
> intentar. Si el modelo está saturado (error 503), el servidor reintenta
> automáticamente hasta 3 veces antes de mostrar un error.

## Manejo de errores de la API

`/api/chat` valida la entrada y devuelve mensajes claros:

| Status | Causa |
|---|---|
| `400` | Faltan campos (`characterId`, `message`) o el personaje no existe |
| `405` | Método distinto de `POST` |
| `429` | Se superó el límite de uso de Gemini |
| `502` | Error al comunicarse con la IA o respuesta vacía |
| `503` | Modelo saturado (tras 3 reintentos) |
| `500` | Falta la API key en el servidor o error interno |

## Capturas de pantalla

![Chat con Naruto](img/naruto.png)
![Chat con Sherlock](img/sherlock.png)
![Chat con Homero](img/homero.png)

## Registro de uso de IA en el proyecto

Se usó un asistente de IA como herramienta de aprendizaje y aceleración durante
el desarrollo, específicamente para:

- Bocetar la estructura inicial del router SPA basado en History API.
- Redactar y afinar los 3 system prompts (tono, límites, longitud de respuesta).
- Revisar accesibilidad y breakpoints del CSS responsive.
- Generar el set inicial de tests unitarios con Vitest.
- Depurar el despliegue en Vercel (variables de entorno) y revisar el manejo
  de errores del backend (reintentos en 503 y mensaje para 429).

Todo el código generado fue revisado, entendido y ajustado manualmente antes
de integrarlo al proyecto final.

## Notas de diseño

- **Mobile-first:** la barra de navegación es inferior (estilo consola) en
  mobile y pasa a un menú superior desde tablet (`min-width: 600px`).
- **Persistencia:** el historial se guarda en `localStorage` por personaje;
  hay un botón "Borrar historial" y un indicador de "historial guardado".
- **Accesibilidad:** foco visible, `aria-live` en la lista de mensajes,
  `prefers-reduced-motion` respetado en el indicador de "escribiendo…".