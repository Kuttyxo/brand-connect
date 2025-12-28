'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Plus, AlertTriangle, Video, Loader2, ShieldCheck } from 'lucide-react';
import { TikTokEmbed, InstagramEmbed, YouTubeEmbed } from 'react-social-media-embed';

interface PortfolioManagerProps {
  userId: string;
  userHandle: string;
}

type PortfolioItem = {
  id: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  url: string;
};

export default function PortfolioManager({ userId, userHandle }: PortfolioManagerProps) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemUrl, setNewItemUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // NUEVO: Estado para el Checkbox de Responsabilidad
  const [isOwnerConfirmed, setIsOwnerConfirmed] = useState(false);

  // Cargar items
  useEffect(() => {
    const fetchPortfolio = async () => {
      const { data } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setItems((data as any) || []);
      setLoading(false);
    };
    fetchPortfolio();
  }, [userId]);

  const validateAndAdd = async () => {
    setError(null);
    setAdding(true);

    const url = newItemUrl.trim();
    if (!url) { setAdding(false); return; }

    // 1. Verificar si marcó la casilla (Doble seguridad UI)
    if (!isOwnerConfirmed) {
        setError("Debes certificar que el contenido es tuyo.");
        setAdding(false);
        return;
    }

    let platform: 'instagram' | 'tiktok' | 'youtube' | null = null;
    // Limpiamos el handle para comparar (quitamos espacios y @)
    let cleanHandle = userHandle ? userHandle.replace('@', '').trim().toLowerCase() : '';

    if (url.includes('instagram.com/reel') || url.includes('instagram.com/p/')) platform = 'instagram';
    else if (url.includes('tiktok.com')) platform = 'tiktok';
    else if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'youtube';

    if (!platform) {
        setError("Link no soportado. Usa Instagram, TikTok o YouTube.");
        setAdding(false);
        return;
    }

    // 2. VALIDACIÓN ESTRICTA PARA TIKTOK (Porque la URL sí trae el usuario)
    if (platform === 'tiktok' && cleanHandle) {
        if (!url.toLowerCase().includes(cleanHandle)) {
             setError(`Error: La URL de TikTok no coincide con tu usuario (@${cleanHandle}). No puedes subir videos de otras personas.`);
             setAdding(false); 
             return; 
        }
    }

    // 3. ADVERTENCIA PARA INSTAGRAM (Porque la URL no siempre trae el usuario)
    // Confiamos en el Checkbox, pero si detectamos un usuario diferente en la URL (algunos links lo traen), bloqueamos.
    if (platform === 'instagram' && cleanHandle) {
        // A veces el link es instagram.com/usuario/p/ID...
        if (url.includes('/p/') || url.includes('/reel/')) {
            // No podemos validar estrictamente por string, pero confiamos en la declaración jurada.
        }
    }

    const { data, error: dbError } = await supabase
        .from('portfolio_items')
        .insert({ user_id: userId, platform, url })
        .select()
        .single();

    if (dbError) {
        setError("Error: " + dbError.message);
    } else if (data) {
        setItems([data, ...items]);
        setNewItemUrl('');
        setIsOwnerConfirmed(false); // Resetear checkbox
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("¿Borrar este video del portafolio?")) return;
    const { error } = await supabase.from('portfolio_items').delete().eq('id', id);
    if (!error) setItems(items.filter(i => i.id !== id));
  };

  if (loading) return <div className="animate-pulse h-24 bg-gray-50 rounded-xl border border-gray-100"></div>;

  return (
    <div className="space-y-6">
        
        {/* Header e Instrucciones */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="font-bold text-blue-900 flex items-center gap-2 text-sm sm:text-base">
                <Video size={20} className="shrink-0"/> Tu Portafolio Visual
            </h3>
            <p className="text-xs sm:text-sm text-blue-700 mt-1 mb-3 leading-relaxed">
                Sube tus mejores videos (Máx 4). Las marcas verán esto para evaluar tu calidad de contenido.
            </p>
            <div className="flex gap-2 items-start bg-white/60 p-3 rounded-lg text-[11px] sm:text-xs text-blue-800 border border-blue-100/50">
                <AlertTriangle size={14} className="shrink-0 mt-0.5 text-orange-500"/>
                <span>
                    <strong>Importante:</strong> Tu perfil en la red social debe ser <strong>PÚBLICO</strong> para que se vea aquí.
                </span>
            </div>
        </div>

        {/* Input Area */}
        <div className="flex flex-col gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
            <input 
                type="text" 
                placeholder="Pega el link aquí (TikTok, Instagram Reel, YouTube)..."
                className="w-full p-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:border-transparent outline-none transition-all bg-white"
                value={newItemUrl}
                onChange={(e) => setNewItemUrl(e.target.value)}
            />
            
            {/* CHECKBOX DE RESPONSABILIDAD (EL FILTRO HUMANO) */}
            <div className="flex items-start gap-3 px-1">
                <div className="relative flex items-center">
                    <input 
                        type="checkbox" 
                        id="ownership"
                        checked={isOwnerConfirmed}
                        onChange={(e) => setIsOwnerConfirmed(e.target.checked)}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-blue-500 checked:bg-blue-500 hover:border-blue-400"
                    />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                </div>
                <label htmlFor="ownership" className="cursor-pointer text-xs text-gray-600 leading-tight select-none">
                    Declaro que soy el autor/propietario de este contenido. Entiendo que subir contenido de terceros resultará en la <strong className="text-red-600">suspensión permanente</strong> de mi cuenta.
                </label>
            </div>

            <button 
                onClick={validateAndAdd}
                // El botón está deshabilitado si no hay URL O si no marcó el checkbox
                disabled={adding || !newItemUrl || !isOwnerConfirmed}
                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm
                    ${!newItemUrl || !isOwnerConfirmed 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-[var(--color-brand-dark)] text-white hover:bg-black hover:shadow-lg'
                    }`}
            >
                {adding ? <Loader2 className="animate-spin" size={20}/> : <><Plus size={20}/> Agregar al Portafolio</>}
            </button>
        </div>
        
        {error && <p className="text-red-500 text-xs sm:text-sm font-bold flex items-center gap-1 animate-pulse bg-red-50 p-3 rounded-lg border border-red-100"><AlertTriangle size={18} className="shrink-0"/> {error}</p>}

        {/* Grid de Videos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {items.map((item) => (
                <div key={item.id} className="relative group bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                    <button 
                        onClick={() => handleDelete(item.id)}
                        className="absolute top-3 right-3 z-30 bg-red-500 text-white p-2 rounded-full shadow-lg 
                                   opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all 
                                   hover:bg-red-600 active:scale-95"
                        title="Eliminar video"
                    >
                        <Trash2 size={16}/>
                    </button>
                    
                    <div className="flex justify-center items-center bg-gray-50 min-h-[350px] w-full">
                        {item.platform === 'tiktok' && (
                            <div className="w-full flex justify-center overflow-hidden scale-[0.85] sm:scale-100 origin-top">
                                <TikTokEmbed url={item.url} width={325} />
                            </div>
                        )}
                        {item.platform === 'instagram' && (
                             <div className="w-full flex justify-center">
                                <InstagramEmbed url={item.url} width={328} captioned />
                            </div>
                        )}
                        {item.platform === 'youtube' && (
                            <YouTubeEmbed url={item.url} width="100%" height={220} />
                        )}
                    </div>
                    
                    <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider z-20">
                        {item.platform}
                    </div>
                </div>
            ))}
            
            {items.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <Video size={48} className="mx-auto mb-3 opacity-20"/>
                    <p className="text-sm">Tu portafolio está vacío.</p>
                </div>
            )}
        </div>
    </div>
  );
}