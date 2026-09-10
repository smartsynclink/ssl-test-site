import Image from 'next/image';
import Link from 'next/link';
import { urlFor } from '@/sanity/image';
import { ChevronUp, Facebook, Instagram, Mail, Phone, PinSolid, Yelp } from './icons';
import type { Settings } from '@/lib/types';

/** Columns hold their links as direct <a> children -- the ported CSS styles
 *  `.footer-col a`, so wrapping them in <ul>/<li> loses the styling. */
export default function Footer({ settings }: { settings: Settings }) {
  const s = settings.social ?? {};
  return (
    <footer className="site-footer">
      <div className="footer-shimmer-bar"><div className="shine animate-shimmer" /></div>
      <div className="footer-grid">
        <div className="footer-brand">
          {settings.logo && (
            <Image src={urlFor(settings.logo).width(640).url()} alt={settings.businessName}
              width={240} height={178} sizes="240px" />
          )}
          {settings.footerNote && <p>{settings.footerNote}</p>}
          <div className="footer-socials">
            {s.facebook && <a href={s.facebook} target="_blank" rel="noopener"
              aria-label={`${settings.businessName} on Facebook`}><Facebook /></a>}
            {s.instagram && <a href={s.instagram} target="_blank" rel="noopener"
              aria-label={`${settings.businessName} on Instagram`}><Instagram /></a>}
            {s.yelp && <a href={s.yelp} target="_blank" rel="noopener"
              aria-label={`${settings.businessName} on Yelp`}><Yelp /></a>}
          </div>
        </div>

        {(settings.footerColumns ?? []).map(col => (
          <div className="footer-col" key={col.title}>
            <h4>{col.title}</h4>
            {col.fromServiceCategories
              ? (settings.serviceCategories ?? []).map(c => (
                  <Link href={c.href ?? '#'} key={c.id}>{c.title}</Link>))
              : (col.links ?? []).map(l => (
                  <Link href={l.href} key={l.href}>{l.label}</Link>))}
          </div>
        ))}

        <div className="footer-col">
          <h4>{settings.footerContactTitle}</h4>
          <a href={settings.phoneHref}><Phone />{settings.phone}</a>
          {settings.email && <a href={`mailto:${settings.email}`}><Mail />{settings.email}</a>}
          {settings.serviceAreaLabel && <span><PinSolid />Serving {settings.serviceAreaLabel}</span>}
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p>&copy; {new Date().getFullYear()} {settings.businessName}. All rights reserved.</p>
          <a href="#top" className="back-to-top">
            {settings.ui?.backToTopLabel ?? 'Back to top'}<ChevronUp /></a>
        </div>
      </div>
    </footer>
  );
}
