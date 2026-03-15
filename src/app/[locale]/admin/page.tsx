'use client';

import { useEffect, useState } from 'react';
import { Building2, MessageSquare, TrendingUp, Eye, Users, DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface DashboardStats {
  totalProperties: number;
  totalLeads: number;
  newLeads: number;
  totalViews: number;
}

function StatCard({ icon: Icon, label, value, subvalue, color }: {
  icon: typeof Building2;
  label: string;
  value: string | number;
  subvalue?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-[#2C2C2C] mt-1">{value}</p>
          {subvalue && <p className="text-xs text-gray-400 mt-0.5">{subvalue}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalLeads: 0,
    newLeads: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const supabase = createClient();

        // Check if Supabase is configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url') {
          setLoading(false);
          return;
        }

        const [properties, leads, newLeads, views] = await Promise.all([
          supabase.from('properties').select('*', { count: 'exact', head: true }),
          supabase.from('leads').select('*', { count: 'exact', head: true }),
          supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'nuevo'),
          supabase.from('property_views').select('*', { count: 'exact', head: true }),
        ]);

        setSupabaseConnected(true);
        setStats({
          totalProperties: properties.count || 0,
          totalLeads: leads.count || 0,
          newLeads: newLeads.count || 0,
          totalViews: views.count || 0,
        });
      } catch {
        // Supabase not configured yet — show setup instructions
      }
      setLoading(false);
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-[#00B4C8]/30 border-t-[#00B4C8] rounded-full animate-spin" />
      </div>
    );
  }

  if (!supabaseConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[#2C2C2C] mb-6">Configurar Supabase</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <p className="text-gray-600">
            Para activar el CRM, necesitas conectar tu proyecto de Supabase. Sigue estos pasos:
          </p>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-[#00B4C8] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <span>Crea un proyecto en <a href="https://supabase.com/dashboard" target="_blank" rel="noopener" className="text-[#00B4C8] font-semibold hover:underline">supabase.com/dashboard</a></span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-[#00B4C8] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <span>Ejecuta el archivo <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">supabase/migrations/001_initial_schema.sql</code> en el SQL Editor</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-[#00B4C8] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <div>
                Agrega estas variables a <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.env.local</code>:
                <pre className="bg-[#0D1B2A] text-green-400 text-xs p-3 rounded-lg mt-2 overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...`}
                </pre>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-[#00B4C8] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
              <span>Reinicia el dev server y recarga esta página</span>
            </li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#2C2C2C] mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} label="Propiedades" value={stats.totalProperties} color="bg-[#1E3A5F]" />
        <StatCard icon={MessageSquare} label="Leads totales" value={stats.totalLeads} subvalue={`${stats.newLeads} nuevos`} color="bg-[#00B4C8]" />
        <StatCard icon={Eye} label="Visitas" value={stats.totalViews} color="bg-[#F5A623]" />
        <StatCard icon={TrendingUp} label="Conversión" value={stats.totalLeads > 0 ? `${((stats.newLeads / stats.totalLeads) * 100).toFixed(1)}%` : '—'} color="bg-[#22C55E]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent leads */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-[#2C2C2C] mb-4">Leads recientes</h2>
          <p className="text-sm text-gray-400">Los leads aparecerán aquí cuando lleguen contactos.</p>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-[#2C2C2C] mb-4">Acciones rápidas</h2>
          <div className="space-y-2">
            <a href={`/es/admin/properties/new`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F4F6F8] transition-colors">
              <div className="w-9 h-9 bg-[#00B4C8]/10 rounded-lg flex items-center justify-center">
                <Building2 size={16} className="text-[#00B4C8]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2C2C2C]">Nueva propiedad</p>
                <p className="text-xs text-gray-400">Agregar manualmente</p>
              </div>
            </a>
            <a href={`/es/admin/import`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F4F6F8] transition-colors">
              <div className="w-9 h-9 bg-[#F5A623]/10 rounded-lg flex items-center justify-center">
                <DollarSign size={16} className="text-[#F5A623]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2C2C2C]">Importar lista de precios</p>
                <p className="text-xs text-gray-400">Carga masiva via CSV</p>
              </div>
            </a>
            <a href={`/es/admin/developers`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F4F6F8] transition-colors">
              <div className="w-9 h-9 bg-[#1E3A5F]/10 rounded-lg flex items-center justify-center">
                <Users size={16} className="text-[#1E3A5F]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2C2C2C]">Nuevo desarrollador</p>
                <p className="text-xs text-gray-400">Registrar empresa</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
