'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Phone, Mail, Clock, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database, LeadStatus } from '@/lib/supabase/types';

type Lead = Database['public']['Tables']['leads']['Row'] & {
  properties: { name: string; slug: string; city: string } | null;
};

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  nuevo: { label: 'Nuevo', color: 'bg-blue-50 text-blue-600' },
  contactado: { label: 'Contactado', color: 'bg-purple-50 text-purple-600' },
  en_seguimiento: { label: 'Seguimiento', color: 'bg-yellow-50 text-yellow-600' },
  visita_agendada: { label: 'Visita agendada', color: 'bg-[#00B4C8]/10 text-[#00B4C8]' },
  negociacion: { label: 'Negociación', color: 'bg-orange-50 text-orange-600' },
  cerrado: { label: 'Cerrado', color: 'bg-green-50 text-green-600' },
  perdido: { label: 'Perdido', color: 'bg-gray-100 text-gray-500' },
};

const ALL_STATUSES: LeadStatus[] = ['nuevo', 'contactado', 'en_seguimiento', 'visita_agendada', 'negociacion', 'cerrado', 'perdido'];

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadLeads();
  }, [filterStatus]);

  async function loadLeads() {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from('leads')
      .select('*, properties(name, slug, city)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filterStatus) query = query.eq('status', filterStatus);

    const { data } = await query;
    setLeads((data as Lead[]) || []);
    setLoading(false);
  }

  async function updateStatus(id: string, newStatus: LeadStatus) {
    const supabase = createClient();
    await supabase.from('leads').update({ status: newStatus }).eq('id', id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#2C2C2C]">Leads</h1>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4C8]/20"
        >
          <option value="">Todos los estados</option>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-[#00B4C8]/30 border-t-[#00B4C8] rounded-full animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            <MessageSquare size={32} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">No hay leads aún</p>
            <p className="text-sm mt-1">Los contactos del formulario y WhatsApp aparecerán aquí</p>
          </div>
        ) : (
          leads.map(lead => (
            <div key={lead.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#2C2C2C]">{lead.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[lead.status].color}`}>
                      {STATUS_CONFIG[lead.status].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                    {lead.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={12} /> {lead.email}
                      </span>
                    )}
                    {lead.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} /> {lead.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {timeAgo(lead.created_at)}
                    </span>
                  </div>
                  {lead.message && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{lead.message}</p>
                  )}
                  {lead.properties && (
                    <p className="text-xs text-[#00B4C8] font-medium mt-1.5">
                      → {lead.properties.name} ({lead.properties.city})
                    </p>
                  )}
                </div>

                {/* Status selector */}
                <div className="relative">
                  <select
                    value={lead.status}
                    onChange={e => updateStatus(lead.id, e.target.value as LeadStatus)}
                    className="h-8 pl-2 pr-7 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-[#00B4C8]/20"
                  >
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
