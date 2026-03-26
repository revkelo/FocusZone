# Focus Zone Web App

Mini proyecto responsive con estilo premium, rutas `index/login/app`, autenticacion con Supabase y retos semanales.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

## Variables de entorno

Crea `.env` (o `.env.local`) con:

```bash
VITE_SUPABASE_URL=TU_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=TU_SUPABASE_ANON_KEY
```

Tambien tienes referencia en `.env.example`.

Variables adicionales para chat Lumi:

```bash
OPENROUTER_API_KEY=TU_OPENROUTER_API_KEY
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_SITE_URL=https://focuszone.app
OPENROUTER_SITE_NAME=FocusZone
```

Variables adicionales para verificación por código (registro y recuperar clave):

```bash
SUPABASE_SERVICE_ROLE_KEY=TU_SUPABASE_SERVICE_ROLE_KEY
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=focuszoneueb@gmail.com
SMTP_PASS=TU_APP_PASSWORD_DE_GOOGLE
SMTP_FROM_EMAIL=focuszoneueb@gmail.com
SMTP_FROM_NAME=Focus Zone
```

## Supabase

- Cliente: `src/utils/supabase.js`
- Auth login/registro/cierre: `src/main.js` + `login.html`
- Persistencia de retos completados: tabla `user_challenge_progress`
- Historial de pomodoros: tabla `pomodoro_sessions`
- SQL listo para crear tablas + RLS: `supabase/schema.sql`

### Setup rápido de base de datos

1. Abre Supabase > SQL Editor.
2. Ejecuta `supabase/schema.sql`.
3. Verifica que existan las tablas:
   - `public.user_challenge_progress`
   - `public.pomodoro_sessions`
4. Prueba en `/app`: al marcar retos o completar pomodoro, los datos quedan guardados por usuario.

### Verificación por código de 4 dígitos (registro y recuperación)

El login ya incluye:
- Registro en 2 pasos (datos + código de 4 dígitos).
- Validación de contraseña repetida en registro.
- Recuperación de clave por código de 4 dígitos.
- Cambio de contraseña usando ese código.

Para usarlo debes:
1. Ejecutar `supabase/schema.sql` (incluye tabla `public.auth_email_codes`).
2. Definir `SUPABASE_SERVICE_ROLE_KEY` y variables SMTP en Vercel/entorno.
3. Desplegar.

Importante: la contraseña de aplicación es secreta. Si ya se compartió públicamente, revócala y genera una nueva.

## Deploy recomendado

Vercel (ideal para mini proyecto):
1. Sube el repo a GitHub.
2. Importa en Vercel.
3. Define variables de entorno en Vercel Project Settings.
4. Build command: `npm run build`
5. Output directory: `dist`

## Endpoint de chat sin persistencia (Lumi)

- Ruta: `POST /api/lumi-chat`
- Body JSON: `{ "message": "..." }`
- Respuesta: `{ "reply": "...", "model": "..." }`

Este endpoint siempre envia el prompt de contexto de Lumi como `system` en cada peticion y no guarda historial en base de datos.

## Seguridad aplicada

- CSP con `connect-src` limitado a tu dominio + Supabase.
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restrictiva
- `Strict-Transport-Security`
- `.env` ignorado en `.gitignore`
