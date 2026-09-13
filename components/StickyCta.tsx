'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Phone } from './icons';
import type { Settings } from '@/lib/types';

const inView = (el: Element | null) => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight;
};

/** Mobile-only sticky bar, shown once the hero has scrolled away and hidden
 *  again over the quote form. */
export default function StickyCta({ settings }: { settings: Settings }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const update = () => setShow(
      !inView(document.querySelector('.hero')) &&
      !inView(document.querySelector('.page-hero')) &&
      !inView(document.getElementById('quote')),
    );
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div className={`sticky-cta${show ? ' visible' : ''}`}>
      <a href={settings.phoneHref} className="btn btn-outline-light">
        <Phone />{settings.ui?.stickyCallLabel ?? 'Call Now'}
      </a>
      <Link href={settings.headerCtaHref ?? '/contact#quote'} className="btn btn-primary">
        {settings.ui?.stickyQuoteLabel ?? 'Request a Quote'}
      </Link>
    </div>
  );
}
