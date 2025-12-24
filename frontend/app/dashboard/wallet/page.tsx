'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Wallet, TrendingUp, Clock, ArrowUpRight, 
  CreditCard, DollarSign, AlertCircle, Building, CheckCircle2, XCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Datos Financieros
  const [balance, setBalance] = useState({
    totalEarned: 0,    // Todo lo ganado históricamente (Released)
    pendingRelease: 0, // Dinero en custodia (Held)
    withdrawn: 0,      // Ya pagado (Approved)
    requested: 0,      // Solicitado (Pending)
    available: 0       // Lo que pueden retirar ahora
  });

  const [payouts, setPayouts] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState('');
  const [amountToWithdraw, setAmountToWithdraw] = useState('');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);

  const router = useRouter();

  const fetchWalletData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Obtener GANANCIAS (Agreements Released/Held)
      // Nota: Buscamos agreements a través de applications
      const { data: earningsData } = await supabase
        .from('agreements')
        .select(`payout_amount, payment_status, applications!inner(influencer_id)`)
        .eq('applications.influencer_id', user.id);

      let totalEarned = 0;
      let pendingRelease = 0;

      earningsData?.forEach((item: any) => {
        const amount = Number(item.payout_amount) || 0;
        if (item.payment_status === 'released') totalEarned += amount;
        if (item.payment_status === 'held') pendingRelease += amount;
      });

      // 2. Obtener RETIROS (Payouts)
      const { data: payoutsData } = await supabase
        .from('payouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setPayouts(payoutsData || []);

      let withdrawn = 0;
      let requested = 0;

      payoutsData?.forEach((p: any) => {
        const amount = Number(p.amount) || 0;
        if (p.status === 'approved') withdrawn += amount;
        if (p.status === 'pending') requested += amount;
        // Si es 'rejected', el dinero vuelve al saldo, así que no lo sumamos aquí
      });

      // 3. CALCULAR DISPONIBLE
      // Disponible = (Ganado - Retirado - Solicitado)
      const available = totalEarned - withdrawn - requested;

      setBalance({
        totalEarned,
        pendingRelease,
        withdrawn,
        requested,
        available: Math.max(0, available) // Evitar negativos por seguridad
      });

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const amount = Number(amountToWithdraw);

    if (amount <= 0 || amount > balance.available) {
        alert("Monto inválido. Revisa tu saldo disponible.");
        setSubmitting(false);
        return;
    }

    if (!bankDetails.trim()) {
        alert("Ingresa tus datos bancarios.");
        setSubmitting(false);
        return;
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No usuario");

        const { error } = await supabase.from('payouts').insert({
            user_id: user.id,
            amount: amount,
            bank_details: bankDetails,
            status: 'pending'
        });

        if (error) throw error;

        alert("✅ Solicitud enviada con éxito.");
        setAmountToWithdraw('');
        setShowWithdrawForm(false);
        fetchWalletData(); // Recargar datos

    } catch (error: any) {
        alert("Error: " + error.message);
    } finally {
        setSubmitting(false);
    }
  };

  const formatMoney = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando Billetera...</div>;

  return (
    <div className="animate-fade-in pb-20 max-w-5xl mx-auto">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-[var(--color-brand-dark)]">Billetera</h1>
            <p className="text-gray-500">Gestiona tus ganancias y retiros.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        
        {/* TARJETA PRINCIPAL (SALDO) */}
        <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-2xl p-8 flex flex-col justify-between min-h-[220px]">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={120}/></div>
            
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-gray-400 font-medium mb-1 uppercase tracking-wider text-xs">Saldo Disponible</p>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight">{formatMoney(balance.available)}</h2>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-2 rounded-lg">
                    <CreditCard size={24} className="text-white"/>
                </div>
            </div>

            <div className="relative z-10 mt-6 pt-6 border-t border-white/10 flex gap-8">
                <div>
                    <p className="text-xs text-gray-400 mb-1">En Custodia (Held)</p>
                    <p className="font-bold text-lg flex items-center gap-1 text-yellow-400">
                        <Clock size={14}/> {formatMoney(balance.pendingRelease)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 mb-1">Total Retirado</p>
                    <p className="font-bold text-lg text-green-400">
                         {formatMoney(balance.withdrawn)}
                    </p>
                </div>
            </div>

            {/* Botón Solicitar Retiro */}
            <button 
                onClick={() => setShowWithdrawForm(!showWithdrawForm)}
                className="absolute bottom-8 right-8 bg-[var(--color-brand-orange)] text-white hover:bg-orange-600 transition-colors px-6 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2"
            >
                {showWithdrawForm ? 'Cancelar' : 'Solicitar Retiro'} <ArrowUpRight size={18}/>
            </button>
        </div>

        {/* INFO EXTRA / FORMULARIO */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            {showWithdrawForm ? (
                <form onSubmit={handleRequestPayout} className="h-full flex flex-col animate-in fade-in slide-in-from-right">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Building size={18} className="text-[var(--color-brand-orange)]"/> Datos Bancarios</h3>
                    
                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500">Monto a Retirar</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-400">$</span>
                                <input 
                                    type="number" 
                                    value={amountToWithdraw}
                                    onChange={e => setAmountToWithdraw(e.target.value)}
                                    className="w-full pl-6 p-2 bg-gray-50 border border-gray-200 rounded-lg font-mono font-bold outline-none focus:ring-2 focus:ring-orange-200"
                                    placeholder="0"
                                    max={balance.available}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 text-right">Máx: {formatMoney(balance.available)}</p>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-500">Cuenta de Destino</label>
                            <textarea 
                                value={bankDetails}
                                onChange={e => setBankDetails(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-200 resize-none h-24"
                                placeholder="Banco, Tipo de Cuenta, Número, RUT, Email..."
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={submitting || balance.available <= 0}
                        className="w-full mt-4 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Enviando...' : 'Confirmar Retiro'}
                    </button>
                </form>
            ) : (
                <div className="h-full flex flex-col justify-center items-center text-center text-gray-400">
                    <div className="p-4 bg-gray-50 rounded-full mb-3"><DollarSign size={32}/></div>
                    <p className="text-sm font-medium text-gray-600">¿Listo para cobrar?</p>
                    <p className="text-xs mt-1 max-w-[200px]">Presiona "Solicitar Retiro" para transferir tus ganancias a tu cuenta.</p>
                </div>
            )}
        </div>
      </div>

      {/* HISTORIAL DE RETIROS */}
      <h3 className="font-bold text-xl text-gray-800 mb-4">Historial de Transacciones</h3>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {payouts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">Aún no has realizado retiros.</div>
          ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                        <tr>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Monto</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Detalle</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {payouts.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-700">
                                    {new Date(p.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-900">
                                    {formatMoney(p.amount)}
                                </td>
                                <td className="px-6 py-4">
                                    {p.status === 'approved' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold"><CheckCircle2 size={12}/> Pagado</span>}
                                    {p.status === 'pending' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold"><Clock size={12}/> Pendiente</span>}
                                    {p.status === 'rejected' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold"><XCircle size={12}/> Rechazado</span>}
                                </td>
                                <td className="px-6 py-4 text-right text-xs text-gray-400 font-mono">
                                    ID: {p.id.slice(0,8)}
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
}