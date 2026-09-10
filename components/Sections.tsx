import Image from 'next/image';
import Link from 'next/link';
import { PortableText } from '@portabletext/react';
import { urlFor } from '@/sanity/image';
import type { Page, Section, Settings } from '@/lib/types';
import { Arrow, Camera, Check, Clock, Heart, Mail, Phone, Pin, Star } from './icons';
import Reveal from './Reveal';
import HeroBg from './HeroBg';
import BeforeAfter from './BeforeAfter';
import AboutVideo from './AboutVideo';
import FaqList from './FaqList';
import QuoteForm from './QuoteForm';
import MapEmbed from './MapEmbed';
import FilterBar from './FilterBar';

type Ctx = { settings: Settings; page: Page };
/* eslint-disable @typescript-eslint/no-explicit-any */
const f = (s: Section, k: string) => (s as any)[k];

export function Sections({ page, settings }: Ctx) {
  return <>{(page.sections ?? []).map(s => (
    <SectionSwitch key={s._key} section={s} page={page} settings={settings} />
  ))}</>;
}

function SectionSwitch({ section: s, page, settings }: Ctx & { section: Section }) {
  const areaLabel = page.isHome ? 'Austin (Home)' : page.title;
  switch (s._type) {
    case 'heroSection': return <Hero s={s} settings={settings} areaLabel={areaLabel} />;
    case 'innerHero': return <InnerHero s={s} />;
    case 'statementSection': return <Statement s={s} />;
    case 'servicesSection': return <Services s={s} settings={settings} />;
    case 'ctaBand': return <CtaBand s={s} settings={settings} />;
    case 'proofSection': return <Proof s={s} settings={settings} />;
    case 'faqSection': return <Faq s={s} />;
    case 'aboutSection': return <About s={s} settings={settings} />;
    case 'areaSection': return <Area s={s} settings={settings} />;
    case 'reviewsSection': return <Reviews s={s} />;
    case 'quoteSection': return <Quote s={s} settings={settings} areaLabel={areaLabel} />;
    case 'proseSection': return <Prose s={s} />;
    case 'breakdownSection': return <Breakdown s={s} />;
    case 'filterBar': return <FilterBar filters={f(s, 'filters') ?? []} />;
    case 'photoSection': return <Photos s={s} />;
    case 'mapSection': return <MapBlock s={s} settings={settings} />;
    case 'bookingSection': return <Booking s={s} settings={settings} />;
    default: return null;
  }
}

/** Parse a raw inline style string into a React style object. Several sections
 *  and headings in the original carry inline styles that no CSS rule covers. */
const inline = (css?: string): React.CSSProperties | undefined => {
  if (!css) return undefined;
  const out: Record<string, string> = {};
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const val = decl.slice(i + 1).trim();
    if (!prop || !val) continue;
    out[prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = val;
  }
  return out;
};

/** Button icons have no CSS rule in the ported stylesheet; the original sizes
 *  them inline. Without this the svg collapses to zero. */
const IconBox = ({ size, children }: { size: number; children: React.ReactNode }) => (
  <span style={{ width: size, height: size, display: 'inline-flex', flexShrink: 0 }}>{children}</span>
);

/** Renders a heading whose trailing phrase is emphasised, e.g.
 *  `Get Your <em>Free Quote</em>`. The emphasis is styled by the ported CSS. */
const FormTitle = ({ s }: { s: Section }) => {
  const full = String(f(s, 'formHeading') ?? '');
  const em = f(s, 'formHeadingEmphasis') as string | undefined;
  if (!full) return null;
  const lead = em && full.endsWith(em) ? full.slice(0, -em.length) : full;
  return <p className="form-title">{lead}{em && <em>{em}</em>}</p>;
};

const hasHead = (s: Section) => !!(f(s, 'eyebrow') || f(s, 'heading') || f(s, 'subheading'));

const Head = ({ s }: { s: Section }) => (
  <div className={`section-head${f(s, 'headVariant') ? ' ' + f(s, 'headVariant') : ''}`}>
    {f(s, 'eyebrow') && <span className="eyebrow">{f(s, 'eyebrow')}</span>}
    {f(s, 'heading') && <h2>{f(s, 'heading')}</h2>}
    {f(s, 'subheading') && <p>{f(s, 'subheading')}</p>}
  </div>
);

/* Trust-bar icons are chosen in Sanity by key; the glyphs stay in code. */
const TRUST_ICONS: Record<string, () => React.JSX.Element> = {
  clock: Clock, pin: Pin, camera: Camera, heart: Heart,
};

function Hero({ s, settings, areaLabel }: { s: Section; settings: Settings; areaLabel: string }) {
  const images = f(s, 'images') ?? [];
  const trust = settings.trustItems ?? [];
  return (
    <>
      <section className="hero-section">
        <HeroBg images={images} />
        <div className="hero-overlay" />
        <div className="hero-grid">
          <div className="hero-copy">
            <h1>{(f(s, 'headingLines') ?? []).map((l: string, i: number) => (
              <span key={i}>{i > 0 && <br />}{l}</span>))}</h1>
            <p>{f(s, 'intro')}</p>
          </div>
          <div className="hero-card" id="hero-quote">
            <FormTitle s={s} />
            <QuoteForm settings={settings} formId="heroForm"
              serviceArea={areaLabel} consentText={f(s, 'consentText')} />
          </div>
        </div>
      </section>
      <div className="trustbar-wrap">
        <div className="container">
          <Reveal>
            <div className="trustbar-grid">
              {trust.map(({ title, sub, icon }) => {
                const Icon = TRUST_ICONS[icon ?? ''] ?? Clock;
                return (
                  <div className="trust-item" key={title}>
                    <Icon /><span><strong>{title}</strong><small>{sub}</small></span>
                  </div>
                );
              })}
            </div>
            <div className="trustbar-marquee">
              <div className="trustbar-marquee-track animate-marquee">
                {[...trust, ...trust].map(({ title, icon }, i) => {
                  const Icon = TRUST_ICONS[icon ?? ''] ?? Clock;
                  return <div className="trust-item-m" key={i}><Icon /><strong>{title}</strong></div>;
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </>
  );
}

const centeredMargins = (s: Section) =>
  f(s, 'centered') !== false ? { marginLeft: 'auto', marginRight: 'auto' } : undefined;

const InnerHero = ({ s }: { s: Section }) => {
  const img = f(s, 'image');
  return (
    <section className="service-hero">
      {img && <div className="bg-img"><Image src={urlFor(img).width(1920).quality(78).url()}
        alt={img.alt ?? ''} fill priority sizes="100vw" /></div>}
      <div className="hero-scrim" />
      <div className="service-hero-inner"
        style={f(s, 'centered') !== false ? { textAlign: 'center' } : undefined}>
        {/* the hero is pre-revealed in the original rather than waiting for scroll */}
        <div className="reveal in">
          {f(s, 'eyebrow') && <span className="eyebrow">{f(s, 'eyebrow')}</span>}
          <h1 style={centeredMargins(s)}>{f(s, 'heading')}</h1>
          {f(s, 'intro') && <p className="intro" style={centeredMargins(s)}>{f(s, 'intro')}</p>}
        </div>
      </div>
    </section>
  );
};

const Statement = ({ s }: { s: Section }) => {
  const text = String(f(s, 'text') ?? '');
  const em = f(s, 'emphasis') as string | undefined;
  const lead = em && text.endsWith(em) ? text.slice(0, -em.length) : text;
  return (
    <section className="statement">
      <div className="container">
        <Reveal>
          <h2>
            {lead}
            {em && (
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <em>{em}</em>
                <svg className="underline" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M4 16 Q 90 2, 150 10 T 296 8" fill="none" stroke="var(--gold)"
                    strokeWidth="4" strokeLinecap="round" /></svg>
              </span>
            )}
          </h2>
        </Reveal>
      </div>
    </section>
  );
};

const Services = ({ s, settings }: { s: Section; settings: Settings }) => (
  <section className="services-section" id="services">
    <div className="container">
      <Reveal><Head s={s} /></Reveal>
      <div className="services-grid">
        {(settings.serviceCategories ?? []).map(c => (
          <Reveal key={c.id}>
            <div className="service-card" id={c.id}>
              <div className="img-wrap">
                {c.image && <Image src={urlFor(c.image).width(700).url()} alt={c.title} fill
                  sizes="(max-width: 720px) 100vw, 30vw"
                  placeholder={c.image.asset?.metadata?.lqip ? 'blur' : 'empty'}
                  blurDataURL={c.image.asset?.metadata?.lqip} />}
              </div>
              <div className="body">
                <h3>{c.title}</h3><p>{c.blurb}</p>
                <Link href={c.href ?? '#'} className="learn-more">
                  {settings.ui?.learnMoreLabel ?? 'Learn More'}<Arrow /></Link>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      {f(s, 'ctaLabel') && (
        <div className="center-cta">
          <Link href={f(s, 'ctaHref') ?? '#hero-quote'} className="btn-gold lg">{f(s, 'ctaLabel')}</Link>
        </div>
      )}
    </div>
  </section>
);

const CtaBand = ({ s, settings }: { s: Section; settings: Settings }) => {
  const img = f(s, 'image');
  const parallax = f(s, 'parallax') !== false;
  const url = img ? urlFor(img).width(1920).quality(70).url() : undefined;
  return (
    <section className={`cta-band${parallax ? ' parallax' : ''}`}>
      {/* parallax relies on background-attachment: fixed, which needs a CSS
          background rather than an <img> child */}
      {parallax || !url ? (
        <div className="bg-img" style={url ? { backgroundImage: `url(${url})` } : undefined} />
      ) : f(s, 'directImage') ? (
        /* landing band 2: the <img> *is* the .bg-img element, so next/image
           (which injects its own wrapper styles) cannot stand in for it */
        // eslint-disable-next-line @next/next/no-img-element
        <img className="bg-img cta-band2-img" src={url} alt="" aria-hidden="true" loading="lazy" />
      ) : (
        <div className="bg-img">
          <Image src={url} alt="" fill sizes="100vw" aria-hidden="true" />
        </div>
      )}
      {/* inner pages set the overlay in CSS; landing pages set it inline */}
      <div className="overlay" style={f(s, 'overlayOpacity') != null
        ? { background: `rgba(23,20,15,${f(s, 'overlayOpacity')})` } : undefined} />
      <div className="cta-band-inner">
        <Reveal>
          <h2>{f(s, 'heading')}</h2>
          <div className="cta-band-buttons">
            {f(s, 'showCall') !== false && (
              <a href={settings.phoneHref} className="btn-gold lg">
                <IconBox size={18}><Phone /></IconBox>
                {settings.ui?.stickyCallLabel ?? 'Call Now'}: {settings.phone}
              </a>
            )}
            {f(s, 'ctaLabel') && (
              <Link href={f(s, 'ctaHref') ?? '#quote'} className="btn-outline-dark lg">{f(s, 'ctaLabel')}</Link>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

const Proof = ({ s, settings }: { s: Section; settings: Settings }) => (
  <section className="gallery-section" id="proof" data-category={f(s, 'category') || undefined}
    style={inline(f(s, 'sectionStyle'))}>
    <div className="container">
      {hasHead(s) && <Reveal><Head s={s} /></Reveal>}
      <div className={`gallery-grid${
        ((f(s, 'projects') ?? []).length + (f(s, 'videos') ?? []).length) === 1 ? ' single' : ''}`}>
        {(f(s, 'projects') ?? []).map((p: any) => (
          <Reveal key={p._id}>
            <BeforeAfter title={p.title} caption={p.caption}
              before={p.beforeImage} after={p.afterImage}
              labels={{ before: settings.ui?.beforeLabel, after: settings.ui?.afterLabel,
                        drag: settings.ui?.dragLabel, captionPrefix: settings.ui?.dragCaptionPrefix }} />
          </Reveal>
        ))}
        {(f(s, 'videos') ?? []).map((v: any) => (
          <Reveal key={v._id}>
            <figure className="gallery-card">
              <div className="gallery-video">
                <video src={v.videoUrl} autoPlay muted loop playsInline />
              </div>
              <figcaption><h4>{v.title}</h4><p>{v.caption}</p></figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
      {f(s, 'ctaLabel') && (
        <div className="center-cta">
          <Link href={f(s, 'ctaHref') ?? '/projects'} className="btn-outline">
            {f(s, 'ctaLabel')}
            <IconBox size={16}><Arrow /></IconBox>
          </Link>
        </div>
      )}
    </div>
  </section>
);

const Faq = ({ s }: { s: Section }) => (
  <section className="faq-section" id="faq" style={inline(f(s, 'sectionStyle'))}>
    <div className="faq-wrap">
      <Reveal>
        <h2 style={inline(f(s, 'headingStyle'))}>{f(s, 'heading')}</h2>
        <FaqList faqs={f(s, 'faqs') ?? []} groups={f(s, 'groups')} />
        {f(s, 'ctaLabel') && (
          <div className="faq-cta">
            <Link href={f(s, 'ctaHref') ?? '#quote'} className="btn-gold lg">{f(s, 'ctaLabel')}</Link>
          </div>
        )}
      </Reveal>
    </div>
  </section>
);

const About = ({ s, settings }: { s: Section; settings: Settings }) => {
  const v = f(s, 'video');
  return (
    <section className="about-section" id="about">
      <div className="about-grid">
        <Reveal>
          <h2>{(() => {
            const full = String(f(s, 'heading') ?? '');
            const em = f(s, 'headingEmphasis') as string | undefined;
            const lead = em && full.endsWith(em) ? full.slice(0, -em.length) : full;
            return <>{lead}{em && <em>{em}</em>}</>;
          })()}</h2>
          <p>{f(s, 'intro')}</p>
          <ul className="about-points">
            {(f(s, 'bullets') ?? []).map((b: string) => <li key={b}><Check />{b}</li>)}
          </ul>
          {(f(s, 'ctaLabel') || f(s, 'showCall')) && (
            <div className="about-cta">
              {f(s, 'ctaLabel') && (
                <Link href={f(s, 'ctaHref') ?? '#quote'} className="btn-gold">{f(s, 'ctaLabel')}</Link>
              )}
              {f(s, 'showCall') && (
                <a href={settings.phoneHref} className="btn-outline-dark">
                  <IconBox size={18}><Phone /></IconBox>
                  {settings.ui?.aboutCallLabel ?? 'Call Now'}</a>
              )}
            </div>
          )}
        </Reveal>
        {v && (
          <Reveal><AboutVideo src={v.videoUrl}
            unmuteLabel={settings.ui?.videoUnmuteLabel} muteLabel={settings.ui?.videoMuteLabel} /></Reveal>
        )}
      </div>
    </section>
  );
};

const Area = ({ s, settings }: { s: Section; settings: Settings }) => (
  <section className="area-section" id="area">
    <div className="container">
      <Reveal><Head s={s} /></Reveal>
      <Reveal>
        <div className="area-tags">
          {(settings.serviceAreas ?? []).map(a => (
            <span className="area-tag" key={a.name}><Pin />{a.name}</span>
          ))}
          {settings.serviceAreasNote && (
            <span className="area-tag extra">{settings.serviceAreasNote}</span>
          )}
        </div>
      </Reveal>
      <Reveal>
        <div className="map-frame">
          <MapEmbed query={f(s, 'mapQuery') ?? 'Austin,TX'} label={settings.businessName} />
        </div>
      </Reveal>
      {f(s, 'ctaLabel') && (
        <div className="center-cta">
          <Link href={f(s, 'ctaHref') ?? '#quote'} className="btn-gold lg">{f(s, 'ctaLabel')}</Link>
        </div>
      )}
    </div>
  </section>
);

const Reviews = ({ s }: { s: Section }) => (
  <section className="reviews-section" id="reviews">
    <div className="container">
      <Reveal><Head s={s} /></Reveal>
      <div className="reviews-grid">
        {(f(s, 'reviews') ?? []).map((r: any) => (
          <Reveal key={r._id}>
            <article className="review-card">
              <div className="review-stars">{Array.from({ length: r.rating ?? 5 })
                .map((_, i) => <Star key={i} />)}</div>
              <p className="quote">&quot;{r.quote}&quot;</p>
              <div className="review-author">
                <span className="review-avatar">{r.initials}</span><span>{r.author}</span>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      {f(s, 'ctaLabel') && (
        <div className="center-cta">
          <Link href={f(s, 'ctaHref') ?? '#quote'} className="btn-gold lg">{f(s, 'ctaLabel')}</Link>
        </div>
      )}
    </div>
  </section>
);

const CONTACT_ICONS = { phone: Phone, mail: Mail, pin: Pin, clock: Clock };

const Quote = ({ s, settings, areaLabel }: { s: Section; settings: Settings; areaLabel: string }) => {
  const ui = settings.ui ?? {};
  const items = [
    { Icon: CONTACT_ICONS.phone, label: ui.contactPhoneLabel, value: settings.phone, href: settings.phoneHref },
    { Icon: CONTACT_ICONS.mail, label: ui.contactEmailLabel, value: settings.email, href: `mailto:${settings.email}` },
    { Icon: CONTACT_ICONS.pin, label: ui.contactAreaLabel, value: settings.serviceAreaLabel },
    { Icon: CONTACT_ICONS.clock, label: ui.contactHoursLabel, value: settings.hours },
  ].filter(i => i.value);

  return (
    <section className="quote-section" id="quote" style={inline(f(s, 'sectionStyle'))}>
      <div className="quote-grid">
          <Reveal>
            {f(s, 'eyebrow') && <span className="eyebrow">{f(s, 'eyebrow')}</span>}
            <h2>{f(s, 'heading')}</h2>
            {f(s, 'subheading') && <p>{f(s, 'subheading')}</p>}
            {f(s, 'showContactDetails') !== false && (
              <div className="contact-list">
                {items.map(({ Icon, label, value, href }) => {
                  const inner = (<><span className="contact-icon"><Icon /></span>
                    <div><span className="label">{label}</span><strong>{value}</strong></div></>);
                  return href
                    ? <a className="contact-item" href={href} key={label}>{inner}</a>
                    : <div className="contact-item" key={label}>{inner}</div>;
                })}
              </div>
            )}
          </Reveal>
          <Reveal>
            <div className="quote-form-card">
              <FormTitle s={s} />
              <QuoteForm settings={settings} formId="quoteForm"
                serviceArea={areaLabel} consentText={f(s, 'consentText')} />
            </div>
        </Reveal>
      </div>
    </section>
  );
};

const Breakdown = ({ s }: { s: Section }) => (
  <section className="breakdown-section">
    <div className="container">
      <Reveal><Head s={s} /></Reveal>
      <div className={`breakdown-grid${(f(s, 'cards') ?? []).length === 1 ? ' single' : ''}`}>
        {(f(s, 'cards') ?? []).map((c: any) => (
          <Reveal key={c._key}>
            <div className="breakdown-card"><h3>{c.title}</h3><p>{c.body}</p></div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

const Photos = ({ s }: { s: Section }) => (
  <section className="photo-section" data-category={f(s, 'category') || undefined}>
    <div className="container">
      {hasHead(s) && <Reveal><Head s={s} /></Reveal>}
      <Reveal>
        <div className="photo-grid">
          {(f(s, 'photos') ?? []).map((ph: any) => (
            <div className="photo-card" key={ph._key}>
              <Image src={urlFor(ph.image).width(700).url()} alt={ph.alt ?? ph.caption ?? ''}
                width={700} height={525} sizes="(max-width: 720px) 100vw, 33vw"
                placeholder={ph.image?.asset?.metadata?.lqip ? 'blur' : 'empty'}
                blurDataURL={ph.image?.asset?.metadata?.lqip} />
              <span className="photo-caption">{ph.caption}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  </section>
);

const MapBlock = ({ s, settings }: { s: Section; settings: Settings }) => (
  <section className="map-section">
    <div className="container">
      <Reveal><Head s={s} /></Reveal>
      <Reveal>
        <div className="map-frame">
          <MapEmbed query={f(s, 'mapQuery') ?? 'Austin,TX'} label={settings.businessName} />
        </div>
      </Reveal>
    </div>
  </section>
);

const Prose = ({ s }: { s: Section }) => (
  <section className="city-info-section">
    <div className="city-info-wrap">
      <Reveal>
        {f(s, 'eyebrow') && <span className="eyebrow">{f(s, 'eyebrow')}</span>}
        {f(s, 'heading') && <h2>{f(s, 'heading')}</h2>}
        <PortableText value={f(s, 'body') ?? []} />
      </Reveal>
    </div>
  </section>
);

const Booking = ({ s, settings }: { s: Section; settings: Settings }) => {
  const url = settings.integrations?.calendarEmbedUrl;
  if (!url) return null;   // no calendar configured -> section renders nothing
  return (
    <section className="booking-section" id="booking">
      <div className="container">
        <Reveal><Head s={s} /></Reveal>
        <iframe src={url} title={f(s, 'buttonLabel') ?? 'Book an appointment'} loading="lazy"
          style={{ width: '100%', minHeight: 700, border: 'none' }} />
      </div>
    </section>
  );
};
