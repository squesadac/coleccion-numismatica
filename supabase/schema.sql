-- =====================================================================
-- Colección Numismática: esquema de la base de datos (Supabase)
--
-- Cómo usarlo: en Supabase abra "SQL Editor" → "New query", pegue TODO
-- este archivo y presione "Run". Se puede volver a ejecutar sin problema.
-- =====================================================================

-- ---------- Administradores ----------
-- Solo los correos de esta tabla pueden agregar, editar o borrar.
create table if not exists public.administradores (
  email text primary key
);
alter table public.administradores enable row level security;

-- ¿La persona que hace la consulta es administradora?
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.administradores
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

drop policy if exists "cada quien ve su propio registro" on public.administradores;
create policy "cada quien ve su propio registro" on public.administradores
  for select using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- ---------- Álbumes ----------
create table if not exists public.albumes (
  id text primary key default gen_random_uuid()::text,
  nombre text not null,
  descripcion text default '',
  tipo text not null default 'moneda' check (tipo in ('moneda', 'billete')),
  filas int not null default 4 check (filas between 1 and 12),
  columnas int not null default 5 check (columnas between 1 and 8),
  paginas int not null default 1 check (paginas >= 1),
  color text default '#1f4d3a',
  orden int not null default 0,
  creado timestamptz not null default now()
);
alter table public.albumes enable row level security;

-- ---------- Piezas (lo que ven todos) ----------
create table if not exists public.piezas (
  id text primary key default gen_random_uuid()::text,
  tipo text not null default 'moneda' check (tipo in ('moneda', 'billete')),
  pais text not null,
  denominacion text not null,
  anio text default '',
  metal text default '',
  estado text default '',
  catalogo text default '',
  descripcion text default '',
  historia text default '',
  album_id text references public.albumes (id) on delete set null,
  pagina int,
  posicion int,
  fotos jsonb not null default '{}'::jsonb,
  creado timestamptz not null default now(),
  actualizado timestamptz
);
create index if not exists piezas_album_idx on public.piezas (album_id, pagina, posicion);
create index if not exists piezas_pais_idx on public.piezas (pais);
alter table public.piezas enable row level security;

-- ---------- Datos privados (solo administradores) ----------
create table if not exists public.piezas_privado (
  pieza_id text primary key references public.piezas (id) on delete cascade,
  precio_compra numeric,
  valor_estimado numeric,
  ubicacion text default ''
);
alter table public.piezas_privado enable row level security;

-- ---------- Permisos ----------
drop policy if exists "todos leen albumes" on public.albumes;
create policy "todos leen albumes" on public.albumes for select using (true);
drop policy if exists "admin escribe albumes" on public.albumes;
create policy "admin escribe albumes" on public.albumes for all
  using (public.es_admin()) with check (public.es_admin());

drop policy if exists "todos leen piezas" on public.piezas;
create policy "todos leen piezas" on public.piezas for select using (true);
drop policy if exists "admin escribe piezas" on public.piezas;
create policy "admin escribe piezas" on public.piezas for all
  using (public.es_admin()) with check (public.es_admin());

drop policy if exists "solo admin privado" on public.piezas_privado;
create policy "solo admin privado" on public.piezas_privado for all
  using (public.es_admin()) with check (public.es_admin());

-- ---------- Fotos (Supabase Storage) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = true;

drop policy if exists "todos ven fotos" on storage.objects;
create policy "todos ven fotos" on storage.objects for select
  using (bucket_id = 'fotos');
drop policy if exists "admin sube fotos" on storage.objects;
create policy "admin sube fotos" on storage.objects for insert
  with check (bucket_id = 'fotos' and public.es_admin());
drop policy if exists "admin cambia fotos" on storage.objects;
create policy "admin cambia fotos" on storage.objects for update
  using (bucket_id = 'fotos' and public.es_admin());
drop policy if exists "admin borra fotos" on storage.objects;
create policy "admin borra fotos" on storage.objects for delete
  using (bucket_id = 'fotos' and public.es_admin());

-- ---------- Su correo como administrador ----------
-- Cambie el correo por el que usará para entrar al sitio (el mismo del
-- usuario creado en Authentication → Users).
insert into public.administradores (email)
values ('CAMBIE-ESTE-CORREO@ejemplo.com')
on conflict do nothing;
