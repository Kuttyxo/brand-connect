'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, CheckCircle, ShieldCheck, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';

interface Props {
  applicationId: string;
  onClose: () => void;
  onPaymentReleased: () => void;
}

export default function ReleasePaymentModal({ applicationId, onClose, onPaymentReleased }: Props) {
  const [loading, setLoading] = useState(false);
  const [agreement, setAgreement] = useState<any>(null);

  useEffect(() => {
    const fetchAgreement = async () => {
      const { data } = await supabase.from('agreements').select('*').eq('application_id', applicationId).single();
      setAgreement(data);
    };
    fetchAgreement();
  }, [applicationId]);

  const handleRelease = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error: agreeError } = await supabase.from('agreements').update({ payment_status: 'released' }).eq('application_id', applicationId);
      if (agreeError) throw agreeError;

      const { error: appError } = await supabase.from('applications').update({ status: 'completed' }).eq('id', applicationId);
      if (appError) throw appError;

      await supabase.from('messages').insert({
        application_id: applicationId,
        sender_id: user.id,
        content: `🎉 ¡PAGO LIBERADO! \n\nHe aprobado el trabajo y liberado los fondos.\nGracias por tu colaboración. ¡Espero trabajar contigo de nuevo!`
      });

      onPaymentReleased();
      onClose();
      alert('¡Fondos liberados exitosamente!');

    } catch (error: any) {
      console.error(error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getSafeUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  if (!agreement) return null;

  const safeEvidenceUrl = getSafeUrl(agreement.evidence_url);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 relative">
        
        <div className="bg-green-600 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <ShieldCheck size={48} className="mx-auto mb-2 text-green-100" />
            <h3 className="font-bold text-2xl">Aprobar y Pagar</h3>
            <p className="text-green-100 text-sm">Estás a punto de finalizar el contrato</p>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="p-6 space-y-6">
            
            {/* Sección de Evidencia con Manejo de Error */}
            <div className={`p-4 rounded-xl border transition-colors group ${safeEvidenceUrl ? 'bg-gray-50 border-gray-100 hover:bg-blue-50' : 'bg-red-50 border-red-100'}`}>
                <p className={`text-xs font-bold uppercase mb-2 ${safeEvidenceUrl ? 'text-gray-400 group-hover:text-blue-400' : 'text-red-400'}`}>
                    Evidencia Entregada
                </p>
                
                {safeEvidenceUrl ? (
                    <a 
                        href={safeEvidenceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 font-medium hover:underline truncate"
                    >
                        <ExternalLink size={16} className="shrink-0" />
                        <span className="truncate">{agreement.evidence_url}</span>
                    </a>
                ) : (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertTriangle size={16} />
                        <span>No se encontró el link de evidencia.</span>
                    </div>
                )}
            </div>

            <div className="text-center">
                <p className="text-gray-500 text-sm">Monto a liberar al Influencer</p>
                <div className="text-4xl font-black text-gray-900 mt-1">
                    ${agreement.payout_amount?.toLocaleString('es-CL')}
                </div>
            </div>

            <div className="text-xs text-center text-gray-400 px-4">
                Esta acción es irreversible. Los fondos serán transferidos inmediatamente a la cuenta del influencer.
            </div>

            <button 
                onClick={handleRelease} 
                disabled={loading}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-all flex justify-center items-center gap-2 shadow-lg hover:shadow-green-200 hover:-translate-y-0.5"
            >
                {loading ? <Loader2 className="animate-spin"/> : <> <CheckCircle size={20}/> Liberar Fondos Ahora </>}
            </button>

        </div>
      </div>
    </div>
  );
}