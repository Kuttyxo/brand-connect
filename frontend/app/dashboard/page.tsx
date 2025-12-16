export default function DashboardPage() {
  return (
    <div className="space-y-8">
      
      {/* Encabezado de Bienvenida */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-brand-dark)]">
          Hola, <span className="text-[var(--color-brand-orange)]">Usuario</span> 👋
        </h1>
        <p className="text-gray-500 mt-2">Aquí tienes el resumen de tu actividad hoy.</p>
      </div>

      {/* Tarjetas de Estadísticas (Stats Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Seguidores */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Seguidores Totales</h3>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">👥</span>
          </div>
          <p className="text-3xl font-extrabold text-[var(--color-brand-dark)]">12.5k</p>
          <span className="text-sm text-green-500 font-medium">↑ 12% este mes</span>
        </div>

        {/* Card 2: Engagement */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Engagement Rate</h3>
            <span className="p-2 bg-orange-50 text-orange-600 rounded-lg">🔥</span>
          </div>
          <p className="text-3xl font-extrabold text-[var(--color-brand-dark)]">5.4%</p>
          <span className="text-sm text-gray-400 font-medium">Promedio saludable</span>
        </div>

        {/* Card 3: Ganancias / Campañas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Campañas Activas</h3>
            <span className="p-2 bg-green-50 text-green-600 rounded-lg">💰</span>
          </div>
          <p className="text-3xl font-extrabold text-[var(--color-brand-dark)]">3</p>
          <span className="text-sm text-blue-500 font-medium cursor-pointer hover:underline">Ver detalles →</span>
        </div>
      </div>

      {/* Sección Secundaria: Campañas Recientes (Placeholder) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          🚀
        </div>
        <h3 className="text-xl font-bold text-[var(--color-brand-dark)]">¡Estás listo para despegar!</h3>
        <p className="text-gray-500 max-w-md mx-auto mt-2">
          Aún no tienes campañas activas. Completa tu perfil para que las marcas te encuentren.
        </p>
        <button className="mt-6 px-6 py-3 bg-[var(--color-brand-dark)] text-white rounded-xl font-bold hover:bg-[var(--color-brand-orange)] transition-colors">
          Completar Perfil
        </button>
      </div>

    </div>
  );
}