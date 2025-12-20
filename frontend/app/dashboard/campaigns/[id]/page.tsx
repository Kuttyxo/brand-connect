'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  ArrowLeft, Calendar, DollarSign, MapPin, 
  CheckCircle, Briefcase, User, Clock, AlertCircle 
} from 'lucide-react';

export default function CampaignDetailPage() {
  const { id } = useParams(); // Obtenemos el ID de la URL
  const router = useRouter();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para la postulación
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      // 1. Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        // Verificamos rol
        const { data: profile } = await supabase
           .from('profiles')
           .select('role')
           .eq('id', user.id)
           .single();
        setUserRole(profile?.role);

        // 2. Verificar si YA postuló (Solo si es influencer)
        if (profile?.role === 'influencer') {
           const { data: application } = await supabase
             .from('applications')
             .select('id')
             .eq('campaign_id', id)
             .eq('influencer_id', user.id)
             .single();
           
           if (application) setHasApplied(true);
        }
      }

      // 3. Cargar datos de la Campaña
      const { data: campData, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !campData) {
        console.error('Error cargando campaña', error);
        setLoading(false);
        return;
      }

      setCampaign(campData);

      // 4. Cargar datos de la Marca dueña de la campaña
      const { data: brandData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, is_verified, city, country')
        .eq('id', campData.brand_id)
        .single();
        
      setBrand(brandData);
      setLoading(false);
    };

    if (id) fetchCampaignDetails();
  }, [id]);

  // Función para enviar la postulación
  const handleApply = async () => {
    if (!userId || userRole !== 'influencer') return;
    
    // Confirmación simple
    if (!confirm('¿Estás seguro de que quieres postular a esta campaña? La marca recibirá tu perfil.')) return;

    setApplying(true);

    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          campaign_id: id,
          influencer_id: userId,
          status: 'pending' // Estado inicial
        });

      if (error) throw error;

      // ¡Éxito!
      setHasApplied(true);
      alert('¡Postulación enviada con éxito! 🚀');
      
    } catch (error) {
      console.error('Error postulando:', error);
      alert('Ocurrió un error al postular. Intenta nuevamente.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-brand-orange)]"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-700">Campaña no encontrada 😢</h2>
        <Link href="/dashboard/campaigns" className="text-[var(--color-brand-orange)] hover:underline mt-4 block">
           Volver al listado
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-fade-in">
      
      {/* Botón Volver */}
      <Link href="/dashboard/campaigns" className="inline-flex items-center gap-2 text-gray-500 hover:text-[var(--color-brand-dark)] transition-colors mb-6">
        <ArrowLeft size={20} />
        <span>Volver a Campañas</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA PRINCIPAL (Izquierda) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Encabezado */}
          <div>
            <div className="flex items-center gap-3 mb-2">
               <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                  {campaign.status === 'open' ? 'Activa' : 'Cerrada'}
               </span>
               {campaign.categories && campaign.categories.map((cat: string) => (
                 <span key={cat} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                   {cat}
                 </span>
               ))}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-brand-dark)] mb-4">
              {campaign.title}
            </h1>
            
            {/* Info Breve */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 border-b border-gray-100 pb-6">
              <div className="flex items-center gap-1">
                <Clock size={16} /> Publicado el {new Date(campaign.created_at).toLocaleDateString()}
              </div>
              {brand?.city && (
                <div className="flex items-center gap-1">
                   <MapPin size={16} /> {brand.city}, {brand.country}
                </div>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div className="prose max-w-none">
            <h3 className="text-xl font-bold text-gray-800 mb-3">Sobre la campaña</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {campaign.description}
            </p>
          </div>

          {/* Requisitos (Si los hubiera en la DB, por ahora simulamos visualmente que es serio) */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-6">
             <h3 className="text-lg font-bold text-yellow-800 mb-3 flex items-center gap-2">
               <AlertCircle size={20}/> Importante
             </h3>
             <ul className="space-y-2 text-yellow-900 text-sm">
               <li className="flex gap-2">
                 <span className="font-bold">•</span> Cumplir con los plazos de entrega establecidos.
               </li>
               <li className="flex gap-2">
                 <span className="font-bold">•</span> Mantener la publicación visible por al menos 30 días.
               </li>
               <li className="flex gap-2">
                 <span className="font-bold">•</span> Etiquetar a la marca correctamente.
               </li>
             </ul>
          </div>

        </div>

        {/* COLUMNA LATERAL (Derecha - Sticky) */}
        <div className="lg:col-span-1">
           <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky top-6">
              
              {/* Info Marca */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                 <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl overflow-hidden">
                    {/* Si tuviéramos foto de marca real */}
                    {brand?.avatar_url ? (
                        <img src="" alt="Brand" className="w-full h-full object-cover"/> 
                    ) : (
                        <Briefcase size={20} className="text-gray-500" />
                    )}
                 </div>
                 <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">Organizado por</p>
                    <h4 className="font-bold text-gray-800 flex items-center gap-1">
                      {brand?.full_name || 'Marca Anónima'}
                      {brand?.is_verified && (
                        <span className="text-blue-500" title="Verificado">✓</span>
                      )}
                    </h4>
                 </div>
              </div>

              {/* Presupuesto */}
              <div className="mb-8">
                 <p className="text-sm text-gray-500 mb-1">Presupuesto estimado</p>
                 <div className="flex items-center gap-2 text-3xl font-extrabold text-[var(--color-brand-dark)]">
                    <DollarSign size={28} className="text-green-500" />
                    {campaign.budget?.toLocaleString('es-CL')}
                 </div>
                 <p className="text-xs text-gray-400 mt-1">Pesos Chilenos (CLP)</p>
              </div>

              {/* Botón de Acción (EL MÁS IMPORTANTE) */}
              {userRole === 'influencer' ? (
                <button
                  onClick={handleApply}
                  disabled={hasApplied || applying || campaign.status !== 'open'}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2
                    ${hasApplied 
                      ? 'bg-green-100 text-green-700 cursor-not-allowed border border-green-200' 
                      : 'bg-[var(--color-brand-dark)] text-white hover:bg-[var(--color-brand-orange)] hover:shadow-xl hover:-translate-y-1'
                    }
                    ${(applying || campaign.status !== 'open') && 'opacity-70 cursor-not-allowed'}
                  `}
                >
                  {applying ? (
                     <>Enviando...</>
                  ) : hasApplied ? (
                     <><CheckCircle size={20}/> ¡Ya postulaste!</>
                  ) : campaign.status !== 'open' ? (
                     'Campaña Cerrada'
                  ) : (
                     'Postular Ahora'
                  )}
                </button>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-500">
                   Vista de Marca (No puedes postular a campañas)
                </div>
              )}

              <p className="text-xs text-gray-400 text-center mt-4">
                Al postular aceptas los términos y condiciones de BrandConnect.
              </p>

           </div>
        </div>

      </div>
    </div>
  );
}