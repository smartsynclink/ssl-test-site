'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { urlFor } from '@/sanity/image';
import { Arrow, Chevron, Close, Phone, Pin } from './icons';
import type { Settings } from '@/lib/types';

export default function Header({ settings }: { settings: Settings }) {
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [acc, setAcc] = useState<'services' | 'areas' | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // lock body scroll while the drawer is open, and close on Escape
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [drawer]);

  const cats = settings.serviceCategories ?? [];
  const areas = settings.serviceAreas ?? [];
  const links = settings.navLinks ?? [];
  const ctaHref = settings.headerCtaHref ?? '/contact#quote';
  const ctaLabel = settings.headerCtaLabel ?? 'Request a Quote';

  return (
    <>
      <header className={`site-header${scrolled ? ' scrolled' : ''}`} id="siteHeader">
        <div className="nav-inner">
          <Link href="/" className="logo-wrap" aria-label={`${settings.businessName}, home`}>
            {settings.logo && (
              <Image src={urlFor(settings.logo).width(360).url()} alt={settings.businessName}
                width={118} height={88} sizes="118px" priority />
            )}
          </Link>

          <nav className="primary-nav" aria-label="Primary">
            <div className="nav-item">
              <button className="nav-trigger">{settings.navServicesLabel} <Chevron /></button>
              <div className="mega-panel">
                <div className="mega-panel-inner">
                  {cats.map(c => (
                    <div className="mega-col" key={c.id}>
                      <Link href={c.href ?? '#'}><span>{c.title}</span><Arrow /></Link>
                      <ul>{(c.services ?? []).map(s => <li key={s}>{s}</li>)}</ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {links.slice(0, 2).map(l => (
              <Link href={l.href} className="nav-link" key={l.href}>{l.label}</Link>
            ))}

            <div className="nav-item">
              <button className="nav-trigger">{settings.navAreasLabel} <Chevron /></button>
              <div className="area-panel">
                <div className="area-panel-inner">
                  {areas.map(a => (
                    <Link href={a.slug ? `/${a.slug}` : '/contact'} key={a.name}>
                      <Pin />{a.name}<span className="area-arrow"><Arrow /></span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {links.slice(2).map(l => (
              <Link href={l.href} className="nav-link" key={l.href}>{l.label}</Link>
            ))}
          </nav>

          <div className="nav-actions">
            <a href={settings.phoneHref} className="nav-phone"><Phone />{settings.phone}</a>
            <Link href={ctaHref} className="btn-gold request-desktop">{ctaLabel}</Link>
            <button className="menu-btn btn-gold" aria-label="Open menu" aria-expanded={drawer}
              onClick={() => setDrawer(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" /></svg>
            </button>
          </div>
        </div>
      </header>

      <div className={`drawer-backdrop${drawer ? ' open' : ''}`} onClick={() => setDrawer(false)} />
      <aside className={`mobile-drawer${drawer ? ' open' : ''}`} aria-hidden={!drawer}>
        <div className="drawer-close-row">
          <button aria-label="Close menu" onClick={() => setDrawer(false)}><Close /></button>
        </div>

        <button className={`accordion-toggle${acc === 'services' ? ' open' : ''}`}
          onClick={() => setAcc(acc === 'services' ? null : 'services')}>
          {settings.navServicesLabel} <Chevron />
        </button>
        <div className={`accordion-body${acc === 'services' ? ' open' : ''}`}>
          <div className="accordion-body-inner">
            {cats.map(c => (
              <div className="cat-block" key={c.id}>
                <Link href={c.href ?? '#'} onClick={() => setDrawer(false)}>{c.title}<Arrow /></Link>
                <ul>{(c.services ?? []).map(x => <li key={x}>{x}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>

        {links.slice(0, 2).map(l => (
          <Link href={l.href} className="drawer-link" key={l.href}
            onClick={() => setDrawer(false)}>{l.label}</Link>
        ))}

        <button className={`accordion-toggle${acc === 'areas' ? ' open' : ''}`}
          onClick={() => setAcc(acc === 'areas' ? null : 'areas')}>
          {settings.navAreasLabel} <Chevron />
        </button>
        <div className={`accordion-body${acc === 'areas' ? ' open' : ''}`}>
          <div className="accordion-body-inner">
            <ul className="area-list">
              {areas.map(a => (
                <li key={a.name}>
                  <Link href={a.slug ? `/${a.slug}` : '/contact'} onClick={() => setDrawer(false)}>
                    <Pin />{a.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {links.slice(2).map(l => (
          <Link href={l.href} className="drawer-link" key={l.href}
            onClick={() => setDrawer(false)}>{l.label}</Link>
        ))}

        <div className="drawer-cta">
          <a href={settings.phoneHref} className="nav-phone"
            style={{ border: '1.5px solid var(--border-soft)', color: 'var(--text)' }}>
            <Phone />{settings.ui?.stickyCallLabel ?? 'Call Now'}: {settings.phone}
          </a>
          <Link href={ctaHref} className="btn-gold" onClick={() => setDrawer(false)}>{ctaLabel}</Link>
        </div>
      </aside>
    </>
  );
}
