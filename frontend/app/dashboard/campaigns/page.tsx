'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter, Briefcase, Plus, Lock, Unlock, Eye, Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// --- COMPONENTE 1: VISTA PARA MARCAS (Gestor Responsivo) ---
const BrandCampaignsManager = ({ userId }: { userId: string }) => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyCampaigns = async () => {
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('brand_id', userId)
        .order('created_at', { ascending: false });
      setCampaigns(data || []);
      setLoading(false);
    };
    fetchMyCampaigns();
  }, [userId]);

  const toggleCampaignStatus = async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    const actionText = newStatus === 'closed' ? 'cerrar' : 'reabrir';

    if (!confirm(`¿Estás seguro de que deseas ${actionText} esta campaña?`)) return;

    try {
        const { error } = await supabase.from('campaigns').update({ status: newStatus }).eq('id', campaignId);
        if (error) throw error;
        setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: newStatus } : c));
    } catch (error) {
        console.error(error);
        alert('No se pudo actualizar el estado.');
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400 flex justify-center"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-[var(--color-brand-dark)]">Mis Campañas</h1>
            <p className="text-sm text-gray-500">Gestiona tus ofertas activas.</p>
        </div>
        <Link href="/create-campaign">
          <button className="flex items-center gap-2 bg-[var(--color-brand-dark)] text-white px-4 py-2 rounded-lg font-bold hover:bg-[var(--color-brand-orange)] transition-colors shadow-lg">
            <Plus size={18} /> <span className="hidden sm:inline">Crear Nueva</span>
          </button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
           <Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-4" />
           <h3 className="text-lg font-medium text-gray-900">No tienes campañas activas</h3>
           <p className="text-gray-500 mb-6">Empieza a conectar con influencers hoy mismo.</p>
           <Link href="/create-campaign" className="text-[var(--color-brand-orange)] font-bold hover:underline">
             Crear mi primera campaña
           </Link>
        </div>
      ) : (
        <>
            {/* VISTA ESCRITORIO (TABLA) */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium text-sm">
                        <tr>
                            <th className="px-6 py-4">Campaña</th>
                            <th className="px-6 py-4">Presupuesto</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {campaigns.map((camp) => (
                            <tr key={camp.id} className={`hover:bg-gray-50 transition-colors ${camp.status === 'closed' ? 'bg-gray-50/50' : ''}`}>
                                <td className="px-6 py-4">
                                    <p className={`font-medium ${camp.status === 'closed' ? 'text-gray-400' : 'text-[var(--color-brand-dark)]'}`}>{camp.title}</p>
                                </td>
                                <td className="px-6 py-4 text-gray-600">${camp.budget.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex w-fit items-center gap-1 ${camp.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {camp.status === 'open' ? 'Activa' : 'Cerrada'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <Link href={`/dashboard/campaigns/${camp.id}`} className="text-[var(--color-brand-orange)] font-bold text-sm hover:underline flex items-center gap-1">
                                            <Eye size={16}/> Ver
                                        </Link>
                                        <button onClick={() => toggleCampaignStatus(camp.id, camp.status)} className="p-2 rounded-full text-gray-400 hover:bg-gray-100" title="Cambiar estado">
                                            {camp.status === 'open' ? <Lock size={16} /> : <Unlock size={16} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* VISTA MÓVIL (TARJETAS) */}
            <div className="md:hidden space-y-4">
                {campaigns.map((camp) => (
                    <div key={camp.id} className={`bg-white p-5 rounded-2xl shadow-sm border ${camp.status === 'closed' ? 'border-gray-100 bg-gray-50' : 'border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <h3 className={`font-bold text-lg ${camp.status === 'closed' ? 'text-gray-400' : 'text-[var(--color-brand-dark)]'}`}>
                                {camp.title}
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${camp.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                {camp.status === 'open' ? 'Activa' : 'Cerrada'}
                            </span>
                        </div>
                        
                        <p className="text-gray-500 text-sm mb-4">Presupuesto: <span className="font-bold text-gray-700">${camp.budget.toLocaleString()}</span></p>
                        
                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                            <button 
                                onClick={() => toggleCampaignStatus(camp.id, camp.status)}
                                className="text-gray-400 text-sm flex items-center gap-1"
                            >
                                {camp.status === 'open' ? <><Lock size={14}/> Cerrar</> : <><Unlock size={14}/> Abrir</>}
                            </button>
                            
                            <Link href={`/dashboard/campaigns/${camp.id}`} className="text-[var(--color-brand-orange)] font-bold flex items-center gap-1">
                                Ver Detalles <ChevronRight size={16}/>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </>
      )}
    </div>
  );
};

// --- COMPONENTE 2: VISTA PARA INFLUENCERS (Marketplace) ---
const InfluencerMarketplace = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');

  const CATEGORIES = ["Todas", "Moda", "Fitness", "Humor", "Comida", "Tech", "Viajes", "Tecnología", "Lifestyle", "Perfumería", "Gaming", "Educación"];

  useEffect(() => {
    const fetchAllCampaigns = async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`*, brand:profiles(full_name, is_verified)`)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      setCampaigns(data || []);
      setLoading(false);
    };
    fetchAllCampaigns();
  }, []);

  const filteredCampaigns = campaigns.filter(camp => {
    const matchesSearch = camp.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          camp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          camp.brand?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filter === 'Todas' || (camp.categories && camp.categories.includes(filter));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-brand-dark)]">Explorar Campañas</h1>
          <p className="text-gray-500 mt-1">Encuentra tu próxima colaboración perfecta.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por marca..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-brand-orange)] outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filtros Mobile (Scroll Horizontal) */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all
              ${filter === cat 
                ? 'bg-[var(--color-brand-dark)] text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
           <Filter className="mx-auto h-12 w-12 mb-4 opacity-50" />
           <p>No encontramos campañas con esos filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredCampaigns.map((camp) => (
            <div key={camp.id} className="group bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-brand-orange)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
               <div>
                 <div className="flex justify-between items-start mb-4">
                   <div>
                       <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">{camp.brand?.full_name || 'Marca'}</span>
                       <h3 className="text-xl font-bold text-[var(--color-brand-dark)] leading-tight group-hover:text-[var(--color-brand-orange)] transition-colors">{camp.title}</h3>
                   </div>
                   <div className="bg-green-50 text-green-700 px-3 py-1 rounded-lg font-bold text-sm">${(camp.budget/1000).toFixed(0)}k</div>
                 </div>
                 <div className="flex flex-wrap gap-2 mb-4">
                    {camp.categories?.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-xs font-medium bg-gray-50 text-gray-600 px-2 py-1 rounded-md border border-gray-100">#{tag}</span>
                    ))}
                 </div>
                 <p className="text-gray-500 text-sm line-clamp-3 mb-6">{camp.description}</p>
               </div>
               <Link href={`/dashboard/campaigns/${camp.id}`} className="w-full">
                 <button className="w-full py-3 rounded-xl border-2 border-[var(--color-brand-dark)] text-[var(--color-brand-dark)] font-bold hover:bg-[var(--color-brand-dark)] hover:text-white transition-all">
                   Ver Detalles & Postular
                 </button>
               </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function CampaignsPage() {
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (data) setRole(data.role);
      }
    };
    checkUser();
  }, []);

  if (!role) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[var(--color-brand-orange)]" size={40} /></div>;

  return (
    <div className="animate-fade-in">
      {role === 'brand' && userId ? <BrandCampaignsManager userId={userId} /> : <InfluencerMarketplace />}
    </div>
  );
}