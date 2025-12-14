-- 1. TABLA DE PERFILES (Extiende la tabla de usuarios de Supabase)
-- Razón: Supabase maneja el login (email/pass) en una tabla oculta.
-- Nosotros necesitamos una tabla pública para guardar si es marca o influencer.
create table public.profiles (
  id uuid references auth.users not null primary key, -- Se une al ID de usuario de Supabase
  email text,
  role text check (role in ('brand', 'influencer')), -- Solo permite estos dos valores
  social_handle text unique, -- Ej: @usuario_instagram
  is_verified boolean default false, -- ¡Clave para tu Bot DevOps!
  followers_count integer default 0, -- Tu bot llenará esto
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABLA DE CAMPAÑAS (El "Trabajo" que publica la marca)
-- Razón: Necesitamos guardar qué pide la marca y cuánto paga.
create table public.campaigns (
  id uuid default gen_random_uuid() primary key,
  brand_id uuid references public.profiles(id) not null, -- Quién la creó
  title text not null,
  description text not null,
  requirements jsonb, -- JSONB permite flexibilidad (ej: guardar filtros sin cambiar la tabla)
  budget integer not null, -- Presupuesto en pesos/dólares
  status text check (status in ('open', 'closed', 'completed')) default 'open',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABLA DE POSTULACIONES (El "Match")
-- Razón: Conecta un Influencer con una Campaña específica.
create table public.applications (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references public.campaigns(id) not null,
  influencer_id uuid references public.profiles(id) not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  metrics_snapshot jsonb, -- Aquí tu Bot guardará el ROI final (likes, views)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(campaign_id, influencer_id) -- Evita que un influencer postule 2 veces a lo mismo
);

-- 4. SEGURIDAD AUTOMÁTICA (Trigger)
-- Esto crea un perfil automáticamente cuando alguien se registra en tu App
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, new.raw_user_meta_data->>'role');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();