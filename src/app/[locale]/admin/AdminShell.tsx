'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, Users, MessageSquare, Upload,
  ChevronLeft, LogOut, Settings, BarChart3, Menu, X
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/properties', icon: Building2, label: 'Propiedades' },
  { href: '/admin/leads', icon: MessageSquare, label: 'Leads' },
  { href: '/admin/developers', icon: Users, label: 'Desarrolladores' },
  { href: '/admin/import', icon: Upload, label: 'Importar CSV' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Extract locale from pathname
  const locale = pathname.split('/')[1] || 'es';

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}`;
  }

  const isActive = (href: string) => {
    const full = `/${locale}${href}`;
    return pathname === full || (href !== '/admin' && pathname.startsWith(full));
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${collapsed ? 'w-16' : 'w-60'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-[#0D1B2A] text-white flex flex-col transition-all duration-200
      `}>
        {/* Logo */}
        <div className={`flex items-center h-14 px-4 border-b border-white/10 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && <span className="text-lg font-bold tracking-tight">PROPYTE <span className="text-[#00B4C8] text-xs font-normal">CRM</span></span>}
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex w-8 h-8 items-center justify-center hover:bg-white/10 rounded-lg">
            <ChevronLeft size={16} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden w-8 h-8 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-[#00B4C8] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <item.icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/10 p-2 space-y-0.5">
          <Link
            href={`/${locale}/admin/settings`}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 ${collapsed ? 'justify-center' : ''}`}
          >
            <Settings size={18} />
            {!collapsed && <span>Configuración</span>}
          </Link>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-white/5 w-full ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={18} />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 gap-4">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg">
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <Link href={`/${locale}/propiedades`} className="text-xs text-[#00B4C8] hover:underline font-medium">
            Ver sitio →
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
