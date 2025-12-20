'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Check, X, Briefcase, Calendar, MessageSquare } from 'lucide-react';

// URL base de tu proyecto Supabase (la saqué de tus capturas de error anteriores)
const SUPABASE_PROJECT_URL = "https://amciorpzfsiyhwraiyum.supabase.co";

export default function CandidatesPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Buscamos todas las campañas de esta marca
    const { data: myCampaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('brand_id', user.id);

    if (!myCampaigns || myCampaigns.length === 0) {
      setLoading(false);
      return;
    }

    const campaignIds = myCampaigns.map(c => c.id);

    // 2. Buscamos las postulaciones a esas campañas
    // Usamos 'join' para traer los datos del Influencer y el título de la Campaña
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        influencer:profiles(*),
        campaign:campaigns(title, budget)
      `)
      .in('campaign_id', campaignIds)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching candidates:', error);
    
    setApplications(data || []);
    setLoading(false);
  };

  // Función para Aceptar o Rechazar
  const handleStatusChange = async (appId: string, newStatus: string) => {
    // 1. Actualización Optimista (para que se sienta instantáneo en la UI)
    setApplications(prev => prev.map(app => 
        app.id === appId ? { ...app, status: newStatus } : app
    ));

    // 2. Actualización Real en Base de Datos
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', appId);

    if (error) {
      alert('Hubo un error al actualizar');
      // Si falla, revertimos el cambio (opcional, pero buena práctica)
      fetchCandidates(); 
    }
  };

  // Helper para construir la URL del avatar
  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; // Si ya es una URL completa (ej. Google Auth)
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/avatars/${path}`;
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-orange)]"></div>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-20">
      
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-brand-dark)]">Postulaciones</h1>
          <p className="text-gray-500 mt-1">Gestiona el talento para tus campañas.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm text-sm font-medium text-gray-600">
           Total: <span className="text-[var(--color-brand-orange)] font-bold">{applications.length}</span>
        </div>
      </div>

      {applications.length === 0 ? (
        // ESTADO VACÍO
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
             📭
           </div>
           <h3 className="text-xl font-bold text-gray-800">Bandeja vacía</h3>
           <p className="text-gray-400 max-w-md mx-auto mt-2">
             Aún no has recibido postulaciones. Asegúrate de que tus campañas estén activas y sean atractivas.
           </p>
        </div>
      ) : (
        // LISTA DE CANDIDATOS
        <div className="space-y-4">
          {applications.map((app) => (
            <div 
              key={app.id} 
              className={`bg-white p-6 rounded-2xl shadow-sm border transition-all duration-300
                ${app.status === 'pending' ? 'border-gray-100 hover:shadow-md' : ''}
                ${app.status === 'accepted' ? 'border-green-200 bg-green-50/30' : ''}
                ${app.status === 'rejected' ? 'border-red-100 bg-red-50/30 opacity-75' : ''}
              `}
            >
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                
                {/* Lado Izquierdo: Info Influencer */}
                <div className="flex items-center gap-5 flex-1">
                  
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm flex-shrink-0 relative">
                     {app.influencer.avatar_url ? (
                        <img 
                          src={getAvatarUrl(app.influencer.avatar_url) || ''} 
                          alt={app.influencer.full_name}
                          className="w-full h-full object-cover"
                        />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400"><User /></div>
                     )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg text-gray-800">{app.influencer.full_name}</h3>
                      
                      {/* Badge de Estado */}
                      {app.status === 'pending' && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-bold border border-yellow-200">Pendiente</span>}
                      {app.status === 'accepted' && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold border border-green-200 flex items-center gap-1"><Check size={12}/> Aceptado</span>}
                      {app.status === 'rejected' && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold border border-red-200">Rechazado</span>}
                    </div>
                    
                    <div className="text-sm text-gray-500 flex flex-col sm:flex-row gap-1 sm:gap-4 mt-1.5">
                       <span className="flex items-center gap-1.5">
                          <Briefcase size={14} className="text-[var(--color-brand-orange)]"/> 
                          Para: <span className="font-medium text-gray-700">{app.campaign.title}</span>
                       </span>
                       <span className="flex items-center gap-1.5">
                          <Calendar size={14}/> {new Date(app.created_at).toLocaleDateString()}
                       </span>
                    </div>

                    {/* Mensaje opcional (si existiera en el futuro) */}
                    {app.message && (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg flex gap-2 items-start">
                        <MessageSquare size={14} className="mt-0.5 text-gray-400"/>
                        "{app.message}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Lado Derecho: Acciones */}
                {app.status === 'pending' ? (
                  <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 pl-20 md:pl-0">
                    <button 
                      onClick={() => handleStatusChange(app.id, 'rejected')}
                      className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2"
                      title="Rechazar postulación"
                    >
                      <X size={18} /> <span className="md:hidden">Rechazar</span>
                    </button>
                    
                    <button 
                      onClick={() => handleStatusChange(app.id, 'accepted')}
                      className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--color-brand-dark)] hover:bg-green-600 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <Check size={18} /> Aceptar Candidato
                    </button>
                  </div>
                ) : (
                  // Si ya no está pendiente, mostrar texto discreto
                  <div className="text-right hidden md:block">
                     <span className="text-xs text-gray-400 italic">
                        Decisión tomada el {new Date().toLocaleDateString()}
                     </span>
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}