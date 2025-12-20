'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter, Briefcase, DollarSign, Calendar, MapPin, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';

// --- COMPONENTE 1: VISTA PARA MARCAS (Gestor) ---
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

  if (loading) return <div className="p-10 text-center text-gray-400">Cargando tus campañas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[var(--color-brand-dark)]">Mis Campañas</h1>
        <Link href="/create-campaign">
          <button className="flex items-center gap-2 bg-[var(--color-brand-dark)] text-white px-4 py-2 rounded-lg font-bold hover:bg-[var(--color-brand-orange)] transition-colors">
            <Plus size={18} /> Crear Nueva
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                <tr key={camp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-[var(--color-brand-dark)]">{camp.title}</td>
                  <td className="px-6 py-4 text-gray-600">${camp.budget.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold 
                      ${camp.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {camp.status === 'open' ? 'Activa' : 'Cerrada'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[var(--color-brand-orange)] font-bold text-sm hover:underline">Ver Detalles</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      // Traemos campañas ABIERTAS y también datos de la marca (profiles)
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          brand:profiles(full_name, is_verified) 
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      setCampaigns(data || []);
      setLoading(false);
    };
    fetchAllCampaigns();
  }, []);

  // Filtrado en el cliente (para rapidez)
  const filteredCampaigns = campaigns.filter(camp => {
    const matchesSearch = camp.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          camp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          camp.brand?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Si la categoría es "Todas", pasa. Si no, revisamos si el array de categorias incluye la seleccionada.
    const matchesCategory = filter === 'Todas' || (camp.categories && camp.categories.includes(filter));
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Header del Marketplace */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-brand-dark)]">Explorar Campañas</h1>
          <p className="text-gray-500 mt-1">Encuentra tu próxima colaboración perfecta.</p>
        </div>
        
        {/* Buscador */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por marca o palabra clave..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-brand-orange)] outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filtros de Categoría */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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

      {/* Grid de Campañas */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
           <Filter className="mx-auto h-12 w-12 mb-4 opacity-50" />
           <p>No encontramos campañas con esos filtros. Intenta con otros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredCampaigns.map((camp) => (
            <div key={camp.id} className="group bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden">
               {/* Gradiente sutil al hacer hover */}
               <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-brand-orange)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>

               <div>
                 {/* Header Tarjeta */}
                 <div className="flex justify-between items-start mb-4">
                    <div>
                       <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                         {camp.brand?.full_name || 'Marca Confidencial'}
                       </span>
                       <h3 className="text-xl font-bold text-[var(--color-brand-dark)] leading-tight group-hover:text-[var(--color-brand-orange)] transition-colors">
                         {camp.title}
                       </h3>
                    </div>
                    <div className="bg-green-50 text-green-700 px-3 py-1 rounded-lg font-bold text-sm">
                      ${(camp.budget/1000).toFixed(0)}k
                    </div>
                 </div>

                 {/* Tags */}
                 <div className="flex flex-wrap gap-2 mb-4">
                    {camp.categories?.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-xs font-medium bg-gray-50 text-gray-600 px-2 py-1 rounded-md border border-gray-100">
                        #{tag}
                      </span>
                    ))}
                 </div>

                 <p className="text-gray-500 text-sm line-clamp-3 mb-6">
                   {camp.description}
                 </p>
               </div>

               {/* Footer Tarjeta */}
               <button className="w-full py-3 rounded-xl border-2 border-[var(--color-brand-dark)] text-[var(--color-brand-dark)] font-bold hover:bg-[var(--color-brand-dark)] hover:text-white transition-all">
                 Ver Detalles & Postular
               </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// --- PÁGINA PRINCIPAL (ROUTER) ---
export default function CampaignsPage() {
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Consultamos el rol en la tabla profiles
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (data) setRole(data.role);
      }
    };
    checkUser();
  }, []);

  if (!role) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--color-brand-orange)]" size={40} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {role === 'brand' && userId ? (
        <BrandCampaignsManager userId={userId} />
      ) : (
        <InfluencerMarketplace />
      )}
    </div>
  );
}