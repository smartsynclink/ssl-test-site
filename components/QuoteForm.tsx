'use client';
import { useState } from 'react';
import type { Settings } from '@/lib/types';

/**
 * Renders the GHL form embed when one is configured, and the site's own styled
 * form otherwise. The embed's height is reserved up front so it cannot shift
 * layout while loading.
 */
export default function QuoteForm({ settings, formId, serviceArea, consentText }: {
  settings: Settings; formId: string; serviceArea: string; consentText?: string;
}) {
  const embed = settings.integrations?.ghlFormUrl;
  if (embed) {
    const height = settings.integrations?.ghlFormHeight ?? 620;
    return (
      <div style={{ minHeight: height }}>
        <iframe src={embed} title={settings.ui?.submitLabel ?? 'Request a quote'} loading="lazy"
          style={{ width: '100%', height, border: 'none', display: 'block' }} />
      </div>
    );
  }
  return <BuiltInForm settings={settings} formId={formId} serviceArea={serviceArea} consentText={consentText} />;
}

const PHONE_DIGITS = /\d/g;

function BuiltInForm({ settings, formId, serviceArea, consentText }: {
  settings: Settings; formId: string; serviceArea: string; consentText?: string;
}) {
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const services = (settings.serviceCategories ?? []).flatMap(c => c.services ?? []);
  const ui = settings.ui ?? {};

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? '').trim();
    const next: Record<string, boolean> = {
      name: !get('name'),
      phone: (get('phone').match(PHONE_DIGITS)?.length ?? 0) < 10,
      email: !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(get('email')),
      service: !get('service'),
      consent: fd.get('consent') !== 'on',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setBusy(true);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...Object.fromEntries(fd.entries()),
          consentText, serviceArea,
          pageUrl: window.location.href,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSent(true);
    } catch {
      setErrors({ submit: true });
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="q-success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        <p><strong>{ui.successTitle}</strong><br />
          {ui.successBody} <a href={settings.phoneHref}>{settings.phone}</a>.</p>
      </div>
    );
  }

  return (
    <form className="q-form" id={formId} noValidate onSubmit={onSubmit}>
      <input type="hidden" name="service_area" value={serviceArea} />
      {/* honeypot: real people never fill this; bots usually do */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off"
        aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />

      <div className="q-field" data-field="name">
        <label className="sr-only" htmlFor={`${formId}-name`}>{ui.srName}</label>
        <input id={`${formId}-name`} name="name" type="text" placeholder={ui.namePlaceholder} autoComplete="name" />
        <span className="q-error" hidden={!errors.name}>{ui.errorName}</span>
      </div>
      <div className="q-field" data-field="phone">
        <label className="sr-only" htmlFor={`${formId}-phone`}>{ui.srPhone}</label>
        <input id={`${formId}-phone`} name="phone" type="tel" placeholder={ui.phonePlaceholder} autoComplete="tel" />
        <span className="q-error" hidden={!errors.phone}>{ui.errorPhone}</span>
      </div>
      <div className="q-field" data-field="email">
        <label className="sr-only" htmlFor={`${formId}-email`}>{ui.srEmail}</label>
        <input id={`${formId}-email`} name="email" type="email" placeholder={ui.emailPlaceholder} autoComplete="email" />
        <span className="q-error" hidden={!errors.email}>{ui.errorEmail}</span>
      </div>
      <div className="q-field" data-field="service">
        <label className="sr-only" htmlFor={`${formId}-service`}>{ui.srService}</label>
        <select id={`${formId}-service`} name="service" defaultValue="">
          <option value="" disabled>{ui.servicePlaceholder}</option>
          {services.map(s => <option key={s} value={s}>{s}</option>)}
          <option value={ui.serviceOtherOption}>{ui.serviceOtherOption}</option>
        </select>
        <span className="q-error" hidden={!errors.service}>{ui.errorService}</span>
      </div>
      <div className="q-consent" data-field="consent">
        <input id={`${formId}-consent`} name="consent" type="checkbox" />
        <label htmlFor={`${formId}-consent`}>{consentText}</label>
        <span className="q-error" hidden={!errors.consent}>{ui.errorConsent}</span>
      </div>
      <button type="submit" className="btn-gold full" disabled={busy}>
        {busy ? ui.submittingLabel : ui.submitLabel}
      </button>
      {errors.submit && <span className="q-error">{ui.errorSubmit} {settings.phone}.</span>}
    </form>
  );
}
