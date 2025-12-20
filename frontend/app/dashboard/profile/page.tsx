'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Edit3, MapPin, Instagram, Facebook, Globe, 
  Share2, Hash, Briefcase, User 
} from 'lucide-react';

type Profile = {
  full_name: string;
  role: string;
  avatar_url: string | null;
  bio: string;
  city: string;
  country: string;
  categories: string[];
  instagram_handle: string; instagram_url: string;
  tiktok_handle: string; tiktok_url: string;
  facebook_handle: string; facebook_url: string;
};

export default function MyProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        // Generar URL pública de la imagen si existe
        if (data.avatar_url) {
          const { data: publicUrl } = supabase.storage
            .from('avatars')
            .getPublicUrl(data.avatar_url);
          setAvatarUrl(publicUrl.publicUrl);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-48 bg-gray-200 rounded-2xl w-full"></div>
        <div className="flex gap-4">
           <div className="h-32 w-32 bg-gray-200 rounded-full"></div>
           <div className="space-y-2 flex-1">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
           </div>
        </div>
      </div>
    );
  }

  // Si no hay datos, mostrar estado vacío
  if (!profile) return <div>No se encontró el perfil.</div>;

  const isBrand = profile.role === 'brand';

  return (
    <div className="animate-fade-in pb-20">
      
      {/* 1. HEADER / BANNER */}
      <div className="relative mb-16">
        {/* Fondo decorativo (Banner) */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-[var(--color-brand-dark)] to-[var(--color-brand-orange)] rounded-3xl shadow-md overflow-hidden relative">
           <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>

        {/* Tarjeta de Información Principal (Flotante) */}
        <div className="absolute -bottom-12 left-6 md:left-10 flex items-end gap-6">
          {/* Avatar con borde grueso */}
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden">
            {avatarUrl ? (
              <Image 
                src={avatarUrl} 
                alt="Avatar" 
                fill 
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                <User size={64} />
              </div>
            )}
          </div>
        </div>

        {/* Botón Editar (Posicionado estratégicamente) */}
        <div className="absolute -bottom-14 right-4 md:right-0 md:bottom-4 md:relative flex justify-end">
           <Link href="/dashboard/profile/edit">
             <button className="flex items-center gap-2 bg-white text-[var(--color-brand-dark)] px-5 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg hover:bg-gray-50 transition-all border border-gray-100">
               <Edit3 size={18} />
               <span className="hidden md:inline">Editar Perfil</span>
               <span className="md:hidden">Editar</span>
             </button>
           </Link>
        </div>
      </div>

      {/* 2. CONTENIDO DEL PERFIL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4 md:mt-0">
        
        {/* COLUMNA IZQUIERDA: Info Personal */}
        <div className="md:col-span-2 space-y-8">
          
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-2">
              {profile.full_name || 'Usuario Sin Nombre'}
              {/* Badge de Verificación (Simulado por ahora) */}
              <span className="text-blue-500" title="Cuenta Verificada">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              </span>
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-500 mt-2">
              {profile.city && (
                <span className="flex items-center gap-1">
                  <MapPin size={16} /> {profile.city}, {profile.country}
                </span>
              )}
              <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold uppercase tracking-wider">
                {isBrand ? 'Empresa' : 'Influencer'}
              </span>
            </div>
          </div>

          {/* Biografía */}
          {profile.bio && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <User size={20} className="text-[var(--color-brand-orange)]" />
                Bio
              </h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Categorías */}
          {profile.categories && profile.categories.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Hash size={20} className="text-[var(--color-brand-orange)]" />
                Intereses / Nicho
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.categories.map((cat, index) => (
                  <span 
                    key={index} 
                    className="px-4 py-2 bg-orange-50 text-[var(--color-brand-orange)] rounded-xl font-medium border border-orange-100"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: Redes y Contacto */}
        <div className="space-y-6">
          
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Share2 size={20} className="text-[var(--color-brand-orange)]" />
            Conecta
          </h3>

          <div className="grid gap-4">
            
            {/* Instagram Card */}
            {profile.instagram_handle ? (
              <a 
                href={profile.instagram_url || `https://instagram.com/${profile.instagram_handle.replace('@','')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-pink-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center">
                    <Instagram size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Instagram</p>
                    <p className="text-xs text-gray-500">{profile.instagram_handle}</p>
                  </div>
                </div>
                <div className="text-gray-300 group-hover:text-pink-500 transition-colors">
                  →
                </div>
              </a>
            ) : (
              // Estado vacío (Placeholder)
              <div className="opacity-50 flex items-center justify-between p-4 border border-dashed border-gray-300 rounded-2xl">
                 <div className="flex items-center gap-3">
                    <Instagram size={20} className="text-gray-400"/>
                    <span className="text-sm text-gray-500">Instagram no conectado</span>
                 </div>
              </div>
            )}

            {/* TikTok Card */}
            {profile.tiktok_handle && (
              <a 
                href={profile.tiktok_url || `https://tiktok.com/@${profile.tiktok_handle.replace('@','')}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-black transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 text-black rounded-full flex items-center justify-center">
                    <span className="font-bold">Tk</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">TikTok</p>
                    <p className="text-xs text-gray-500">{profile.tiktok_handle}</p>
                  </div>
                </div>
                <div className="text-gray-300 group-hover:text-black transition-colors">→</div>
              </a>
            )}

            {/* Facebook Card */}
            {profile.facebook_handle && (
              <a 
                href={profile.facebook_url || '#'}
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <Facebook size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Facebook</p>
                    <p className="text-xs text-gray-500">{profile.facebook_handle}</p>
                  </div>
                </div>
                <div className="text-gray-300 group-hover:text-blue-500 transition-colors">→</div>
              </a>
            )}

          </div>

          {!profile.instagram_handle && !profile.tiktok_handle && !profile.facebook_handle && (
             <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl text-sm">
                ⚠️ Tu perfil se ve un poco vacío. Agrega tus redes sociales para que te contacten.
             </div>
          )}

        </div>
      </div>
    </div>
  );
}