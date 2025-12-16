'use client';
import { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Componente del formulario (separado para usar useSearchParams)
function AuthForm() {
  const params = useSearchParams();
  const roleParam = params.get('role') === 'brand' ? 'brand' : 'influencer';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [socialHandle, setSocialHandle] = useState(''); // Estado para el usuario de Instagram
  const [role, setRole] = useState<'brand' | 'influencer'>(roleParam);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Registro en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Guardamos los datos extra en la metadata del usuario
          data: { 
            role: role,
            full_name: email.split('@')[0],
            // Enviamos el usuario de Instagram (o vacío si es marca)
            username: role === 'influencer' 
            ? (socialHandle.startsWith('@') ? socialHandle : `@${socialHandle}`)
            : null
          }
        }
      });

      if (error) throw error;
      
      alert('¡Cuenta creada con éxito! Tu worker de Python debería estar verificándote ahora.');
      router.push('/'); // Volver al inicio
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-[var(--color-brand-dark)]">
          Crea tu cuenta
        </h2>
        <p className="text-gray-500 mt-2">
          Te estás registrando como <span className="font-bold text-[var(--color-brand-orange)] uppercase">{role === 'brand' ? 'Marca' : 'Influencer'}</span>
        </p>
      </div>
      
      <form onSubmit={handleSignUp} className="space-y-4">
        {/* Selector de Rol (Tabs) */}
        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => setRole('brand')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${role === 'brand' ? 'bg-white shadow text-[var(--color-brand-dark)]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Soy Marca
          </button>
          <button
            type="button"
            onClick={() => setRole('influencer')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${role === 'influencer' ? 'bg-white shadow text-[var(--color-brand-dark)]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Soy Influencer
          </button>
        </div>

        {/* Input: Correo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
          <input
            type="email"
            required
            className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[var(--color-brand-orange)] focus:ring-2 focus:ring-[var(--color-brand-orange)]/20 outline-none transition-all text-gray-900"
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        {/* Input: Contraseña */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input
            type="password"
            required
            className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[var(--color-brand-orange)] focus:ring-2 focus:ring-[var(--color-brand-orange)]/20 outline-none transition-all text-gray-900"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* NUEVO INPUT: Usuario de Instagram (Solo visible si es Influencer) */}
        {role === 'influencer' && (
          <div className="animate-fade-in-up">
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Usuario de Instagram
             </label>
             <div className="relative">
               <span className="absolute left-3 top-3 text-gray-400 font-bold">@</span>
               <input
                 type="text"
                 required
                 className="w-full p-3 pl-8 rounded-xl bg-gray-50 border border-gray-200 focus:border-[var(--color-brand-orange)] focus:ring-2 focus:ring-[var(--color-brand-orange)]/20 outline-none transition-all text-gray-900"
                 placeholder="mi_usuario_famoso"
                 value={socialHandle}
                 onChange={(e) => setSocialHandle(e.target.value)}
               />
             </div>
             <p className="text-xs text-gray-400 mt-1">Lo usaremos para verificar tus métricas automáticamente.</p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 mt-6 bg-[var(--color-brand-dark)] text-white rounded-xl font-bold text-lg hover:bg-[var(--color-brand-orange)] transition-all shadow-lg shadow-blue-900/10 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando cuenta...' : 'Registrarse Gratis'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-gray-400 hover:text-[var(--color-brand-dark)]">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}

// Página principal que envuelve el formulario en Suspense (Requisito de Next.js)
export default function AuthPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Decoración de fondo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-brand-orange)]/5 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--color-brand-dark)]/5 rounded-full blur-[100px]"></div>
      </div>
      
      <Suspense fallback={<div>Cargando...</div>}>
        <AuthForm />
      </Suspense>
    </main>
  );
}