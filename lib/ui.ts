/**
 * Interface copy: every label, message and screen-reader text the template
 * renders that isn't page content.
 *
 * The live values are edited in Sanity (Site Settings → Interface copy). This
 * file is the single set of defaults: the Studio schema builds its fields and
 * initial values from it, and components fall back to it only when a value is
 * missing. `{name}` tokens are filled in at render time.
 */
export const UI_DEFAULTS = {
  // calls to action
  stickyCallLabel: 'Call Now',
  stickyQuoteLabel: 'Request a Quote',
  servingLabel: 'Serving {area}',
  // contact details
  contactPhoneLabel: 'Phone',
  contactEmailLabel: 'Email',
  contactAreaLabel: 'Service Area',
  contactHoursLabel: 'Hours',
  licenseLabel: 'License #{number}',
  // quote form
  namePlaceholder: 'Full name',
  phonePlaceholder: 'Phone number',
  emailPlaceholder: 'Email',
  servicePlaceholder: 'Service needed',
  serviceOtherOption: 'Not sure / other',
  submitLabel: 'Request My Quote',
  submittingLabel: 'Sending…',
  successTitle: "Thanks, we've got your request.",
  successBody: "We'll reach out shortly, or call",
  errorName: 'Name required',
  errorPhone: 'Valid phone required',
  errorEmail: 'Valid email required',
  errorService: 'Please select a service',
  errorConsent: 'Please agree to continue',
  errorSubmit: 'Something went wrong. Please call',
  srName: 'Full Name',
  srPhone: 'Phone',
  srEmail: 'Email',
  srService: 'Service Needed',
  // ratings, badges, services
  ratingLabel: 'Average rating',
  googleRatingLabel: '{rating} on Google',
  badgeRatingLabel: '{rating} rating',
  reviewCountLabel: '{count} reviews',
  starsLabel: '{count} out of 5 stars',
  serviceCountOne: '{count} service',
  serviceCountMany: '{count} services',
  reviewsWidgetTitle: 'Google reviews',
  // coverage + navigation
  responseTimeLabel: 'Response time',
  nearbyAreasLabel: 'Nearby areas also covered',
  servicesLabel: 'Services',
  serviceAreasLabel: 'Service Areas',
  backToTopLabel: 'Back to top',
  mapTitle: 'Map of the {business} service area in {area}',
  bookingTitle: 'Book an appointment',
  // before / after + video
  beforeLabel: 'Before',
  afterLabel: 'After',
  dragLabel: 'Drag',
  compareLabel: '{title}: drag to compare before and after',
  videoUnmuteLabel: 'Tap to unmute',
  videoMuteLabel: 'Tap to mute',
  // screen-reader labels
  homeLinkLabel: '{business}, home',
  primaryNavLabel: 'Primary',
  legalNavLabel: 'Legal',
  openMenuLabel: 'Open menu',
  closeMenuLabel: 'Close menu',
  closeLabel: 'Close',
  socialLinkLabel: '{business} on {network}',
  filterLabel: 'Filter projects',
} as const;

export type UiKey = keyof typeof UI_DEFAULTS;

/** The Sanity value for `key` (or its default), with `{tokens}` filled in. */
export function uiText(ui: Record<string, string | undefined> | undefined, key: UiKey,
  vars: Record<string, string | number | undefined> = {}): string {
  return (ui?.[key] || UI_DEFAULTS[key])
    .replace(/\{(\w+)\}/g, (token, name) => (vars[name] !== undefined ? String(vars[name]) : token));
}

// ponytail: self-check, run with `node lib/ui.ts`
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('lib/ui.ts')) {
  const eq = (a: string, b: string) => { if (a !== b) throw new Error(`${a} !== ${b}`); };
  eq(uiText(undefined, 'licenseLabel', { number: 'TACLA123' }), 'License #TACLA123');
  eq(uiText({ googleRatingLabel: '{rating} ★ Google' }, 'googleRatingLabel', { rating: '4.9' }), '4.9 ★ Google');
  eq(uiText({ stickyCallLabel: '' }, 'stickyCallLabel'), 'Call Now');            // empty string falls back
  eq(uiText(undefined, 'servingLabel'), 'Serving {area}');                         // unknown token is left visible
  console.log('ui.ts ok');
}
