/**
 * Quote-form leads: validation and the shapes sent to GoHighLevel.
 * Pure functions only; app/api/lead/route.ts does the network calls.
 */
export type Lead = {
  name: string; phone: string; email: string; service: string;
  serviceArea: string; pageUrl: string; consentText: string;
};

const MAX = 500;   // no legitimate field is longer; keeps junk submissions out of the CRM
const clean = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, MAX) : '');

/** Server-side copy of the form's own checks -- the browser's can be bypassed. */
export function validateLead(raw: Record<string, unknown>): { lead: Lead; errors: string[] } {
  const lead: Lead = {
    name: clean(raw.name), phone: clean(raw.phone), email: clean(raw.email), service: clean(raw.service),
    serviceArea: clean(raw.serviceArea), pageUrl: clean(raw.pageUrl), consentText: clean(raw.consentText),
  };
  const errors: string[] = [];
  if (!lead.name) errors.push('name');
  if ((lead.phone.match(/\d/g)?.length ?? 0) < 10) errors.push('phone');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead.email)) errors.push('email');
  if (!lead.service) errors.push('service');
  if (raw.consent !== 'on') errors.push('consent');
  return { lead, errors };
}

/** "Mary Ann Smith" -> first "Mary", last "Ann Smith". */
export function splitName(full: string) {
  const [firstName, ...rest] = full.split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

/** US numbers to E.164 (+15126780620); anything else is passed through as typed. */
export function toE164(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return phone;
}

/** The contact note: what they asked for, plus the consent record kept as TCPA evidence. */
export function leadNote(lead: Lead, meta: { submittedAt: string; ip?: string; userAgent?: string }) {
  return [
    `Website quote request: ${lead.service}`,
    `Service area: ${lead.serviceArea || '-'}`,
    `Page: ${lead.pageUrl || '-'}`,
    '',
    'Consent to be contacted: YES',
    `Consent text shown: "${lead.consentText || '-'}"`,
    `Submitted: ${meta.submittedAt}`,
    `IP: ${meta.ip || '-'}`,
    `Browser: ${meta.userAgent || '-'}`,
  ].join('\n');
}

// ponytail: self-check, run with `node lib/lead.ts`
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('lib/lead.ts')) {
  const eq = (a: unknown, b: unknown) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${JSON.stringify(a)} !== ${JSON.stringify(b)}`); };
  const ok = validateLead({ name: ' Jane Doe ', phone: '(512) 678-0620', email: 'jane@x.com', service: 'Dryer Vent Cleaning', consent: 'on' });
  eq(ok.errors, []); eq(ok.lead.name, 'Jane Doe');
  eq(validateLead({ name: '', phone: '123', email: 'nope', service: '', consent: undefined }).errors, ['name', 'phone', 'email', 'service', 'consent']);
  eq(splitName('Mary Ann Smith'), { firstName: 'Mary', lastName: 'Ann Smith' });
  eq(splitName('Cher'), { firstName: 'Cher', lastName: '' });
  eq(toE164('(512) 678-0620'), '+15126780620');
  eq(toE164('1 512 678 0620'), '+15126780620');
  eq(toE164('+44 20 7946 0958'), '+44 20 7946 0958');
  eq(validateLead({ name: 'x'.repeat(900), phone: '5126780620', email: 'a@b.co', service: 's', consent: 'on' }).lead.name.length, 500);
  if (!leadNote(ok.lead, { submittedAt: 'now' }).includes('Consent to be contacted: YES')) throw new Error('note lost consent');
  console.log('lead.ts ok');
}
