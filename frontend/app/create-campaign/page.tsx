'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, FileText, Target, Send, Loader2, Sparkles, LayoutTemplate, Hash } from 'lucide-react';
import Link from 'next/link';

// Lista de Categorías Disponibles
const CATEGORIES = [
  "Moda", 
  "Fitness", 
  "Humor", 
  "Comida", 
  "Viajes", 
  "Tecnología", 
  "Lifestyle", 
  "Perfumería", 
  "Gaming", 
  "Educación"
];

export default function CreateCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    budget: '',
    categories: [] as string[], // Nuevo campo array
  });

  // Función para manejar la selección múltiple de categorías
  const toggleCategory = (category: string) => {
    setFormData(prev => {
      const exists = prev.categories.includes(category);
      if (exists) {
        // Si ya está, la quitamos
        return { ...prev, categories: prev.categories.filter(c => c !== category) };
      } else {
        // Si no está, la agregamos
        return { ...prev, categories: [...prev.categories, category] };
      }
    });
    setFocusedField('categories'); // Activamos el tip visual
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No estás autenticado');

      const { error } = await supabase
        .from('campaigns')
        .insert({
          brand_id: user.id,
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements,
          budget: Number(formData.budget),
          categories: formData.categories, // Enviamos las categorías
          status: 'open',
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
              Volver al Dashboard
            </Link>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-orange)] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                Paso 1 de 1
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
                        <Sparkles className="text-[var(--color-brand-orange)]" />
                    </div>
                    <h2 className="text-3xl font-bold leading-tight mb-4">
                        Crea tu próxima <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-orange)] to-orange-200">
                            Campaña Viral
                        </span>
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Estás a un paso de conectar con creadores auténticos. Llena los detalles clave para atraer a los mejores candidatos.
                    </p>
                </div>

                {/* Tips contextuales Dinámicos */}
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
            </div>

            {/* --- COLUMNA DERECHA: Formulario --- */}
            <div className="lg:col-span-3 p-8 lg:p-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Título */}
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

                    {/* --- NUEVO: CATEGORÍAS --- */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1 flex items-center gap-2">
                           Tipo de Contenido <span className="text-gray-400 font-normal text-xs">(Selecciona varios)</span>
                        </label>
                        <div className="relative">
                            <div className={`absolute top-4 left-4 pointer-events-none transition-colors duration-300 ${focusedField === 'categories' ? 'text-[var(--color-brand-orange)]' : 'text-gray-400'}`}>
                                <Hash size={20} />
                            </div>
                            
                            {/* Contenedor de Chips */}
                            <div 
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl min-h-[80px] flex flex-wrap gap-2 transition-all duration-300 focus-within:bg-white focus-within:border-[var(--color-brand-orange)] focus-within:ring-4 focus-within:ring-orange-500/10"
                                onMouseEnter={() => setFocusedField('categories')}
                                onMouseLeave={() => setFocusedField(null)}
                            >
                                {CATEGORIES.map((cat) => {
                                    const isSelected = formData.categories.includes(cat);
                                    return (
                                        <button
                                            key={cat}
                                            type="button" // Importante: evita que envíe el formulario
                                            onClick={() => toggleCategory(cat)}
                                            className={`
                                                px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border
                                                ${isSelected 
                                                    ? 'bg-orange-100 text-[var(--color-brand-orange)] border-orange-200 shadow-sm transform scale-105' 
                                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-100'}
                                            `}
                                        >
                                            {cat}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Grid: Presupuesto y Requisitos */}
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

                    {/* Descripción */}
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

                    {/* Botón de Acción */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative overflow-hidden group bg-[var(--color-brand-dark)] text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20 hover:-translate-y-1 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span className="tracking-wide">PUBLICANDO...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} className="group-hover:translate-x-1 transition-transform" />
                                        <span className="tracking-wide">PUBLICAR CAMPAÑA</span>
                                    </>
                                )}
                            </div>
                            {/* Efecto de brillo */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                        </button>
                    </div>

                </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}