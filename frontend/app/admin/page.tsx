'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, MessageSquare, CheckCircle, XCircle, Search, DollarSign, LayoutDashboard, Clock, Gavel, User, AlertTriangle, FileText } from 'lucide-react';
import Link from 'next/link';

// --- COMPONENTE: VISTA GENERAL (DASHBOARD) ---
const GeneralDashboard = ({ stats, agreements, loading }: any) => (
  <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-4 bg-green-100 text-green-600 rounded-full"><DollarSign size={24} /></div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Volumen Negociado</p>
                <h3 className="text-2xl font-black text-slate-800">${stats.totalMoney.toLocaleString('es-CL')}</h3>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-full"><LayoutDashboard size={24} /></div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Acuerdos Totales</p>
                <h3 className="text-2xl font-black text-slate-800">{stats.active}</h3>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-4 bg-orange-100 text-orange-600 rounded-full"><Clock size={24} /></div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Pendientes de Firma</p>
                <h3 className="text-2xl font-black text-slate-800">{stats.pending}</h3>
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
            <div className="p-12 text-center text-slate-400">Cargando datos...</div>
        ) : (
            <table className="w-full text-left">
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
                            <td className="px-6 py-4 text-sm font-bold text-slate-800">{item.application?.campaign?.title}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                                {item.application?.campaign?.brand?.full_name} ↔ {item.application?.influencer?.username}
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
        )}
      </div>
  </div>
);

// --- COMPONENTE: PANEL DE DISPUTAS (NUEVO) ---
const DisputesPanel = () => {
    // NOTA: Como aún no tenemos base de datos de "Disputas" reales, 
    // simularé unos datos para que veas la UI. Cuando conectes la DB real, 
    // solo reemplaza 'mockDisputes' por un fetch a supabase.
    const mockDisputes = [
        { id: 1, brand: "Adidas Chile", influencer: "@kutty_dev", reason: "Influencer no entregó a tiempo", amount: 150000, status: "open", date: "2023-12-23" },
        { id: 2, brand: "Pyme Store", influencer: "@maria_dance", reason: "Calidad del video insuficiente", amount: 45000, status: "open", date: "2023-12-22" },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 items-start">
                <AlertTriangle className="text-red-500 shrink-0 mt-1" />
                <div>
                    <h4 className="font-bold text-red-800">Zona de Resolución de Conflictos</h4>
                    <p className="text-sm text-red-600">Tienes <strong>{mockDisputes.length} disputas abiertas</strong>. Tu decisión aquí moverá el dinero de la cuenta de garantía (Escrow).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LISTA DE DISPUTAS */}
                <div className="space-y-4">
                    {mockDisputes.map(dispute => (
                        <div key={dispute.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-red-300 transition-all cursor-pointer group">
                            <div className="flex justify-between items-start mb-3">
                                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded uppercase">Disputa #{dispute.id}</span>
                                <span className="text-slate-400 text-xs">{dispute.date}</span>
                            </div>
                            <h4 className="font-bold text-slate-800 mb-1">{dispute.reason}</h4>
                            <div className="text-sm text-slate-500 flex items-center gap-2 mb-4">
                                <span className="font-semibold text-blue-600">{dispute.brand}</span> vs <span className="font-semibold text-purple-600">{dispute.influencer}</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                <span className="font-mono font-bold text-slate-700">${dispute.amount.toLocaleString('es-CL')} en juego</span>
                                <button className="text-sm font-bold text-slate-400 group-hover:text-red-500 flex items-center gap-1 transition-colors">
                                    Revisar Caso →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* DETALLE DEL CASO (SIMULACIÓN DE VISUALIZACIÓN) */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[600px]">
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-slate-800">Evidencia del Chat</h3>
                            <p className="text-xs text-slate-500">Historial completo e inalterable</p>
                        </div>
                        <button className="text-xs bg-white border border-slate-300 px-2 py-1 rounded font-bold hover:bg-slate-100">Descargar PDF</button>
                    </div>

                    {/* Chat Simulado para el Admin */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30">
                        <div className="flex flex-col items-start max-w-[80%]">
                             <span className="text-xs font-bold text-blue-600 mb-1">Adidas Chile (Marca)</span>
                             <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none text-sm text-slate-600 shadow-sm">
                                Hola, el video debía subirse ayer y no veo nada.
                             </div>
                             <span className="text-[10px] text-slate-400 mt-1">10:30 AM</span>
                        </div>
                        
                        <div className="flex flex-col items-end max-w-[80%] self-end">
                             <span className="text-xs font-bold text-purple-600 mb-1">@kutty_dev (Influencer)</span>
                             <div className="bg-purple-50 border border-purple-100 p-3 rounded-2xl rounded-tr-none text-sm text-purple-800 shadow-sm">
                                Tuve un problema con la edición, dame 2 horas más por favor.
                             </div>
                             <span className="text-[10px] text-slate-400 mt-1">10:45 AM</span>
                        </div>

                        <div className="w-full text-center my-4">
                            <span className="bg-red-100 text-red-600 text-xs px-3 py-1 rounded-full font-bold">⚠️ Disputa Iniciada por Marca</span>
                        </div>
                    </div>

                    {/* Acciones del Juez */}
                    <div className="p-4 bg-white border-t border-slate-200 space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase">Veredicto Final</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="py-3 bg-red-50 text-red-600 font-bold rounded-xl border border-red-200 hover:bg-red-100 transition-colors flex flex-col items-center justify-center gap-1">
                                <User size={16}/> Reembolsar a Marca
                                <span className="text-[10px] font-normal opacity-70">El influencer pierde el pago</span>
                            </button>
                            <button className="py-3 bg-green-50 text-green-600 font-bold rounded-xl border border-green-200 hover:bg-green-100 transition-colors flex flex-col items-center justify-center gap-1">
                                <CheckCircle size={16}/> Liberar Pago a Influencer
                                <span className="text-[10px] font-normal opacity-70">El trabajo es válido</span>
                            </button>
                        </div>
                    </div>
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
  const [stats, setStats] = useState({ totalMoney: 0, pending: 0, active: 0 });

  useEffect(() => {
    const fetchAdminData = async () => {
      const { data, error } = await supabase
        .from('agreements')
        .select(`
            *,
            application:applications (
                influencer:profiles!inner(full_name, username, email),
                campaign:campaigns!inner(title, brand:profiles!inner(full_name, email))
            )
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
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
    <div className="min-h-screen bg-slate-50 flex">
        
        {/* SIDEBAR */}
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
                    <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">2</span>
                </button>
            </nav>

            <div className="p-4 border-t border-white/10">
                <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">Sesión Segura</p>
                    <p className="text-sm font-bold text-white truncate">kuttyxodev@gmail.com</p>
                    <Link href="/dashboard" className="mt-3 block text-center text-xs font-bold text-[var(--color-brand-orange)] hover:underline">
                        Volver a la App
                    </Link>
                </div>
            </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 p-8 overflow-y-auto h-screen">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        {activeTab === 'dashboard' ? 'Resumen General' : 'Panel de Disputas'}
                    </h1>
                    <p className="text-slate-500">
                        {activeTab === 'dashboard' ? 'Bienvenido al centro de comando.' : 'Aquí es donde se hace justicia.'}
                    </p>
                </div>
                <div className="md:hidden">
                    {/* Boton hamburguesa movil si fuera necesario */}
                </div>
            </header>

            {activeTab === 'dashboard' ? (
                <GeneralDashboard stats={stats} agreements={agreements} loading={loading} />
            ) : (
                <DisputesPanel />
            )}
        </main>
    </div>
  );
}