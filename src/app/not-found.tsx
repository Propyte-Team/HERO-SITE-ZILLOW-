import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8]">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold text-[#1E3A5F] mb-4">404</h1>
        <p className="text-gray-600 mb-6">Página no encontrada</p>
        <Link href="/" className="inline-flex h-11 px-6 bg-[#00B4C8] hover:bg-[#009AB0] text-white font-semibold rounded-lg items-center transition-colors">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
