'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type Property = Database['public']['Tables']['properties']['Row'] & {
  developers: { name: string; logo_url: string | null } | null;
};

export default function AdminProperties() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'es';
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    const supabase = createClient();
    const { data } = await supabase
      .from('properties')
      .select('*, developers(name, logo_url)')
      .order('created_at', { ascending: false });

    setProperties((data as Property[]) || []);
    setLoading(false);
  }

  async function togglePublished(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from('properties').update({ published: !current }).eq('id', id);
    setProperties(prev => prev.map(p => p.id === id ? { ...p, published: !current } : p));
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    const supabase = createClient();
    await supabase.from('properties').delete().eq('id', id);
    setProperties(prev => prev.filter(p => p.id !== id));
  }

  const filtered = properties.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (n: number) => `$${n.toLocaleString('es-MX')}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#2C2C2C]">Propiedades</h1>
        <Link
          href={`/${locale}/admin/properties/new`}
          className="flex items-center gap-2 px-4 py-2 bg-[#00B4C8] hover:bg-[#009AB0] text-white text-sm font-bold rounded-lg transition-colors"
        >
          <Plus size={16} />
          Nueva propiedad
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o ciudad..."
          className="w-full pl-10 pr-4 h-10 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4C8]/20 focus:border-[#00B4C8]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-[#00B4C8]/30 border-t-[#00B4C8] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="font-medium">No hay propiedades</p>
            <p className="text-sm mt-1">Agrega tu primera propiedad o importa un CSV</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F4F6F8] text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Propiedad</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Ciudad</th>
                  <th className="px-4 py-3">Etapa</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-semibold text-[#2C2C2C]">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.developers?.name || '—'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatPrice(p.price_mxn)}</td>
                    <td className="px-4 py-3 text-gray-600">{p.zone}, {p.city}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        p.stage === 'preventa' ? 'bg-[#F5A623]/10 text-[#F5A623]' :
                        p.stage === 'construccion' ? 'bg-blue-50 text-blue-600' :
                        'bg-green-50 text-green-600'
                      }`}>
                        {p.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublished(p.id, p.published)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.published ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {p.published ? <Eye size={12} /> : <EyeOff size={12} />}
                        {p.published ? 'Publicado' : 'Oculto'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/${locale}/propiedades/${p.slug}`}
                          target="_blank"
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-400 hover:text-[#00B4C8]"
                        >
                          <ExternalLink size={14} />
                        </Link>
                        <Link
                          href={`/${locale}/admin/properties/${p.id}`}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-400 hover:text-[#00B4C8]"
                        >
                          <Edit2 size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
