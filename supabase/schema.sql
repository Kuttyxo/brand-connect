/* ==========================================================================
   MASTER SCRIPT: BRANDCONNECT
   Reinicia la base de datos, crea tablas, almacenamiento y seguridad.
   ========================================================================== */

-- 1. LIMPIEZA TOTAL (DROP)
-- Borramos las tablas en orden inverso a sus dependencias para evitar errores
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. TABLA: PROFILES (Perfiles de Usuario)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at timestamptz DEFAULT now(),
  full_name text,
  avatar_url text,
  website text,
  role text DEFAULT 'influencer', -- 'brand' o 'influencer'
  
  -- Campos extendidos
  bio text,
  phone text,
  city text,
  country text DEFAULT 'Chile',
  
  -- Redes Sociales (Handles)
  instagram_handle text,
  tiktok_handle text,
  facebook_handle text,
  
  -- Redes Sociales (URLs)
  instagram_url text,
  tiktok_url text,
  facebook_url text,
  
  -- Categorias/Intereses
  categories text[] DEFAULT '{}',
  
  is_verified boolean DEFAULT false
);

-- Seguridad Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfiles públicos para todos" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Usuarios editan su propio perfil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Usuarios insertan su propio perfil" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);


-- 3. TABLA: CAMPAIGNS (Campañas)
CREATE TABLE public.campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  title text NOT NULL,
  description text NOT NULL,
  budget numeric NOT NULL,
  status text DEFAULT 'open', -- 'open', 'closed', 'archived'
  brand_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  categories text[] DEFAULT '{}'
);

-- Seguridad Campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera ve campañas" 
ON public.campaigns FOR SELECT 
USING (true);

CREATE POLICY "Marcas crean campañas" 
ON public.campaigns FOR INSERT 
WITH CHECK (auth.uid() = brand_id);

CREATE POLICY "Dueños gestionan sus campañas" 
ON public.campaigns FOR ALL 
USING (auth.uid() = brand_id);


-- 4. TABLA: APPLICATIONS (Postulaciones)
CREATE TABLE public.applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  influencer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Constraint vital para que el chat funcione
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  
  message text,
  price_proposal numeric,
  
  UNIQUE(campaign_id, influencer_id) -- Un influencer solo postula una vez por campaña
);

-- Seguridad Applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Influencer crea postulación" 
ON public.applications FOR INSERT 
WITH CHECK (auth.uid() = influencer_id);

CREATE POLICY "Ver postulaciones (Influencer propio o Marca dueña)" 
ON public.applications FOR SELECT 
USING (
  auth.uid() = influencer_id OR 
  EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE public.campaigns.id = public.applications.campaign_id 
    AND public.campaigns.brand_id = auth.uid()
  )
);

CREATE POLICY "Marca actualiza estado (Aceptar/Rechazar)" 
ON public.applications FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE public.campaigns.id = public.applications.campaign_id 
    AND public.campaigns.brand_id = auth.uid()
  )
);


-- 5. TABLA: MESSAGES (Chat)
CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false
);

-- Seguridad Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso al chat (Participantes)" 
ON public.messages FOR ALL 
USING (
  sender_id = auth.uid() OR -- Si yo lo escribí
  EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.campaigns c ON a.campaign_id = c.id
    WHERE a.id = messages.application_id
    AND (a.influencer_id = auth.uid() OR c.brand_id = auth.uid())
  )
);


-- 6. STORAGE (Bucket de Avatares)
-- Intentamos insertar el bucket, si ya existe no pasa nada
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Limpiamos políticas viejas de storage
DROP POLICY IF EXISTS "Ver avatares" ON storage.objects;
DROP POLICY IF EXISTS "Subir avatares" ON storage.objects;
DROP POLICY IF EXISTS "Modificar avatares" ON storage.objects;

-- Políticas Storage
CREATE POLICY "Ver avatares" ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

CREATE POLICY "Subir avatares" ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

CREATE POLICY "Modificar avatares" ON storage.objects FOR ALL 
USING ( bucket_id = 'avatars' AND auth.uid() = owner );


-- 7. REALTIME (Chat en vivo)
-- Agregamos la tabla messages a la publicación de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;


-- 8. TRIGGER DE USUARIO NUEVO (Vital en Supabase)
-- Esto crea automáticamente el perfil cuando alguien se registra
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'influencer') -- Por defecto influencer si no se especifica
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Borramos trigger si existe y lo recreamos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();