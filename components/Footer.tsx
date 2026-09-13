import Image from 'next/image';
import Link from 'next/link';
import { urlFor } from '@/sanity/image';
import { ChevronUp, Clock, Facebook, Instagram, Mail, Phone, PinSolid, Shield, Yelp } from './icons';
import Needed from './Needed';
import type { Settings } from '@/lib/types';

export default function Footer({ settings }: { settings: Settings }) {
  const s = settings.social ?? {};
  const a = settings.address;
  const address = a && [a.street, [a.city, [a.region, a.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ')]
    .filter(Boolean).join(', ');
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            {settings.logo && (
              <Image src={urlFor(settings.logo).width(360).url()} alt={settings.businessName}
                width={120} height={80} sizes="120px" />
            )}
            <p className="footer-name">{settings.businessName}</p>
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

          {/* Blueprint: the footer links every service area page */}
          <div className="footer-col">
            <h4>{settings.navLinks?.find(l => l.menu === 'areas')?.label ?? 'Service Areas'}</h4>
            <div className="footer-areas">
              {(settings.serviceAreas ?? []).map(ar => (
                <Link href={ar.slug ? `/${ar.slug}` : '/contact'} key={ar.name}>{ar.name}</Link>
              ))}
            </div>
          </div>

          <div className="footer-col contact">
            <h4>{settings.footerContactTitle}</h4>
            <a href={settings.phoneHref} className="footer-phone"><Phone />{settings.phone}</a>
            {settings.email && <a href={`mailto:${settings.email}`}><Mail />{settings.email}</a>}
            <span><PinSolid />{address || <Needed what="Business address (must match Google Business Profile)" />}</span>
            {settings.hours && <span><Clock />{settings.hours}</span>}
            <span><Shield />{settings.licenseNumber
              ? `License #${settings.licenseNumber}` : <Needed what="License number" />}</span>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} {settings.businessName}. All rights reserved.</p>
          <nav className="footer-legal" aria-label="Legal">
            {settings.legalLinks?.length
              ? settings.legalLinks.map(l => <Link href={l.href} key={l.href}>{l.label}</Link>)
              : <Needed what="Privacy policy + terms links" />}
          </nav>
          <a href="#top" className="back-to-top">
            {settings.ui?.backToTopLabel ?? 'Back to top'}<ChevronUp /></a>
        </div>
      </div>
    </footer>
  );
}
