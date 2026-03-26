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

## Supabase

- Cliente: `src/utils/supabase.js`
- Auth login/registro/cierre: `src/main.js` + `login.html`
- Persistencia de retos completados: tabla `user_challenge_progress`
- Historial de pomodoros: tabla `pomodoro_sessions`
- SQL listo para crear tablas + RLS: `supabase/schema.sql`

### Setup rapido de base de datos

1. Abre Supabase > SQL Editor.
2. Ejecuta `supabase/schema.sql`.
3. Verifica que existan las tablas:
   - `public.user_challenge_progress`
   - `public.pomodoro_sessions`
4. Prueba en `/app`: al marcar retos o completar pomodoro, los datos quedan guardados por usuario.

### Verificacion de correo y recuperacion de clave (SMTP)

El login ya incluye:
- Envio de verificacion al crear cuenta.
- Boton para reenviar verificacion.
- Boton "Olvide mi contrasena".
- Pantalla para establecer nueva contrasena al volver desde el enlace de recuperacion.

Para que los correos salgan por tu cuenta `focuszoneueb@gmail.com`, configuralo en Supabase:
1. Ve a `Authentication > Providers > Email`.
2. Activa `Confirm email` (verificacion obligatoria).
3. Ve a `Authentication > Settings > SMTP Settings`.
4. SMTP Host: `smtp.gmail.com`
5. SMTP Port: `587`
6. SMTP User: `focuszoneueb@gmail.com`
7. SMTP Pass: tu contrasena de aplicacion de Gmail.
8. Sender email: `focuszoneueb@gmail.com`
9. Sender name: `Focus Zone`
10. Guarda y prueba plantillas de `Confirm signup` y `Reset password`.

Importante: la contrasena de aplicacion es secreta. Si ya se compartio publicamente, revocala y genera una nueva.

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
