'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import AvatarUpload from '@/components/AvatarUpload'
import { 
  Save, MapPin, Phone, Globe, Instagram, Facebook, 
  ArrowLeft, Hash, Link as LinkIcon, Building2, Store, Video 
} from 'lucide-react'
import Link from 'next/link'
// 1. IMPORTAR EL COMPONENTE NUEVO
import PortfolioManager from '@/components/PortfolioManager'

// CONSTANTES
const CATEGORIES = [
  "Moda", "Fitness", "Humor", "Comida", "Viajes", 
  "Tecnología", "Lifestyle", "Perfumería", "Gaming", "Educación"
];

// Definimos la estructura de datos
type ProfileData = {
  full_name: string
  bio: string
  categories: string[]
  phone: string
  city: string
  country: string
  avatar_url: string | null
  
  // Redes Sociales (Usuario)
  instagram_handle: string
  tiktok_handle: string
  facebook_handle: string
  
  // Redes Sociales (URL)
  instagram_url: string
  tiktok_url: string
  facebook_url: string
  
  website: string
  role: string
}

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Estado inicial
  const [formData, setFormData] = useState<ProfileData>({
    full_name: '',
    bio: '',
    categories: [],
    phone: '',
    city: '',
    country: 'Chile',
    avatar_url: null,
    instagram_handle: '',
    tiktok_handle: '',
    facebook_handle: '',
    instagram_url: '', 
    tiktok_url: '',    
    facebook_url: '',  
    website: '',
    role: 'influencer' 
  })

  // 1. Cargar datos
  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setUserId(user.id)

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          bio: data.bio || '',
          categories: data.categories || [],
          phone: data.phone || '',
          city: data.city || '',
          country: data.country || 'Chile',
          avatar_url: data.avatar_url,
          
          instagram_handle: data.instagram_handle || '',
          tiktok_handle: data.tiktok_handle || '',
          facebook_handle: data.facebook_handle || '',
          
          instagram_url: data.instagram_url || '',
          tiktok_url: data.tiktok_url || '',
          facebook_url: data.facebook_url || '',
          
          website: data.website || '',
          role: data.role || 'influencer'
        })
      }
      setLoading(false)
    }

    getProfile()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleCategory = (category: string) => {
    setFormData(prev => {
      const exists = prev.categories.includes(category);
      if (exists) return { ...prev, categories: prev.categories.filter(c => c !== category) };
      return { ...prev, categories: [...prev.categories, category] };
    });
  };

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({ ...formData })
      .eq('id', userId)

    setSaving(false)
    
    if (error) {
      console.error(error)
      alert('Error al guardar')
    } else {
      router.push('/dashboard') 
    }
  }

  if (loading) return <div className="p-8 text-center animate-pulse">Cargando perfil...</div>

  // Lógica para detectar si es marca
  const isBrand = formData.role === 'brand';

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-500"/>
        </Link>
        <div>
            <h1 className="text-3xl font-bold text-[var(--color-brand-dark)]">
                {isBrand ? 'Perfil de Empresa' : 'Editar Perfil'}
            </h1>
            <p className="text-gray-500">
                {isBrand 
                    ? 'Esta información será visible para los influencers.' 
                    : 'Completa tu información para destacar ante las marcas.'}
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA (FOTO/LOGO) */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <h3 className="font-bold text-gray-700 mb-4">{isBrand ? 'Logo de la Marca' : 'Tu Foto'}</h3>
            <AvatarUpload 
              uid={userId || ''}
              url={formData.avatar_url}
              size={150}
              onUpload={(url) => setFormData(prev => ({ ...prev, avatar_url: url }))}
            />
            <p className="text-xs text-gray-400 mt-4">Recomendado: 500x500px</p>
            {/* Alerta visual si es marca y no tiene logo */}
            {isBrand && !formData.avatar_url && (
                <p className="text-xs text-red-500 font-bold mt-2 animate-pulse">¡Sube tu logo para dar confianza!</p>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA (DATOS) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* SECCIÓN 1: DATOS BÁSICOS */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              {isBrand ? <Building2 size={20} className="text-[var(--color-brand-orange)]" /> : <Hash size={20} className="text-[var(--color-brand-orange)]" />}
              {isBrand ? 'Información de la Empresa' : 'Sobre Ti'}
            </h2>
            
            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isBrand ? 'Nombre de la Marca' : 'Nombre Completo'}
                </label>
                <input 
                  type="text" name="full_name" value={formData.full_name} onChange={handleChange}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none"
                  placeholder={isBrand ? "Ej. Adidas Chile" : "Ej. Juan Pérez"}
                />
              </div>

              {/* Categorías */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">
                    {isBrand ? 'Industria / Nicho' : 'Tipo de Contenido'}
                </label>
                <div 
                    className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl flex flex-wrap gap-2 transition-all focus-within:bg-white focus-within:border-[var(--color-brand-orange)]"
                    onMouseEnter={() => setFocusedField('categories')}
                    onMouseLeave={() => setFocusedField(null)}
                >
                    {CATEGORIES.map((cat) => {
                        const isSelected = formData.categories.includes(cat);
                        return (
                            <button
                                key={cat} type="button" onClick={() => toggleCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isSelected ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isBrand ? 'Descripción de la Empresa' : 'Biografía Corta'}
                </label>
                <textarea 
                  name="bio" rows={3} value={formData.bio} onChange={handleChange}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none"
                  placeholder={isBrand ? "Somos una empresa líder en..." : "Cuéntanos sobre ti..."}
                />
              </div>

              {/* SOLO MARCAS: SITIO WEB */}
              {isBrand && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web Oficial</label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                        <input 
                        type="text" name="website" value={formData.website} onChange={handleChange}
                        className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none"
                        placeholder="https://miempresa.com"
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Fundamental para verificar tu marca.</p>
                  </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 2: UBICACIÓN Y CONTACTO */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <MapPin size={20} className="text-green-500" />
              Ubicación y Contacto
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Ciudad" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-green-100 outline-none" />
              <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="País" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-green-100 outline-none" />
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Teléfono de contacto" className="md:col-span-2 w-full p-3 border border-gray-200 rounded-xl focus:ring-green-100 outline-none" />
            </div>
          </div>

          {/* SECCIÓN 3: REDES SOCIALES (SOLO INFLUENCER) */}
          {!isBrand && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Globe size={20} className="text-blue-500" />
                  Tus Redes Sociales
                </h2>
                <p className="text-sm text-gray-500 mb-6">Agrega tu usuario y el enlace directo a tu perfil.</p>
                
                <div className="space-y-6">
                  
                  {/* INSTAGRAM */}
                  <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                    <div className="flex items-center gap-2 mb-3 text-pink-700 font-bold"><Instagram size={18} /> Instagram</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-pink-400 font-bold ml-1">Usuario</label>
                            <input type="text" name="instagram_handle" value={formData.instagram_handle} onChange={handleChange} className="w-full p-3 bg-white border border-pink-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200" placeholder="@usuario"/>
                        </div>
                        <div>
                            <label className="text-xs text-pink-400 font-bold ml-1 flex items-center gap-1"><LinkIcon size={10}/> URL Perfil</label>
                            <input type="text" name="instagram_url" value={formData.instagram_url} onChange={handleChange} className="w-full p-3 bg-white border border-pink-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200" placeholder="https://instagram.com/..."/>
                        </div>
                    </div>
                  </div>
                  
                  {/* TIKTOK */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-3 text-gray-800 font-bold"><span>Tk</span> TikTok</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 font-bold ml-1">Usuario</label>
                            <input type="text" name="tiktok_handle" value={formData.tiktok_handle} onChange={handleChange} className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-300" placeholder="@usuario"/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold ml-1 flex items-center gap-1"><LinkIcon size={10}/> URL Perfil</label>
                            <input type="text" name="tiktok_url" value={formData.tiktok_url} onChange={handleChange} className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-300" placeholder="https://tiktok.com/..."/>
                        </div>
                    </div>
                  </div>

                  {/* FACEBOOK */}
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold"><Facebook size={18} /> Facebook</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-blue-400 font-bold ml-1">Usuario</label>
                            <input type="text" name="facebook_handle" value={formData.facebook_handle} onChange={handleChange} className="w-full p-3 bg-white border border-blue-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200" placeholder="Usuario"/>
                        </div>
                        <div>
                            <label className="text-xs text-blue-400 font-bold ml-1 flex items-center gap-1"><LinkIcon size={10}/> URL Perfil</label>
                            <input type="text" name="facebook_url" value={formData.facebook_url} onChange={handleChange} className="w-full p-3 bg-white border border-blue-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200" placeholder="https://facebook.com/..."/>
                        </div>
                    </div>
                  </div>

                </div>
              </div>
          )}

          {/* ======================================================= */}
          {/* ✨ SECCIÓN 4: PORTAFOLIO MULTIMEDIA (SOLO INFLUENCER) ✨ */}
          {/* ======================================================= */}
          {!isBrand && userId && (
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
                {/* Header de la sección */}
                <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Video size={20} className="text-purple-600" />
                    Mejores Trabajos (Portafolio)
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    Sube hasta 4 de tus mejores videos para que las marcas vean tu talento.
                </p>

                {/* Componente Gestor de Portafolio */}
                <PortfolioManager 
                    userId={userId} 
                    // Pasamos el handle de IG o TikTok para verificar propiedad. 
                    // Priorizamos IG, si no hay, usamos TikTok.
                    userHandle={formData.instagram_handle || formData.tiktok_handle || ''} 
                />
             </div>
          )}

          <div className="flex justify-end pt-4">
            <button 
              onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-[var(--color-brand-dark)] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:bg-[var(--color-brand-orange)] transition-all transform hover:-translate-y-1 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : <><Save size={20} /> Guardar Cambios</>}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}