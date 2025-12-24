'use client';

import { X, CheckCircle, Lock, Star, Zap, Crown } from 'lucide-react';

interface Props {
    onClose: () => void;
    currentLevel: string;
    completed: number;
}

export default function BenefitsModal({ onClose, currentLevel, completed }: Props) {
  
  const benefits = [
    {
      name: 'Starter',
      min: 0,
      icon: Star,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      features: [
        'Acceso a campañas públicas',
        'Pagos seguros vía Escrow',
        'Soporte básico por email'
      ]
    },
    {
      name: 'Pro Creator',
      min: 5,
      icon: Zap,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      features: [
        'Todo lo de Starter +',
        'Insignia de Verificado Azul',
        'Acceso a campañas Premium (+$$)',
        'Soporte prioritario 24/7'
      ]
    },
    {
      name: 'Legend',
      min: 20,
      icon: Crown,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      features: [
        'Todo lo de Pro +',
        'Manager de cuenta dedicado',
        'Comisiones reducidas (5%)',
        'Eventos exclusivos'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Contenedor con Scroll para móviles pequeños */}
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto relative flex flex-col">
        
        {/* Botón cerrar flotante y accesible */}
        <button 
            onClick={onClose} 
            className="absolute top-3 right-3 md:top-4 md:right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-20"
        >
            <X size={20} />
        </button>

        <div className="p-5 md:p-8 pb-0">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-2 pr-8">Tu Carrera 🚀</h2>
            <p className="text-sm md:text-base text-gray-500">Completa trabajos para desbloquear mejores recompensas.</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-600">
                Has completado {completed} campañas
            </div>
        </div>

        <div className="p-5 md:p-8 grid gap-4">
            {benefits.map((tier) => {
                const isUnlocked = completed >= tier.min;
                const isCurrent = currentLevel === tier.name;

                return (
                    <div 
                        key={tier.name} 
                        className={`border rounded-2xl p-4 transition-all flex flex-col sm:flex-row items-start gap-3 md:gap-4 
                        ${isCurrent ? 'border-[var(--color-brand-orange)] ring-1 ring-[var(--color-brand-orange)] bg-orange-50/10' : 'border-gray-100'}`}
                    >
                        <div className={`p-3 rounded-xl ${tier.bg} ${tier.color} shrink-0`}>
                            <tier.icon size={24} />
                        </div>
                        
                        <div className="flex-1 w-full">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-gray-800 text-sm md:text-base">{tier.name}</h3>
                                {isUnlocked ? (
                                    <span className="text-[10px] md:text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                        <CheckCircle size={10}/> Desbloqueado
                                    </span>
                                ) : (
                                    <span className="text-[10px] md:text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                        <Lock size={10}/> {tier.min} camps
                                    </span>
                                )}
                            </div>
                            
                            <ul className="space-y-1.5 mt-2">
                                {tier.features.map((feat, i) => (
                                    <li key={i} className="text-xs md:text-sm text-gray-500 flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0"></div>
                                        <span>{feat}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
}