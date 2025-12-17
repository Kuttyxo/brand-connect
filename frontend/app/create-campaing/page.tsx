'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, FileText, Target, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    budget: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No estás autenticado');

      // 2. Insertar en Supabase
      const { error } = await supabase
        .from('campaigns')
        .insert({
          brand_id: user.id,
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements,
          budget: Number(formData.budget),
          status: 'open',
        });

      if (error) throw error;

      // 3. Éxito: Volver al Dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Error creando campaña:', error);
      alert('Hubo un error al crear la campaña. Revisa la consola.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        
        {/* Botón Volver */}
        <Link href="/dashboard" className="inline-flex items-center text-gray-500 hover:text-[var(--color-brand-dark)] mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Volver al Dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          
          {/* Encabezado del Formulario */}
          <div className="bg-[var(--color-brand-dark)] p-8 text-center relative overflow-hidden">
             {/* Decoración de fondo */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-brand-orange)]/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
             
             <h2 className="text-3xl font-bold text-white relative z-10">Nueva Campaña</h2>
             <p className="text-gray-300 mt-2 relative z-10">Encuentra a los influencers perfectos para tu marca</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título de la Campaña</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ej: Lanzamiento Zapatillas Urbanas 2025"
                  className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:border-transparent outline-none transition-all"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
            </div>

            {/* Presupuesto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Presupuesto Total (CLP)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign size={20} className="text-gray-400" />
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="500000"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:border-transparent outline-none transition-all"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción del Proyecto</label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <FileText size={20} className="text-gray-400" />
                </div>
                <textarea
                  required
                  rows={4}
                  placeholder="Cuéntales qué necesitas: 3 historias, 1 reel, estilo de vida..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:border-transparent outline-none transition-all resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            {/* Requisitos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Requisitos (Opcional)</label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <Target size={20} className="text-gray-400" />
                </div>
                <textarea
                  rows={3}
                  placeholder="Ej: Solo Santiago, +5k seguidores, perfil de moda..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:border-transparent outline-none transition-all resize-none"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                />
              </div>
            </div>

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[var(--color-brand-dark)] text-white rounded-xl font-bold text-lg hover:bg-[var(--color-brand-orange)] transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> Publicando...
                </>
              ) : (
                <>
                  <Send size={20} /> Publicar Campaña
                </>
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}