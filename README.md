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

## Deploy recomendado

Vercel (ideal para mini proyecto):
1. Sube el repo a GitHub.
2. Importa en Vercel.
3. Define variables de entorno en Vercel Project Settings.
4. Build command: `npm run build`
5. Output directory: `dist`

## Seguridad aplicada

- CSP con `connect-src` limitado a tu dominio + Supabase.
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restrictiva
- `Strict-Transport-Security`
- `.env` ignorado en `.gitignore`
