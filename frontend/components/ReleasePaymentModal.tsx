'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, CheckCircle, ShieldCheck, Loader2, ExternalLink, AlertTriangle, RefreshCcw, ArrowLeft } from 'lucide-react';

interface Props {
  applicationId: string;
  onClose: () => void;
  onPaymentReleased: () => void; // Se ejecuta si paga
  onChangesRequested: () => void; // Se ejecuta si pide cambios (NUEVO)
}

export default function ReleasePaymentModal({ applicationId, onClose, onPaymentReleased, onChangesRequested }: Props) {
  const [loading, setLoading] = useState(false);
  const [agreement, setAgreement] = useState<any>(null);
  
  // Nuevo estado para controlar si estamos revisando o escribiendo feedback
  const [view, setView] = useState<'review' | 'feedback'>('review');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const fetchAgreement = async () => {
      const { data } = await supabase.from('agreements').select('*').eq('application_id', applicationId).single();
      setAgreement(data);
    };
    fetchAgreement();
  }, [applicationId]);

  // --- FUNCIÓN 1: APROBAR Y PAGAR (La que ya tenías) ---
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
        content: `🎉 ¡PAGO LIBERADO! \n\nHe aprobado el trabajo y liberado los fondos.\nGracias por tu colaboración.`
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

  // --- FUNCIÓN 2: SOLICITAR CAMBIOS (La Nueva) ---
  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setLoading(true);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No autenticado");

        // 1. "Retrocedemos" el estado a 'hired' (Contratado) para que el Influencer pueda subir trabajo de nuevo
        const { error: appError } = await supabase
            .from('applications')
            .update({ status: 'hired' })
            .eq('id', applicationId);

        if (appError) throw appError;

        // 2. Insertamos el mensaje de feedback en el chat
        await supabase.from('messages').insert({
            application_id: applicationId,
            sender_id: user.id,
            content: `⚠️ CORRECCIONES SOLICITADAS:\n\n"${feedback}"\n\nPor favor, ajusta el contenido y vuelve a subir la evidencia.`
        });

        onChangesRequested(); // Avisamos al chat que recargue
        onClose();
        alert('Feedback enviado. El influencer ha sido notificado.');

    } catch (error: any) {
        console.error(error);
        alert('Error: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  // Helper para URLs
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
        
        {/* --- VISTA 1: REVISIÓN GENERAL --- */}
        {view === 'review' && (
            <>
                <div className="bg-green-600 p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <ShieldCheck size={48} className="mx-auto mb-2 text-green-100" />
                    <h3 className="font-bold text-2xl">Revisión Final</h3>
                    <p className="text-green-100 text-sm">¿Apruebas el trabajo entregado?</p>
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Evidencia */}
                    <div className={`p-4 rounded-xl border transition-colors group ${safeEvidenceUrl ? 'bg-gray-50 border-gray-100 hover:bg-blue-50' : 'bg-red-50 border-red-100'}`}>
                        <p className={`text-xs font-bold uppercase mb-2 ${safeEvidenceUrl ? 'text-gray-400 group-hover:text-blue-400' : 'text-red-400'}`}>Evidencia Entregada</p>
                        {safeEvidenceUrl ? (
                            <a href={safeEvidenceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 font-medium hover:underline truncate">
                                <ExternalLink size={16} className="shrink-0" />
                                <span className="truncate">{agreement.evidence_url}</span>
                            </a>
                        ) : (
                            <div className="flex items-center gap-2 text-red-600 text-sm"><AlertTriangle size={16} /><span>Link no válido.</span></div>
                        )}
                    </div>

                    <div className="text-center">
                        <p className="text-gray-500 text-sm">Monto en Garantía</p>
                        <div className="text-4xl font-black text-gray-900 mt-1">${agreement.payout_amount?.toLocaleString('es-CL')}</div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        {/* Botón Aprobar */}
                        <button onClick={handleRelease} disabled={loading} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-all flex justify-center items-center gap-2 shadow-lg shadow-green-100">
                            {loading ? <Loader2 className="animate-spin"/> : <> <CheckCircle size={20}/> Aprobar y Pagar </>}
                        </button>

                        {/* Botón Solicitar Cambios */}
                        <button onClick={() => setView('feedback')} disabled={loading} className="w-full bg-white text-gray-500 border-2 border-gray-100 py-3 rounded-xl font-bold hover:bg-gray-50 hover:text-orange-600 hover:border-orange-100 transition-all flex justify-center items-center gap-2">
                            <RefreshCcw size={18}/> Solicitar Cambios
                        </button>
                    </div>
                </div>
            </>
        )}

        {/* --- VISTA 2: FORMULARIO DE FEEDBACK --- */}
        {view === 'feedback' && (
            <>
                <div className="bg-orange-500 p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <button onClick={() => setView('review')} className="absolute top-4 left-4 p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors"><ArrowLeft size={20} /></button>
                    <RefreshCcw size={48} className="mx-auto mb-2 text-orange-100" />
                    <h3 className="font-bold text-2xl">Solicitar Cambios</h3>
                    <p className="text-orange-100 text-sm">Describe qué necesita corregir el influencer</p>
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleRequestChanges} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Instrucciones de corrección</label>
                        <textarea 
                            autoFocus
                            required
                            rows={5}
                            placeholder="Ej: El audio del video está muy bajo en el segundo 15, y olvidaste mencionar el código de descuento en la descripción..."
                            className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-orange-500 outline-none text-sm transition-all resize-none"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                        />
                    </div>

                    <div className="bg-orange-50 p-3 rounded-xl flex gap-3 items-start text-xs text-orange-700">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5"/>
                        <p>Al enviar esto, el estado volverá a "Trabajo en Curso" para que el influencer pueda subir una nueva versión.</p>
                    </div>

                    <button type="submit" disabled={loading || !feedback.trim()} className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold hover:bg-orange-700 transition-all flex justify-center items-center gap-2 shadow-lg shadow-orange-100">
                        {loading ? <Loader2 className="animate-spin"/> : 'Enviar Solicitud de Cambios'}
                    </button>
                </form>
            </>
        )}

      </div>
    </div>
  );
}