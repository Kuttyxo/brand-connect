'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, DollarSign, Calendar, FileText, Calculator, Loader2, Sparkles, Lock } from 'lucide-react';

interface Props {
  applicationId: string;
  influencerName: string;
  onClose: () => void;
  onOfferSent: () => void;
}

// Configuración de tu Comisión (10%)
const PLATFORM_FEE_PERCENTAGE = 0.10; 

export default function CreateOfferModal({ applicationId, influencerName, onClose, onOfferSent }: Props) {
  const [loading, setLoading] = useState(false);
  
  // Estados del formulario
  const [amount, setAmount] = useState<string>('');
  const [deliverables, setDeliverables] = useState('');
  const [deadline, setDeadline] = useState('');

  // --- LÓGICA DE CARGA AUTOMÁTICA DE PRESUPUESTO ---
  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select(`
            price_proposal,
            campaign:campaigns (
                budget
            )
          `)
          .eq('id', applicationId)
          .single();

        if (error) {
            console.error("Error cargando presupuesto:", error);
            return;
        }

        if (data) {
            const campaignData = data.campaign as any;
            
            // Verificamos si vino como array o como objeto
            const campaignBudget = Array.isArray(campaignData) 
                ? campaignData[0]?.budget 
                : campaignData?.budget;

            // Prioridad: 1. Propuesta Influencer, 2. Presupuesto Campaña
            const finalAmount = data.price_proposal || campaignBudget;

            if (finalAmount) {
                setAmount(String(finalAmount));
            }
        }
      } catch (err) {
        console.error("Error en try/catch:", err);
      }
    };

    if (applicationId) {
        fetchBudget();
    }
  }, [applicationId]);
  // ------------------------------------------------

  // Cálculos en tiempo real
  const numericAmount = Number(amount) || 0;
  const fee = numericAmount * PLATFORM_FEE_PERCENTAGE;
  const payout = numericAmount - fee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // 1. Crear o Actualizar (UPSERT) el acuerdo
      const { error: agreementError } = await supabase
        .from('agreements')
        .upsert({
            application_id: applicationId,
            deliverables,
            deadline,
            total_amount: numericAmount,
            platform_fee: fee,
            payout_amount: payout,
            payment_status: 'pending'
        }, { onConflict: 'application_id' });

      if (agreementError) throw agreementError;

      // 2. Actualizar estado de la postulación
      const { error: appError } = await supabase
        .from('applications')
        .update({ status: 'offered' })
        .eq('id', applicationId);

      if (appError) throw appError;

      // 3. Enviar mensaje (CORREGIDO: Muestra el Payout Neto)
      // Usamos 'payout' en lugar de 'numericAmount' para que coincida con lo que recibe el influencer.
      const msgContent = `📝 PROPUESTA DE CONTRATO (ACTUALIZADA):\n\n💰 Tu Pago (Neto): $${payout.toLocaleString('es-CL')}\n📅 Fecha Límite: ${deadline}\n📦 Entregables: ${deliverables}\n\n(Esperando aceptación del Influencer...)`;

      await supabase.from('messages').insert({
        application_id: applicationId,
        sender_id: user.id,
        content: msgContent
      });

      onOfferSent();
      onClose();
      alert('¡Nueva propuesta enviada correctamente!');

    } catch (error: any) {
      console.error(error);
      alert('Error enviando oferta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 transform transition-all scale-100">
        
        {/* Header con Gradiente */}
        <div className="bg-gradient-to-r from-[var(--color-brand-dark)] to-gray-900 p-6 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-[var(--color-brand-orange)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-orange)]">Oferta Formal</span>
            </div>
            <h3 className="font-bold text-xl">Contratar a {influencerName}</h3>
            <p className="text-sm text-gray-400 mt-1">Define los términos finales del acuerdo.</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors text-gray-400 hover:text-white">
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Input: Entregables */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <FileText size={14}/> Entregables Claros
            </label>
            <textarea 
              required
              rows={3}
              autoFocus
              placeholder="Ej: 1 Reel de 30s + 2 Historias con Link. Mencionar @marca..."
              className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-[var(--color-brand-orange)] outline-none text-sm transition-all resize-none"
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Input: Precio (BLOQUEADO) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                <Lock size={12}/> Presupuesto Acordado
              </label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input 
                    type="text" 
                    readOnly
                    className="w-full p-3 pl-9 bg-gray-100 border-2 border-gray-100 rounded-xl text-sm font-mono font-bold text-gray-500 cursor-not-allowed outline-none select-none"
                    value={Number(amount).toLocaleString('es-CL')} 
                />
              </div>
            </div>

            {/* Input: Fecha */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <Calendar size={14}/> Fecha Entrega
              </label>
              <input 
                type="date" 
                required
                className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-[var(--color-brand-orange)] outline-none text-sm font-medium text-gray-600"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          {/* Desglose de Comisión (Transparencia) */}
          <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 space-y-3">
            <div className="flex justify-between text-xs text-gray-500">
              <span>El influencer recibe:</span>
              <span className="font-mono font-medium">${payout.toLocaleString('es-CL')}</span>
            </div>
            <div className="flex justify-between text-xs text-[var(--color-brand-orange)] font-bold">
              <span className="flex items-center gap-1"><Calculator size={12}/> Tarifa de Servicio (10%):</span>
              <span className="font-mono">${fee.toLocaleString('es-CL')}</span>
            </div>
            <div className="h-px bg-orange-200/50 w-full"></div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-900">Total a Pagar:</span>
              <span className="text-xl font-black text-gray-900">${numericAmount.toLocaleString('es-CL')}</span>
            </div>
          </div>

          {/* Botón Submit */}
          <button 
            type="submit" 
            disabled={loading || numericAmount <= 0}
            className="w-full bg-[var(--color-brand-dark)] text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all flex justify-center items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin"/> : 'Enviar Propuesta Formal'}
          </button>
        </form>
      </div>
    </div>
  );
}