'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Menu, ChevronDown, User } from 'lucide-react';
import Logo from './Logo';
import LanguageToggle from './LanguageToggle';
import MobileMenu from './MobileMenu';

export default function Header() {
  const locale = useLocale();
  const t = useTranslations('nav');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: `/${locale}/propiedades?stage=preventa`, label: t('presale') },
    { href: `/${locale}/propiedades`, label: t('properties') },
    { href: `/${locale}/desarrolladores`, label: t('developers') },
    { href: `/${locale}/corredores`, label: t('brokers') },
    { href: `/${locale}/built`, label: t('built') },
    { href: `/${locale}/unete`, label: 'Únete' },
  ];

  return (
    <>
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      <header className={`sticky top-0 z-30 bg-white transition-shadow duration-200 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-8">
              <Logo variant="compact" />

              <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-2 text-sm font-semibold text-[#2C2C2C] hover:text-[#00B4C8] rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <button className="px-3 py-2 text-sm font-semibold text-[#2C2C2C] hover:text-[#00B4C8] rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1">
                  {t('more')} <ChevronDown size={14} />
                </button>
              </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <LanguageToggle />

              <Link
                href={`/${locale}/desarrolladores`}
                className="hidden md:flex items-center h-9 px-4 text-sm font-semibold text-[#2C2C2C] hover:text-[#00B4C8] hover:bg-gray-50 rounded-lg transition-colors"
              >
                {t('advertise')}
              </Link>

              <Link
                href={`/${locale}/contacto`}
                className="hidden sm:flex items-center gap-1.5 h-10 px-5 bg-[#00B4C8] hover:bg-[#009AB0] text-white font-bold text-sm rounded-lg transition-colors"
              >
                <User size={16} />
                {t('contact')}
              </Link>

              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-50"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        locale={locale}
        translations={{
          home: t('home'),
          properties: t('properties'),
          developers: t('developers'),
          contact: t('contact'),
        }}
      />
    </>
  );
}
