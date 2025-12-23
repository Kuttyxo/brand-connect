'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, DollarSign, Calendar, FileText, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  applicationId: string;
  onClose: () => void;
  onDecision: (decision: 'accepted' | 'rejected') => void;
}

export default function ReviewOfferModal({ applicationId, onClose, onDecision }: Props) {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [agreement, setAgreement] = useState<any>(null);

  // 1. Cargar los detalles del contrato
  useEffect(() => {
    const fetchAgreement = async () => {
      const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .eq('application_id', applicationId)
        .single();

      if (error) {
        console.error("Error cargando contrato:", error);
        alert("No se pudo cargar la oferta.");
        onClose();
      } else {
        setAgreement(data);
      }
      setLoading(false);
    };

    fetchAgreement();
  }, [applicationId, onClose]);

  // 2. Manejar la decisión (Aceptar o Rechazar)
  const handleDecision = async (decision: 'hired' | 'rejected') => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Actualizar estado de la postulación
      // Si acepta -> 'hired' (Contratado)
      // Si rechaza -> 'accepted' (Vuelve a negociación, no rechazamos la postulación completa, solo la oferta)
      const newStatus = decision === 'hired' ? 'hired' : 'accepted';
      
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      // Enviar mensaje automático al chat
      const messageText = decision === 'hired' 
        ? `🤝 ¡TRATO CERRADO! \nHe aceptado la oferta. Comenzaré a trabajar en los entregables.`
        : `🚫 OFERTA RECHAZADA. \nNo estoy de acuerdo con los términos actuales. Sigamos negociando.`;

      await supabase.from('messages').insert({
        application_id: applicationId,
        sender_id: user.id,
        content: messageText
      });

      onDecision(decision === 'hired' ? 'accepted' : 'rejected');
      onClose();

    } catch (error: any) {
      console.error(error);
      alert('Error: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 relative">
        
        {/* Header */}
        <div className="bg-[var(--color-brand-orange)] p-6 text-white text-center">
            <h3 className="font-bold text-2xl mb-1">Revisar Propuesta</h3>
            <p className="text-orange-100 text-sm">La marca espera tu confirmación</p>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="p-6 space-y-6">
          
            {/* Tarjeta de Ganancia */}
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
                <p className="text-gray-500 text-xs font-bold uppercase mb-1">Tú Recibirás (Neto)</p>
                <div className="text-3xl font-black text-green-700 flex justify-center items-center gap-1">
                    <span className="text-lg opacity-50">$</span>
                    {agreement?.payout_amount.toLocaleString('es-CL')}
                </div>
            </div>

            {/* Detalles */}
            <div className="space-y-4">
                <div className="flex gap-3 items-start">
                    <div className="mt-1 bg-gray-100 p-2 rounded-lg text-gray-500"><FileText size={18}/></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Entregables</p>
                        <p className="text-gray-800 text-sm leading-relaxed">{agreement?.deliverables}</p>
                    </div>
                </div>

                <div className="flex gap-3 items-center">
                    <div className="bg-gray-100 p-2 rounded-lg text-gray-500"><Calendar size={18}/></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Fecha Límite</p>
                        <p className="text-gray-800 text-sm font-medium">{agreement?.deadline}</p>
                    </div>
                </div>
            </div>

            {/* Advertencia */}
            <div className="flex gap-2 items-start bg-blue-50 p-3 rounded-xl text-xs text-blue-700">
                <AlertCircle size={16} className="shrink-0 mt-0.5"/>
                <p>Al aceptar, te comprometes a entregar el contenido antes de la fecha límite. El pago se liberará cuando la marca apruebe tu trabajo.</p>
            </div>

            {/* Botones de Acción */}
            <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                    onClick={() => handleDecision('rejected')}
                    disabled={processing}
                    className="py-3 px-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors flex justify-center items-center gap-2"
                >
                    Rechazar
                </button>
                <button 
                    onClick={() => handleDecision('hired')}
                    disabled={processing}
                    className="py-3 px-4 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-green-200 transition-all flex justify-center items-center gap-2"
                >
                    {processing ? <Loader2 className="animate-spin"/> : <> <CheckCircle size={18}/> Aceptar Oferta </>}
                </button>
            </div>

        </div>
      </div>
    </div>
  );
}