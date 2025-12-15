export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-black text-white">
      <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
        BrandConnect
      </h1>
      <p className="mt-4 text-xl text-gray-400">
        Marketplace de Micro-Influencers
      </p>
      <div className="mt-8 flex gap-4">
        <button className="px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition">
          Soy Marca
        </button>
        <button className="px-6 py-3 border border-white rounded-full font-bold hover:bg-white/10 transition">
          Soy Influencer
        </button>
      </div>
    </main>
  );
}