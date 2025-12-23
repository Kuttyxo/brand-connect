'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, CheckCircle, XCircle, MessageSquare, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 1. Cargar solo las disputas
  const fetchDisputes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        brand:campaigns(title, brand:profiles(full_name)),
        influencer:profiles(full_name),
        agreement:agreements(*)
      `)
      .eq('status', 'disputed'); // SOLO TRAE DISPUTAS

    if (error) console.error(error);
    setDisputes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  // 2. Ejecutar la sentencia (Llamar a la función SQL)
  const handleResolution = async (appId: string, decision: 'brand_wins' | 'influencer_wins') => {
    if (!confirm('¿Estás seguro de tu veredicto? Esta acción es irreversible.')) return;
    
    setProcessingId(appId);
    try {
      const { error } = await supabase.rpc('resolve_dispute', {
        target_app_id: appId,
        decision: decision
      });

      if (error) throw error;

      alert('Veredicto aplicado correctamente.');
      fetchDisputes(); // Recargar lista

    } catch (error: any) {
      console.error(error);
      alert('Error: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-10 text-center">Cargando casos...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
            <div className="bg-red-600 p-3 rounded-xl text-white shadow-lg">
                <ShieldAlert size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-gray-900">Panel de Disputas</h1>
                <p className="text-gray-500">Sistema de Resolución de Conflictos (Admin)</p>
            </div>
        </div>

        {disputes.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center shadow-sm border border-gray-200">
                <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-800">Todo en orden</h3>
                <p className="text-gray-400">No hay disputas activas en este momento.</p>
            </div>
        ) : (
            <div className="grid gap-6">
                {disputes.map((caseItem) => (
                    <div key={caseItem.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                        
                        {/* Header del Caso */}
                        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
                            <span className="font-mono text-sm opacity-50">CASO ID: {caseItem.id.slice(0,8)}</span>
                            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                                REQUIERE ATENCIÓN
                            </span>
                        </div>

                        <div className="p-6 grid md:grid-cols-2 gap-8">
                            
                            {/* Columna Izquierda: Detalles */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Campaña</h4>
                                    <p className="font-bold text-lg">{caseItem.brand.title}</p>
                                    <p className="text-sm text-gray-500">Presupuesto en juego: <span className="text-green-600 font-bold">${caseItem.agreement?.total_amount?.toLocaleString('es-CL')}</span></p>
                                </div>

                                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400">Demandante (Marca)</p>
                                        <p className="text-sm font-semibold">{caseItem.brand.brand.full_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-400">Demandado (Influencer)</p>
                                        <p className="text-sm font-semibold">{caseItem.influencer.full_name}</p>
                                    </div>
                                </div>

                                {/* Link a la Evidencia */}
                                {caseItem.agreement?.evidence_url && (
                                    <a 
                                        href={caseItem.agreement.evidence_url.startsWith('http') ? caseItem.agreement.evidence_url : `https://${caseItem.agreement.evidence_url}`} 
                                        target="_blank"
                                        className="flex items-center gap-2 text-blue-600 hover:underline bg-blue-50 p-3 rounded-lg text-sm font-medium"
                                    >
                                        <ExternalLink size={16}/> Ver Evidencia Entregada
                                    </a>
                                )}
                                
                                <Link 
                                    href={`/dashboard/chat/${caseItem.id}`}
                                    className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-bold transition-colors"
                                >
                                    <MessageSquare size={18}/> Investigar Chat
                                </Link>
                            </div>

                            {/* Columna Derecha: Sentencia */}
                            <div className="flex flex-col justify-center border-l border-gray-100 pl-8 space-y-4">
                                <h4 className="text-center font-bold text-gray-900 mb-2">Dictar Sentencia</h4>
                                
                                <button 
                                    onClick={() => handleResolution(caseItem.id, 'brand_wins')}
                                    disabled={!!processingId}
                                    className="group relative w-full bg-red-50 hover:bg-red-100 text-red-700 p-4 rounded-xl text-left border border-red-100 transition-all hover:shadow-md"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                            <XCircle size={24} className="text-red-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold">Gana la Marca</p>
                                            <p className="text-xs opacity-70">Reembolsar dinero y cancelar.</p>
                                        </div>
                                    </div>
                                </button>

                                <div className="text-center text-gray-300 font-bold text-xs">- O -</div>

                                <button 
                                    onClick={() => handleResolution(caseItem.id, 'influencer_wins')}
                                    disabled={!!processingId}
                                    className="group relative w-full bg-green-50 hover:bg-green-100 text-green-700 p-4 rounded-xl text-left border border-green-100 transition-all hover:shadow-md"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                            <CheckCircle size={24} className="text-green-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold">Gana el Influencer</p>
                                            <p className="text-xs opacity-70">Liberar pago y completar.</p>
                                        </div>
                                    </div>
                                </button>

                                {processingId === caseItem.id && (
                                    <div className="flex justify-center items-center gap-2 text-sm text-gray-500 mt-2">
                                        <Loader2 className="animate-spin" size={16}/> Procesando Veredicto...
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}