import { getTranslations } from 'next-intl/server';
import AdminShell from './AdminShell';

export async function generateMetadata() {
  return {
    title: 'Admin — Propyte CRM',
    robots: { index: false, follow: false },
  };
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
