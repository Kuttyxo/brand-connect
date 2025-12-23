'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, DollarSign, Calendar, FileText, Calculator, Loader2, Sparkles } from 'lucide-react';

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

      // 1. Crear el acuerdo en la base de datos (Tabla Agreements)
      const { error: agreementError } = await supabase.from('agreements').insert({
        application_id: applicationId,
        deliverables,
        deadline,
        total_amount: numericAmount,
        platform_fee: fee,
        payout_amount: payout,
        payment_status: 'pending' // Pendiente de pago
      });

      if (agreementError) throw agreementError;

      // 2. Cambiar estado de la postulación a 'offered' (Ofertado)
      const { error: appError } = await supabase
        .from('applications')
        .update({ status: 'offered' })
        .eq('id', applicationId);

      if (appError) throw appError;

      // 3. Enviar mensaje automático al chat para que quede registro
      await supabase.from('messages').insert({
        application_id: applicationId,
        sender_id: user.id,
        content: `📝 PROPUESTA DE CONTRATO:\n\n💰 Precio Total: $${numericAmount.toLocaleString('es-CL')}\n📅 Fecha Límite: ${deadline}\n📦 Entregables: ${deliverables}\n\n(Esperando aceptación del Influencer...)`
      });

      onOfferSent(); // Avisar al padre que recargue
      onClose(); // Cerrar modal
      alert('¡Propuesta enviada correctamente!');

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
              placeholder="Ej: 1 Reel de 30s + 2 Historias con Link. Mencionar @marca..."
              className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-[var(--color-brand-orange)] outline-none text-sm transition-all resize-none"
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Input: Precio */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <DollarSign size={14}/> Tu Presupuesto
              </label>
              <input 
                type="number" 
                required
                min="1000"
                placeholder="150000"
                className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-[var(--color-brand-orange)] outline-none text-sm font-mono font-bold text-gray-800"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
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