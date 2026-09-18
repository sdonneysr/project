-- Ejecutar una sola vez en el proyecto de Supabase:
-- Dashboard -> SQL Editor -> pegar este archivo completo -> Run.
--
-- Crea la tabla que guarda el tablero completo como un unico documento JSON
-- (misma forma de datos que usa el resto de la app) y restringe lectura y
-- escritura a usuarios autenticados.

create table if not exists public.tablero_datos (
  id integer primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  constraint tablero_datos_fila_unica check (id = 1)
);

alter table public.tablero_datos enable row level security;

create policy "Usuarios autenticados leen el tablero"
  on public.tablero_datos for select
  to authenticated
  using (true);

create policy "Usuarios autenticados actualizan el tablero"
  on public.tablero_datos for update
  to authenticated
  using (true)
  with check (true);

insert into public.tablero_datos (id, data)
values (1, '{"v":4,"proyectos":[],"fases":[],"tareas":[],"entregables":[],"recursos":[],"asignaciones":[],"costos":[],"riesgos":[],"alcance":[],"interesados":[],"comunicaciones":[],"avances":[]}'::jsonb)
on conflict (id) do nothing;
