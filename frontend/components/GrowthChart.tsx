'use client';

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Users } from 'lucide-react';

// Datos simulados (Mock) para mostrar el potencial
// Cuando el bot de Python llene la tabla 'stats_snapshots', usaremos esos datos.
const MOCK_DATA = [
  { date: 'Lun', followers: 10400 },
  { date: 'Mar', followers: 10450 },
  { date: 'Mie', followers: 10800 }, // El día que subió el Reel
  { date: 'Jue', followers: 11200 },
  { date: 'Vie', followers: 11350 },
  { date: 'Sab', followers: 11500 },
  { date: 'Dom', followers: 11600 },
];

export default function GrowthChart({ role }: { role: 'brand' | 'influencer' }) {
  // Calculamos el crecimiento
  const start = MOCK_DATA[0].followers;
  const end = MOCK_DATA[MOCK_DATA.length - 1].followers;
  const growth = end - start;
  const percent = ((growth / start) * 100).toFixed(1);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-green-500" size={24} />
            {role === 'brand' ? 'Impacto de Campaña' : 'Crecimiento de Audiencia'}
          </h3>
          <p className="text-sm text-gray-500">
            {role === 'brand' 
              ? 'Nuevos seguidores ganados esta semana.' 
              : 'Evolución de tu comunidad en los últimos 7 días.'}
          </p>
        </div>
        <div className="bg-green-50 px-4 py-2 rounded-2xl text-green-700 text-right">
            <p className="text-2xl font-black">+{growth}</p>
            <p className="text-xs font-bold uppercase tracking-wide">Seguidores</p>
        </div>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MOCK_DATA}>
            <defs>
              <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9CA3AF', fontSize: 12}} 
                dy={10}
            />
            <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                cursor={{ stroke: '#10B981', strokeWidth: 2 }}
            />
            <Area 
                type="monotone" 
                dataKey="followers" 
                stroke="#10B981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorFollowers)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 py-3 rounded-xl">
        <Users size={16} />
        <span>Tu comunidad creció un <strong className="text-green-600">+{percent}%</strong> esta semana.</span>
      </div>
    </div>
  );
}