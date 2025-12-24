'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, MessageSquare, CheckCircle, Search, DollarSign, LayoutDashboard, Clock, Gavel, User, AlertTriangle, Loader2, Menu, XCircle, Send } from 'lucide-react';
import Link from 'next/link';

// --- COMPONENTE: VISTA GENERAL (DASHBOARD) ---
const GeneralDashboard = ({ stats, agreements, loading, error }: any) => {
  if (error) return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3 animate-fade-in">
          <XCircle size={24} />
          <div>
              <p className="font-bold">Error cargando datos:</p>
              <p className="text-sm font-mono">{error}</p>
          </div>
      </div>
  );

  return (
  <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-full"><DollarSign size={24} /></div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Volumen</p>
                <h3 className="text-xl md:text-2xl font-black text-slate-800">${stats.totalMoney.toLocaleString('es-CL')}</h3>
            </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><LayoutDashboard size={24} /></div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Acuerdos</p>
                <h3 className="text-xl md:text-2xl font-black text-slate-800">{stats.active}</h3>
            </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-full"><Clock size={24} /></div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Pendientes</p>
                <h3 className="text-xl md:text-2xl font-black text-slate-800">{stats.pending}</h3>
            </div>
        </div>
      </div>

      {/* TABLA GENERAL */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <MessageSquare size={18} className="text-slate-400"/> Últimas Negociaciones
            </h3>
        </div>
        
        {loading ? (
            <div className="p-12 text-center text-slate-400 flex justify-center"><Loader2 className="animate-spin"/></div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Campaña</th>
                            <th className="px-6 py-4">Intervinientes</th>
                            <th className="px-6 py-4">Monto</th>
                            <th className="px-6 py-4">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {agreements.map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-bold text-slate-800">{item.application?.campaign?.title || 'Sin datos'}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    <div className="flex flex-col">
                                        <span>{item.application?.campaign?.brand?.full_name || '...'}</span>
                                        <span className="text-xs text-slate-400">vs</span>
                                        <span>{item.application?.influencer?.username || '...'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono text-sm text-slate-600">${item.total_amount?.toLocaleString('es-CL')}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${item.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                        {item.payment_status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
  </div>
  );
};

// --- COMPONENTE: PANEL DE DISPUTAS (CON SENTENCIA) ---
const DisputesPanel = () => {
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState(false); // Estado para el botón de carga
    const [error, setError] = useState<string | null>(null);
    const [selectedDispute, setSelectedDispute] = useState<any>(null);
    const detailRef = useRef<HTMLDivElement>(null);

    // 1. Cargar Disputas
    useEffect(() => {
        const fetchDisputes = async () => {
            const { data, error } = await supabase
                .from('disputes')
                .select(`
                    *,
                    agreement:agreements (
                        id,
                        total_amount,
                        application_id,
                        application:applications (
                            id,
                            campaign:campaigns(brand_id, brand:profiles(full_name)),
                            influencer:profiles(id, username, full_name)
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error disputes:", error);
                setError(error.message);
            } else {
                setDisputes(data || []);
                if (data && data.length > 0) setSelectedDispute(data[0]);
            }
            setLoading(false);
        };
        fetchDisputes();
    }, []);

    const handleSelectDispute = (dispute: any) => {
        setSelectedDispute(dispute);
        setTimeout(() => {
            detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    // 2. LÓGICA DEL JUEZ (Resolución + Notificación)
    const resolveDispute = async (resolutionType: 'refunded' | 'released') => {
        if (!selectedDispute || resolving) return;
        
        const actionText = resolutionType === 'refunded' ? 'REEMBOLSAR A MARCA' : 'PAGAR A INFLUENCER';
        if (!confirm(`⚠️ DECISIÓN FINAL\n\n¿Estás seguro de fallar a favor de ${resolutionType === 'refunded' ? 'la MARCA' : 'el INFLUENCER'}?\n\nEsta acción es irreversible.`)) return;

        setResolving(true);

        try {
            const adminUser = (await supabase.auth.getUser()).data.user;
            if (!adminUser) throw new Error("Sesión expirada");

            // A. Actualizar estado de la Disputa
            const { error: disputeError } = await supabase
                .from('disputes')
                .update({ status: resolutionType })
                .eq('id', selectedDispute.id);

            if (disputeError) throw disputeError;

            // B. Actualizar el Contrato (Mover el dinero)
            const { error: agreementError } = await supabase
                .from('agreements')
                .update({ payment_status: resolutionType }) 
                .eq('id', selectedDispute.agreement_id);

            if (agreementError) throw agreementError;

            // C. Actualizar estado de la Postulación (Para cerrar el ciclo visual)
            const finalAppStatus = resolutionType === 'refunded' ? 'cancelled' : 'completed';
            await supabase.from('applications').update({ status: finalAppStatus }).eq('id', selectedDispute.agreement.application_id);

            // D. NOTIFICAR EN EL CHAT (La Sentencia) ⚖️
            const sentenceMessage = resolutionType === 'refunded' 
                ? `⚖️ [SENTENCIA] El administrador ha fallado a favor de la MARCA.\nSe ha ordenado el reembolso total de los fondos.\nEl contrato ha sido cancelado.`
                : `⚖️ [SENTENCIA] El administrador ha fallado a favor del INFLUENCER.\nSe ha validado el trabajo entregado.\nLos fondos han sido liberados.`;

            await supabase.from('messages').insert({
                application_id: selectedDispute.agreement.application_id,
                sender_id: adminUser.id,
                content: sentenceMessage
            });

            alert(`✅ Veredicto Ejecutado: ${actionText}`);
            
            // Actualizar UI localmente
            setDisputes(prev => prev.map(d => d.id === selectedDispute.id ? { ...d, status: resolutionType } : d));
            setSelectedDispute({ ...selectedDispute, status: resolutionType });

        } catch (error: any) {
            console.error(error);
            alert('Error crítico: ' + error.message);
        } finally {
            setResolving(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Cargando la corte...</div>;
    
    if (error) return (
        <div className="p-10 text-center">
            <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 inline-block text-left">
                <h3 className="font-bold flex items-center gap-2 mb-2"><XCircle/> Error Técnico</h3>
                <p className="font-mono text-sm">{error}</p>
            </div>
        </div>
    );

    if (disputes.length === 0) return (
        <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <CheckCircle className="mx-auto text-green-500 mb-2" size={40}/>
            <h3 className="text-lg font-bold text-slate-800">Sala Vacía</h3>
            <p className="text-slate-500">No hay disputas pendientes de resolución.</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-24 md:pb-0">
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 items-start">
                <AlertTriangle className="text-red-500 shrink-0 mt-1" />
                <div>
                    <h4 className="font-bold text-red-800 text-sm">Zona de Conflicto</h4>
                    <p className="text-xs text-red-600"><strong>{disputes.filter(d => d.status === 'open').length} casos activos</strong>.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LISTA DE DISPUTAS */}
                <div className="space-y-4 max-h-[400px] lg:max-h-[600px] overflow-y-auto pr-2">
                    {disputes.map(dispute => (
                        <div 
                            key={dispute.id} 
                            onClick={() => handleSelectDispute(dispute)}
                            className={`p-4 rounded-xl shadow-sm border transition-all cursor-pointer 
                                ${selectedDispute?.id === dispute.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-slate-200 hover:border-blue-200'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase 
                                    ${dispute.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {dispute.status === 'open' ? 'Activo' : 'Cerrado'}
                                </span>
                                <span className="text-slate-400 text-[10px]">{new Date(dispute.created_at).toLocaleDateString()}</span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{dispute.reason}</h4>
                            
                            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1 mb-2">
                                <span className="font-semibold text-blue-600">
                                    {dispute.agreement?.application?.campaign?.brand?.full_name || 'Marca'}
                                </span> vs 
                                <span className="font-semibold text-purple-600">
                                    {dispute.agreement?.application?.influencer?.username || 'Influencer'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                                <span className="font-mono font-bold text-xs text-slate-700">
                                    ${dispute.agreement?.total_amount?.toLocaleString('es-CL') || '0'}
                                </span>
                                {selectedDispute?.id === dispute.id && <span className="text-xs text-blue-600 font-bold">Ver →</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* DETALLE DEL CASO */}
                <div ref={detailRef} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[600px] lg:sticky lg:top-6">
                    {selectedDispute && (
                        <>
                            <div className="bg-slate-50 p-4 border-b border-slate-200">
                                <h3 className="font-bold text-slate-800 text-sm">Caso #{selectedDispute.id.slice(0,8)}</h3>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-3 italic">"{selectedDispute.reason}"</p>
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30 flex flex-col justify-center items-center text-center">
                                 {/* Aquí en un futuro podrías cargar los mensajes reales del chat */}
                                 <MessageSquare className="text-slate-200 mb-2" size={48}/>
                                 <p className="text-slate-400 text-xs">Revisa la evidencia en el chat<br/>antes de decidir.</p>
                                 
                                 <Link 
                                    href={`/dashboard/chat/${selectedDispute.agreement?.application_id}`}
                                    className="mt-4 flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm"
                                 >
                                     <Send size={12}/> Ir al Chat del Conflicto
                                 </Link>

                                 <div className="bg-yellow-50 text-yellow-700 text-xs px-3 py-1 rounded-full mt-6 border border-yellow-100 font-bold">
                                     Monto en Custodia: ${selectedDispute.agreement?.total_amount?.toLocaleString('es-CL') || '0'}
                                 </div>
                            </div>

                            {selectedDispute.status === 'open' ? (
                                <div className="p-4 bg-white border-t border-slate-200 space-y-3">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase text-center">Dictar Sentencia Final</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => resolveDispute('refunded')}
                                            disabled={resolving}
                                            className="py-3 bg-red-50 text-red-600 font-bold rounded-xl border border-red-200 hover:bg-red-100 transition-colors flex flex-col items-center justify-center gap-1 active:scale-95 disabled:opacity-50"
                                        >
                                            {resolving ? <Loader2 className="animate-spin" size={16}/> : <User size={16}/>}
                                            {resolving ? 'Procesando...' : 'Reembolsar a Marca'}
                                        </button>
                                        <button 
                                            onClick={() => resolveDispute('released')}
                                            disabled={resolving}
                                            className="py-3 bg-green-50 text-green-600 font-bold rounded-xl border border-green-200 hover:bg-green-100 transition-colors flex flex-col items-center justify-center gap-1 active:scale-95 disabled:opacity-50"
                                        >
                                            {resolving ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>}
                                            {resolving ? 'Procesando...' : 'Pagar a Influencer'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-gray-50 border-t border-gray-200 text-center">
                                    <p className="text-gray-500 font-bold text-sm">Caso Cerrado</p>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full mt-2 inline-block ${selectedDispute.status === 'refunded' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {selectedDispute.status === 'refunded' ? 'Sentencia: Reembolso a Marca' : 'Sentencia: Pago a Influencer'}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- PÁGINA PRINCIPAL ADMIN ---
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'disputes'>('dashboard');
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalMoney: 0, pending: 0, active: 0 });

  useEffect(() => {
    const fetchAdminData = async () => {
      // Pedimos datos seguros (sin email privado)
      const { data, error } = await supabase
        .from('agreements')
        .select(`
            *,
            application:applications (
                influencer:profiles!inner(full_name, username),
                campaign:campaigns!inner(title, brand:profiles!inner(full_name))
            )
        `)
        .order('created_at', { ascending: false });

      if (error) {
          console.error("Error admin dashboard:", error);
          setError(error.message);
      } else if (data) {
        setAgreements(data);
        const total = data.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
        const pending = data.filter(a => a.payment_status === 'pending').length;
        setStats({ totalMoney: total, pending, active: data.length });
      }
      setLoading(false);
    };

    fetchAdminData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        
        {/* SIDEBAR (DESKTOP) */}
        <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col sticky top-0 h-screen">
            <div className="p-8">
                <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2">
                    <ShieldAlert className="text-[var(--color-brand-orange)]" /> ADMIN
                </h2>
            </div>
            
            <nav className="flex-1 px-4 space-y-2">
                <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-[var(--color-brand-orange)] text-white shadow-lg shadow-orange-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                    <LayoutDashboard size={20} /> Dashboard
                </button>
                <button 
                    onClick={() => setActiveTab('disputes')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'disputes' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                    <Gavel size={20} /> Disputas
                </button>
            </nav>

            <div className="p-4 border-t border-white/10">
                <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">Admin</p>
                    <p className="text-sm font-bold text-white truncate">kuttyxodev</p>
                    <Link href="/dashboard" className="mt-3 block text-center text-xs font-bold text-[var(--color-brand-orange)] hover:underline">
                        Volver a App
                    </Link>
                </div>
            </div>
        </aside>

        {/* BOTTOM NAV (MOBILE) */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 text-white z-50 flex justify-around p-3 border-t border-slate-800 shadow-2xl">
            <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg ${activeTab === 'dashboard' ? 'text-[var(--color-brand-orange)]' : 'text-slate-400'}`}
            >
                <LayoutDashboard size={20} />
                <span className="text-[10px] font-bold">Dashboard</span>
            </button>
            <button 
                onClick={() => setActiveTab('disputes')}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg ${activeTab === 'disputes' ? 'text-red-500' : 'text-slate-400'}`}
            >
                <Gavel size={20} />
                <span className="text-[10px] font-bold">Disputas</span>
            </button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto h-auto md:h-screen">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                        {activeTab === 'dashboard' ? 'Resumen General' : 'Panel de Disputas'}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {activeTab === 'dashboard' ? 'Visión global del sistema.' : 'Gestión de conflictos.'}
                    </p>
                </div>
            </header>

            {activeTab === 'dashboard' ? (
                <GeneralDashboard stats={stats} agreements={agreements} loading={loading} error={error} />
            ) : (
                <DisputesPanel />
            )}
        </main>
    </div>
  );
}