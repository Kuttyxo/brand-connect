'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, FileText, Target, Send, Loader2, Sparkles, LayoutTemplate, Hash, CreditCard, ShieldCheck, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// Lista de Categorías Disponibles
const CATEGORIES = [
  "Moda", "Fitness", "Humor", "Comida", "Viajes", 
  "Tecnología", "Lifestyle", "Perfumería", "Gaming", "Educación"
];

// TARIFA FIJA (MVP)
const PUBLICATION_FEE = 14990;

export default function CreateCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'payment'>('form'); // Controla el paso actual
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    budget: '',
    categories: [] as string[],
  });

  const toggleCategory = (category: string) => {
    setFormData(prev => {
      const exists = prev.categories.includes(category);
      if (exists) {
        return { ...prev, categories: prev.categories.filter(c => c !== category) };
      } else {
        return { ...prev, categories: [...prev.categories, category] };
      }
    });
    setFocusedField('categories');
  };

  // PASO 1: Validar y pasar al pago
  const handleGoToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  // PASO 2: Pagar y Publicar
  const handlePayAndPublish = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No estás autenticado');

      // Simulación de delay de pago
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error } = await supabase
        .from('campaigns')
        .insert({
          brand_id: user.id,
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements,
          budget: Number(formData.budget),
          categories: formData.categories,
          status: 'open',
          is_paid: true, // <--- CAMBIO IMPORTANTE
          payment_amount: PUBLICATION_FEE // <--- CAMBIO IMPORTANTE
        });

      if (error) throw error;
      router.push('/dashboard');
      
    } catch (error: any) {
      console.error('Error DETALLADO:', error.message || error);
      alert(`Error: ${error.message || 'Hubo un error al crear la campaña.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden selection:bg-[var(--color-brand-orange)] selection:text-white">
      
      {/* --- Fondo Decorativo --- */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--color-brand-orange)]/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        
        {/* Header de Navegación */}
        <div className="flex items-center justify-between mb-8">
            <Link 
              href="/dashboard" 
              className="group flex items-center text-sm font-semibold text-gray-500 hover:text-[var(--color-brand-dark)] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center mr-3 group-hover:border-[var(--color-brand-orange)] group-hover:text-[var(--color-brand-orange)] transition-all shadow-sm">
                <ArrowLeft size={16} />
              </div>
              {step === 'form' ? 'Volver al Dashboard' : 'Volver a Editar'}
            </Link>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-orange)] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                {step === 'form' ? 'Paso 1: Detalles' : 'Paso 2: Pago Seguro'}
            </span>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[600px]">
            
            {/* --- COLUMNA IZQUIERDA: Panel Visual --- */}
            <div className="lg:col-span-2 bg-[var(--color-brand-dark)] p-8 text-white relative flex flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-[var(--color-brand-orange)] rounded-full blur-[50px] opacity-40 animate-pulse"></div>

                <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm mb-6 border border-white/10">
                        {step === 'form' ? <Sparkles className="text-[var(--color-brand-orange)]" /> : <CreditCard className="text-[var(--color-brand-orange)]" />}
                    </div>
                    <h2 className="text-3xl font-bold leading-tight mb-4">
                        {step === 'form' ? (
                            <>
                                Crea tu próxima <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-orange)] to-orange-200">
                                    Campaña Viral
                                </span>
                            </>
                        ) : (
                            <>
                                Resumen del <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-orange)] to-orange-200">
                                    Pago Seguro
                                </span>
                            </>
                        )}
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        {step === 'form' 
                            ? "Estás a un paso de conectar con creadores auténticos. Llena los detalles clave para atraer a los mejores candidatos."
                            : "Tu campaña será visible para miles de influencers inmediatamente después de confirmar el pago."
                        }
                    </p>
                </div>

                {/* Tips contextuales Dinámicos o Tarjeta de Precio */}
                {step === 'form' ? (
                    <div className="relative z-10 mt-10 bg-white/5 rounded-2xl p-5 border border-white/5 backdrop-blur-sm transition-all duration-500">
                        <h4 className="text-[var(--color-brand-orange)] text-xs font-bold uppercase mb-2 flex items-center gap-2">
                            <LayoutTemplate size={14} /> Pro Tip
                        </h4>
                        <p className="text-xs text-gray-300 transition-all duration-300 h-10">
                            {focusedField === 'budget' 
                                ? "Un presupuesto competitivo (sobre $100.000) atrae a influencers con mejor engagement." 
                                : focusedField === 'description'
                                ? "Sé específico: ¿Qué deben hacer? ¿Cuántas historias? ¿Qué tono usar?"
                                : focusedField === 'categories'
                                ? "Selecciona los nichos más relevantes. Esto ayuda a nuestro motor de recomendación."
                                : "Usa un título corto pero pegajoso. Ej: 'Campaña Verano 2025 - Ropa Urbana'."}
                        </p>
                    </div>
                ) : (
                    <div className="relative z-10 mt-10 bg-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm animate-fade-in">
                        <p className="text-gray-400 text-xs font-bold uppercase mb-1">Total a Pagar</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-white">${PUBLICATION_FEE.toLocaleString('es-CL')}</span>
                        </div>
                        <div className="mt-4 flex flex-col gap-2 text-xs text-gray-300">
                          <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-400"/> Visibilidad por 30 días</div>
                          <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-400"/> Chat ilimitado</div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- COLUMNA DERECHA: Formulario o Pago --- */}
            <div className="lg:col-span-3 p-8 lg:p-10">
                {step === 'form' ? (
                    // --- VISTA 1: FORMULARIO (Tu código original intacto) ---
                    <form onSubmit={handleGoToPayment} className="space-y-6 animate-fade-in">
                        <div className="space-y-2 group">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Título de la Campaña</label>
                            <input
                                type="text"
                                required
                                onFocus={() => setFocusedField('title')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="Ej: Lanzamiento Sneakers Urbanos"
                                className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[var(--color-brand-orange)] focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-300 font-medium"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1 flex items-center gap-2">
                               Tipo de Contenido <span className="text-gray-400 font-normal text-xs">(Selecciona varios)</span>
                            </label>
                            <div className="relative">
                                <div className={`absolute top-4 left-4 pointer-events-none transition-colors duration-300 ${focusedField === 'categories' ? 'text-[var(--color-brand-orange)]' : 'text-gray-400'}`}>
                                    <Hash size={20} />
                                </div>
                                <div 
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl min-h-[80px] flex flex-wrap gap-2 transition-all duration-300 focus-within:bg-white focus-within:border-[var(--color-brand-orange)] focus-within:ring-4 focus-within:ring-orange-500/10"
                                    onMouseEnter={() => setFocusedField('categories')}
                                    onMouseLeave={() => setFocusedField(null)}
                                >
                                    {CATEGORIES.map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => toggleCategory(cat)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border ${formData.categories.includes(cat) ? 'bg-orange-100 text-[var(--color-brand-orange)] border-orange-200 shadow-sm transform scale-105' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-100'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Presupuesto (CLP)</label>
                                <div className="relative group">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${focusedField === 'budget' ? 'text-[var(--color-brand-orange)]' : 'text-gray-400'}`}>
                                        <DollarSign size={20} />
                                    </div>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        onFocus={() => setFocusedField('budget')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="500000"
                                        className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[var(--color-brand-orange)] focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-300 font-mono font-medium"
                                        value={formData.budget}
                                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Requisitos Cortos</label>
                                <div className="relative group">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${focusedField === 'req' ? 'text-[var(--color-brand-orange)]' : 'text-gray-400'}`}>
                                        <Target size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        onFocus={() => setFocusedField('req')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="Ej: +5k seguidores, Santiago"
                                        className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[var(--color-brand-orange)] focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-300"
                                        value={formData.requirements}
                                        onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Detalles del Proyecto</label>
                            <div className="relative">
                                <div className={`absolute top-4 left-4 pointer-events-none transition-colors duration-300 ${focusedField === 'description' ? 'text-[var(--color-brand-orange)]' : 'text-gray-400'}`}>
                                    <FileText size={20} />
                                </div>
                                <textarea
                                    required
                                    rows={4}
                                    onFocus={() => setFocusedField('description')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Describe qué buscas: tipo de contenido, fechas, inspiración..."
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[var(--color-brand-orange)] focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-300 resize-none leading-relaxed"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full relative overflow-hidden group bg-[var(--color-brand-dark)] text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20 hover:-translate-y-1 active:scale-[0.99]"
                            >
                                <div className="relative z-10 flex items-center justify-center gap-2">
                                    <Send size={20} className="group-hover:translate-x-1 transition-transform" />
                                    <span className="tracking-wide">CONTINUAR AL PAGO</span>
                                </div>
                            </button>
                        </div>
                    </form>
                ) : (
                    // --- VISTA 2: PAGO (Mantiene estética) ---
                    <div className="space-y-8 animate-fade-in h-full flex flex-col justify-center">
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                          <h3 className="text-blue-900 font-bold text-lg mb-2 flex items-center gap-2"><ShieldCheck size={20}/> Pago Seguro</h3>
                          <p className="text-blue-700/80 text-sm">Estás a punto de pagar <strong>${PUBLICATION_FEE.toLocaleString('es-CL')}</strong> para publicar "{formData.title}".</p>
                        </div>

                        {/* Simulación de Tarjeta Premium */}
                        <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden transform transition-transform hover:scale-[1.02] duration-300">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                           <div className="flex justify-between items-center mb-8">
                              <div className="text-xs opacity-70">Tarjeta de Crédito</div>
                              <CreditCard />
                           </div>
                           <div className="text-xl font-mono tracking-widest mb-4">**** **** **** 4242</div>
                           <div className="flex justify-between">
                              <div>
                                <div className="text-[10px] opacity-70">TITULAR</div>
                                <div className="text-sm font-bold">MARCA DEMO</div>
                              </div>
                              <div>
                                <div className="text-[10px] opacity-70">EXPIRA</div>
                                <div className="text-sm font-bold">12/28</div>
                              </div>
                           </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                           <button onClick={() => setStep('form')} className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                              Volver
                           </button>
                           <button onClick={handlePayAndPublish} disabled={loading} className="flex-[2] bg-[var(--color-brand-orange)] text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition-all shadow-lg hover:shadow-orange-200 flex justify-center items-center gap-2">
                              {loading ? <Loader2 className="animate-spin" /> : `Pagar $${PUBLICATION_FEE.toLocaleString('es-CL')}`}
                           </button>
                        </div>
                        
                        <p className="text-center text-xs text-gray-400">
                          Este es un entorno de demostración. No se realizará ningún cargo real.
                        </p>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}