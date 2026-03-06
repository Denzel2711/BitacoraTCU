import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-orange-50 px-4">
      <div className="max-w-md w-full text-center">
        <p className="text-8xl font-extrabold text-cyan-600 leading-none">404</p>
        <h2 className="mt-4 text-2xl font-bold text-gray-800">Página no encontrada</h2>
        <p className="mt-2 text-sm text-gray-500">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-block mt-8 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-orange-500 hover:from-cyan-700 hover:to-orange-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
