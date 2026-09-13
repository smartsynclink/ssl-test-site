'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { urlFor } from '@/sanity/image';
import { ArrowRight, Chevron, Clock, Close, Phone, Pin } from './icons';
import type { Settings } from '@/lib/types';

type NavLink = NonNullable<Settings['navLinks']>[number];

export default function Header({ settings }: { settings: Settings }) {
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [acc, setAcc] = useState<string | null>(null);

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
  const callLabel = settings.ui?.stickyCallLabel ?? 'Call Now';
  const close = () => setDrawer(false);
  const areaHref = (slug?: string) => (slug ? `/${slug}` : '/contact');

  const panel = (l: NavLink) => l.menu === 'services' ? (
    <div className="nav-panel mega">
      <div className="nav-panel-card mega-grid">
        {cats.map(c => (
          <Link href={c.href ?? '#'} className="mega-card" key={c.id}>
            {c.image && (
              <span className="mega-thumb">
                <Image src={urlFor(c.image).width(240).height(240).url()} alt="" fill sizes="64px" />
              </span>
            )}
            <span className="mega-body">
              <strong>{c.title}</strong>
              <small>{(c.services ?? []).slice(0, 3).join(' · ')}</small>
            </span>
          </Link>
        ))}
      </div>
    </div>
  ) : (
    <div className="nav-panel areas">
      <div className="nav-panel-card area-grid">
        {areas.map(a => <Link href={areaHref(a.slug)} key={a.name}><Pin />{a.name}</Link>)}
      </div>
    </div>
  );

  const drawerBody = (l: NavLink) => l.menu === 'services' ? (
    <div className="drawer-subs">
      {cats.map(c => (
        <Link href={c.href ?? '#'} className="drawer-sub" key={c.id} onClick={close}>{c.title}</Link>
      ))}
    </div>
  ) : (
    <div className="drawer-chips">
      {areas.map(a => (
        <Link href={areaHref(a.slug)} className="chip" key={a.name} onClick={close}>{a.name}</Link>
      ))}
    </div>
  );

  return (
    <>
      <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
        {/* Blueprint top bar: phone, hours, service area, small CTA -- always visible */}
        <div className="top-bar">
          <div className="top-bar-inner">
            <a href={settings.phoneHref} className="top-bar-phone"><Phone />{settings.phone}</a>
            {settings.hours && <span className="top-bar-item"><Clock />{settings.hours}</span>}
            {settings.serviceAreaLabel && (
              <span className="top-bar-item"><Pin />Serving {settings.serviceAreaLabel}</span>
            )}
            <Link href={ctaHref} className="top-bar-cta">{ctaLabel}<ArrowRight /></Link>
          </div>
        </div>

        <div className="nav-island">
          <Link href="/" className="logo-wrap" aria-label={`${settings.businessName}, home`}>
            {settings.logo && (
              <Image src={urlFor(settings.logo).width(240).url()} alt={settings.businessName}
                width={72} height={48} sizes="72px" priority />
            )}
          </Link>

          <nav className="primary-nav" aria-label="Primary">
            {links.map(l => l.menu ? (
              <div className={`nav-item${l.menu === 'services' ? ' has-mega' : ''}`} key={l.label}>
                <button className="nav-link" aria-haspopup="true">{l.label} <Chevron /></button>
                {panel(l)}
              </div>
            ) : (
              <Link href={l.href} className="nav-link" key={l.label}>{l.label}</Link>
            ))}
          </nav>

          <div className="nav-actions">
            <a href={settings.phoneHref} className="btn btn-outline-light sm nav-call" aria-label={`${callLabel}: ${settings.phone}`}>
              <Phone /><span>{callLabel}</span>
            </a>
            <Link href={ctaHref} className="btn btn-primary sm nav-cta">
              {ctaLabel}<span className="btn-ico"><ArrowRight /></span>
            </Link>
            <button className="menu-btn" aria-label="Open menu" aria-expanded={drawer}
              onClick={() => setDrawer(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h10" /></svg>
            </button>
          </div>
        </div>
      </header>

      <div className={`drawer-backdrop${drawer ? ' open' : ''}`} onClick={close} />
      <aside className={`mobile-drawer${drawer ? ' open' : ''}`} aria-hidden={!drawer}>
        <div className="drawer-head">
          {settings.logo && (
            <Image src={urlFor(settings.logo).width(240).url()} alt={settings.businessName}
              width={60} height={40} sizes="60px" />
          )}
          <button className="drawer-close" aria-label="Close menu" onClick={close}><Close /></button>
        </div>

        <div className="drawer-scroll">
          {links.map(l => l.menu ? (
            <Fragment key={l.label}>
              <button className={`accordion-toggle${acc === l.label ? ' open' : ''}`}
                onClick={() => setAcc(acc === l.label ? null : l.label)}>
                {l.label} <Chevron />
              </button>
              {/* the 0fr collapse only works on a single, padding-free grid child */}
              <div className={`accordion-body${acc === l.label ? ' open' : ''}`}>
                <div>{drawerBody(l)}</div>
              </div>
            </Fragment>
          ) : (
            <Link href={l.href} className="drawer-link" key={l.label} onClick={close}>{l.label}</Link>
          ))}
        </div>

        <div className="drawer-cta">
          <a href={settings.phoneHref} className="btn btn-outline"><Phone />{callLabel}: {settings.phone}</a>
          <Link href={ctaHref} className="btn btn-primary" onClick={close}>
            {ctaLabel}<span className="btn-ico"><ArrowRight /></span>
          </Link>
        </div>
      </aside>
    </>
  );
}
