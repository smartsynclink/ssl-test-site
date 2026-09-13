'use client';
import { useEffect, useRef } from 'react';
import QuoteForm from './QuoteForm';
import { Close, Phone } from './icons';
import type { Settings } from '@/lib/types';
import { uiText } from '@/lib/ui';

/** Hashes that mean "take me to the quote form". Buttons keep them as real hrefs
 *  (e.g. /contact#quote), so a new tab or a no-JS visit still reaches a form. */
const QUOTE_HASHES = new Set(['#quote', '#hero-quote']);

/**
 * Every "Request a Quote" button opens the short form in a modal instead of
 * leaving the page. Uses the native <dialog>: focus handling, inert background
 * and the top layer come from the browser.
 */
export default function QuoteModal({ settings, serviceArea, consentText, heading, emphasis }: {
  settings: Settings; serviceArea: string; consentText?: string; heading?: string; emphasis?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // leave new-tab / modified clicks to the browser
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || !QUOTE_HASHES.has(new URL(a.href, location.href).hash)) return;
      e.preventDefault();   // next/link skips navigation when the click is already handled
      dialog.current?.showModal();
    };
    // capture phase, so this runs before next/link's own click handler
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  const title = heading || settings.headerCtaLabel || uiText(settings.ui, 'stickyQuoteLabel');
  const lead = emphasis && title.endsWith(emphasis) ? title.slice(0, -emphasis.length) : title;

  return (
    <dialog ref={dialog} className="quote-modal" aria-labelledby="quote-modal-title"
      // a click on the backdrop lands on the <dialog> itself
      onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }}
      // explicit, because some embedded browsers don't turn Escape into the native close request
      onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); dialog.current?.close(); } }}>
      <div className="quote-modal-inner">
        <button type="button" className="quote-modal-close" aria-label={uiText(settings.ui, 'closeLabel')}
          onClick={() => dialog.current?.close()}><Close /></button>
        <p className="form-title" id="quote-modal-title">
          {lead}{emphasis && title.endsWith(emphasis) && <em>{emphasis}</em>}
        </p>
        <QuoteForm settings={settings} formId="modalForm" serviceArea={serviceArea} consentText={consentText} />
        <a href={settings.phoneHref} className="quote-modal-call">
          <Phone />{uiText(settings.ui, 'stickyCallLabel')}: {settings.phone}
        </a>
      </div>
    </dialog>
  );
}
