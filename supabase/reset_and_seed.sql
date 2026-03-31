-- Focus Zone: reset + seed para entorno demo
-- Ejecutar en Supabase SQL Editor por secciones.
-- Recomendado: usar SOLO en desarrollo/staging.

-- =========================================================
-- 1) RESET COMPLETO (Auth + tablas public)
-- =========================================================
begin;

-- Borra usuarios de auth (esto dispara cascada en tablas con FK a auth.users)
delete from auth.users;

-- Limpia tablas de aplicacion y reinicia IDs autoincrementales
truncate table
  public.auth_email_codes,
  public.push_subscriptions,
  public.pomodoro_room_presence,
  public.pomodoro_room_members,
  public.pomodoro_rooms,
  public.reward_redemptions,
  public.user_rewards,
  public.user_challenge_progress,
  public.pomodoro_sessions,
  public.custom_challenges,
  public.user_leaderboard,
  public.reward_catalog,
  public.challenge_catalog
restart identity cascade;

commit;

-- =========================================================
-- 2) CREAR USUARIOS DEMO
-- =========================================================
-- Hazlo desde Supabase:
-- Authentication -> Users -> Add user
-- Crea al menos 6-12 usuarios para que el seed de actividad luzca real.

-- =========================================================
-- 3) SEED BASE (catalogos)
-- =========================================================
insert into public.reward_catalog (title, description, cost_points)
values
  ('Bono Kokoriko', 'Cupon de ejemplo para redimir en aliados.', 120),
  ('Tema premium', 'Desbloquea una apariencia premium en la app.', 80),
  ('Descanso extendido', 'Canjea un break de 30 minutos sin culpa.', 60)
on conflict (title) do nothing;

insert into public.challenge_catalog (code, title, description, week, day, points, is_active)
values
  ('atencion-01', 'Elegir una red social y limitar su uso a 15 minutos diarios.', 'Registrar el tiempo de uso diario de una red social.', 1, 1, 20, true),
  ('atencion-02', 'Definir una zona o momento libre de redes y anotar cumplimiento.', 'Anotar cuantas veces cumples y que hiciste en su lugar.', 1, 2, 20, true),
  ('atencion-03', 'Elegir 3 comportamientos que quieren reducir.', 'Ejemplo: checking compulsivo, comparacion o rage-scrolling.', 1, 3, 25, true),
  ('atencion-04', 'Elegir 60 minutos seguidos sin redes sociales.', 'Anotar que hiciste y como te sentiste en ese bloque.', 1, 4, 30, true),
  ('atencion-05', 'Desactiva todas las notificaciones no esenciales durante 3 horas.', 'Mantener 3 horas sin interrupciones de notificaciones.', 1, 5, 35, true),
  ('atencion-06', 'Crear una lista de 5 actividades offline y probar al menos 2.', 'Registrar que tan satisfactorias fueron las actividades.', 1, 6, 20, true),
  ('atencion-07', 'Revision semanal: identificar que patron se repite.', 'Detectar el patron principal de distraccion de la semana.', 1, 7, 25, true),
  ('atencion-08', 'Sin redes en clase, solo lo necesario para estudiar.', 'Reducir uso de redes durante clase o bloque de estudio.', 2, 8, 35, true),
  ('atencion-09', 'Primeros 20 minutos del dia sin pantallas.', 'Estirar, respirar o beber agua antes de ver pantallas.', 2, 9, 30, true),
  ('atencion-10', 'Utiliza el pomodoro de la aplicacion al realizar tus tareas.', 'Ajustar el pomodoro segun tus necesidades de enfoque.', 2, 10, 35, true),
  ('atencion-11', 'Invita a un amigo a hacer el reto contigo.', 'Sumar compania y compromiso en el proceso.', 2, 11, 40, true),
  ('atencion-12', 'Reduce tu tiempo en pantalla un 50% de lo normal.', 'Comparar tu tiempo actual con tu promedio habitual.', 2, 12, 35, true),
  ('atencion-13', 'Hacer una lista de 5 cosas que logre hoy.', 'Escribir avances concretos del dia.', 2, 13, 40, true),
  ('atencion-14', 'Revision semanal: que me hizo sentir mejor fuera de redes.', 'Definir que uso de redes quiero cambiar.', 2, 14, 45, true),
  ('atencion-15', 'Reemplaza 30 minutos de redes por otra actividad.', 'Usar ese tiempo en una actividad offline de valor.', 3, 15, 50, true),
  ('atencion-16', 'Haz 2 bloques de enfoque de 25 minutos cada uno.', 'Completar dos ciclos de foco con descansos breves.', 3, 16, 45, true),
  ('atencion-17', '30 minutos antes de dormir, desconectate de todas las pantallas.', 'Preparar descanso sin estimulos digitales.', 3, 17, 45, true),
  ('atencion-18', 'Elegir 1 dia de la semana como dia ligero en redes.', 'Maximo 30 minutos en redes durante ese dia.', 3, 18, 40, true),
  ('atencion-19', 'Usar distintas plataformas solo para aprender cosas nuevas.', 'Consumir contenido educativo de forma intencional.', 3, 19, 50, true),
  ('atencion-20', 'Practicar un hobby externo a las redes.', 'Dedicar tiempo a un habito offline significativo.', 3, 20, 35, true),
  ('atencion-21', 'Plan post-reto: escribe 3 reglas para tu uso de redes.', 'Definir reglas personales para sostener el cambio.', 3, 21, 60, true)
on conflict (code) do update
set
  title = excluded.title,
  description = excluded.description,
  week = excluded.week,
  day = excluded.day,
  points = excluded.points,
  is_active = excluded.is_active;

-- =========================================================
-- 4) SEED "APP EN FUNCIONAMIENTO" (requiere usuarios en auth.users)
-- =========================================================

-- Leaderboard base
insert into public.user_leaderboard (user_id, display_name, total_points, updated_at)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data->>'nickname', ''), nullif(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1), 'Usuario') as display_name,
  greatest(0, 340 - ((row_number() over (order by u.created_at asc) - 1) * 30))::integer as total_points,
  now() - (random() * interval '6 days')
from auth.users u
where u.email is not null
order by u.created_at asc
limit 24
on conflict (user_id) do update
set
  display_name = excluded.display_name,
  total_points = excluded.total_points,
  updated_at = excluded.updated_at;

-- Pomodoros historicos (10 por usuario)
insert into public.pomodoro_sessions (user_id, duration_seconds, completed_at, created_at)
select
  u.id,
  (array[900, 1200, 1500, 1800])[1 + floor(random() * 4)::int] as duration_seconds,
  now() - ((g.n * 8 + floor(random() * 7))::text || ' hours')::interval as completed_at,
  now() - ((g.n * 8 + floor(random() * 7))::text || ' hours')::interval as created_at
from auth.users u
cross join generate_series(1, 10) as g(n);

-- Retos completados (hasta 8 por usuario)
insert into public.user_challenge_progress (user_id, challenge_id, completed_at, created_at)
select
  u.id,
  c.code as challenge_id,
  now() - ((row_number() over (partition by u.id order by c.day) * 1.2)::text || ' days')::interval as completed_at,
  now() - ((row_number() over (partition by u.id order by c.day) * 1.2)::text || ' days')::interval as created_at
from auth.users u
join public.challenge_catalog c on c.is_active = true and c.day <= 8
on conflict (user_id, challenge_id) do nothing;

-- Redenciones de recompensa (1 por usuario)
insert into public.reward_redemptions (user_id, reward_id, points_spent, created_at)
select
  u.id,
  r.id as reward_id,
  r.cost_points as points_spent,
  now() - (random() * interval '5 days')
from auth.users u
join lateral (
  select id, cost_points
  from public.reward_catalog
  order by random()
  limit 1
) r on true;
