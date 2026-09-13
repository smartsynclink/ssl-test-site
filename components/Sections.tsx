import Image from 'next/image';
import Link from 'next/link';
import { PortableText } from '@portabletext/react';
import { urlFor } from '@/sanity/image';
import type { Page, Section, Settings } from '@/lib/types';
import { uiText, type UiKey } from '@/lib/ui';
import { ArrowRight, Camera, Check, Clock, Facebook, GoogleG, Heart, Instagram, Mail, Phone, Pin, Play, Shield, Star, Yelp } from './icons';
import Needed from './Needed';
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
/** Interface copy from Site Settings (falls back to lib/ui.ts defaults). */
const t = (settings: Settings, key: UiKey, vars?: Record<string, string | number | undefined>) =>
  uiText(settings.ui, key, vars);

export function Sections({ page, settings }: Ctx) {
  return <>{(page.sections ?? []).map(s => (
    <SectionSwitch key={s._key} section={s} page={page} settings={settings} />
  ))}</>;
}

/** The service area a city page belongs to, matched on slug. */
const areaFor = (page: Page, settings: Settings) =>
  (settings.serviceAreas ?? []).find(a => a.slug && a.slug === page.slug?.current);

/** The service_area value sent with every lead from this page: the city on a city
 *  page, the business's service area everywhere else. */
export const areaLabelFor = (page: Page, settings: Settings) =>
  areaFor(page, settings)?.name ?? settings.serviceAreaLabel ?? page.title;

function SectionSwitch({ section: s, page, settings }: Ctx & { section: Section }) {
  const areaLabel = areaLabelFor(page, settings);
  const city = areaFor(page, settings)?.name;
  switch (s._type) {
    case 'heroSection': return f(s, 'layout') === 'split'
      ? <HeroSplit s={s} settings={settings} areaLabel={areaLabel} />
      : <HeroShowcase s={s} settings={settings} page={page} />;
    case 'innerHero': return <PageHero s={s} settings={settings} />;
    case 'trustBar': return <TrustBar settings={settings} />;
    case 'badgesSection': return <Badges s={s} settings={settings} />;
    case 'statementSection': return <Statement s={s} />;
    case 'servicesSection': return <Services s={s} settings={settings} />;
    case 'ctaBand': return <CtaBand s={s} settings={settings} />;
    case 'proofSection': return <Proof s={s} settings={settings} city={city} />;
    case 'faqSection': return <Faq s={s} />;
    case 'aboutSection': return <About s={s} settings={settings} />;
    case 'areaSection': return <Area s={s} settings={settings} />;
    case 'reviewsSection': return <Reviews s={s} settings={settings} city={city} />;
    case 'quoteSection': return <Quote s={s} settings={settings} areaLabel={areaLabel} />;
    case 'proseSection': return <Prose s={s} />;
    case 'breakdownSection': return <Breakdown s={s} />;
    case 'relatedServices': return <RelatedServices s={s} settings={settings} page={page} />;
    case 'coverageSection': return <Coverage s={s} settings={settings} page={page} />;
    case 'internalLinks': return <InternalLinks s={s} settings={settings} page={page} />;
    case 'filterBar': return <FilterBar filters={f(s, 'filters') ?? []} label={t(settings, 'filterLabel')} />;
    case 'photoSection': return <Photos s={s} />;
    case 'mapSection': return <MapBlock s={s} settings={settings} />;
    case 'bookingSection': return <Booking s={s} settings={settings} />;
    default: return null;
  }
}

/* ---------- shared pieces ---------- */

/** Splits `text` so a trailing `em` phrase can be highlighted in gold. */
const Emph = ({ text, em }: { text?: string; em?: string }) => {
  const full = String(text ?? '');
  const lead = em && full.endsWith(em) ? full.slice(0, -em.length) : full;
  return <>{lead}{em && full.endsWith(em) && <em>{em}</em>}</>;
};

const Btn = ({ href, children, variant = 'primary', icon = true }: {
  href: string; children: React.ReactNode; variant?: string; icon?: boolean;
}) => {
  const cls = `btn btn-${variant}`;
  const inner = <>{children}{icon && <span className="btn-ico"><ArrowRight /></span>}</>;
  return href.startsWith('/') || href.startsWith('#')
    ? <Link href={href} className={cls}>{inner}</Link>
    : <a href={href} className={cls}>{inner}</a>;
};

const CallBtn = ({ settings, variant = 'outline', label }: {
  settings: Settings; variant?: string; label?: string;
}) => (
  <a href={settings.phoneHref} className={`btn btn-${variant}`}>
    <Phone />{label ? `${label}: ` : ''}{settings.phone}
  </a>
);

const NEEDED = '[CONTENT NEEDED]';
/** Sanity copy that still reads "[CONTENT NEEDED] ..." renders as the placeholder chip. */
const txt = (v?: string) =>
  typeof v === 'string' && v.startsWith(NEEDED) ? <Needed what={v.slice(NEEDED.length).trim()} /> : v;

const compareLabels = (settings: Settings, title: string) => ({
  before: t(settings, 'beforeLabel'), after: t(settings, 'afterLabel'), drag: t(settings, 'dragLabel'),
  compare: t(settings, 'compareLabel', { title }),
});
const mapTitle = (settings: Settings) =>
  t(settings, 'mapTitle', { business: settings.businessName, area: settings.serviceAreaLabel });

const hasHead = (s: Section) => !!(f(s, 'eyebrow') || f(s, 'heading') || f(s, 'subheading'));

/** Section heading block. `action` sits opposite the copy on wide screens. */
const Head = ({ s, action, center }: { s: Section; action?: React.ReactNode; center?: boolean }) => (
  <Reveal>
    <div className={`section-head${center ? ' center' : ''}${action ? ' split' : ''}`}>
      <div className="section-head-copy">
        {f(s, 'eyebrow') && <span className="eyebrow">{f(s, 'eyebrow')}</span>}
        {f(s, 'heading') && <h2>{txt(f(s, 'heading'))}</h2>}
        {f(s, 'subheading') && <p className="lede">{txt(f(s, 'subheading'))}</p>}
      </div>
      {action && <div className="section-head-action">{action}</div>}
    </div>
  </Reveal>
);

const FormTitle = ({ s }: { s: Section }) =>
  f(s, 'formHeading')
    ? <p className="form-title"><Emph text={f(s, 'formHeading')} em={f(s, 'formHeadingEmphasis')} /></p>
    : null;

/* Trust-bar icons are chosen in Sanity by key; the glyphs stay in code. */
const TRUST_ICONS: Record<string, () => React.JSX.Element> = {
  clock: Clock, pin: Pin, camera: Camera, heart: Heart, shield: Shield, star: Star,
};

/* ---------- sections ---------- */

function HeroSplit({ s, settings, areaLabel }: { s: Section; settings: Settings; areaLabel: string }) {
  const lines: string[] = f(s, 'headingLines') ?? [];
  const trust = settings.trustItems ?? [];
  return (
    <section className="sheet hero">
      <HeroBg images={f(s, 'images') ?? []} />
      <div className="container hero-grid">
        <div className="hero-copy">
          {settings.serviceAreaLabel && <span className="eyebrow">{t(settings, 'servingLabel', { area: settings.serviceAreaLabel })}</span>}
          <h1 className="hero-title">{lines.map((l, i) => (
            <span key={i} className={i === lines.length - 1 && lines.length > 1 ? 'accent' : undefined}>{l}</span>
          ))}</h1>
          {f(s, 'intro') && <p className="lede">{f(s, 'intro')}</p>}
          <div className="btn-row">
            <Btn href="#hero-quote">{settings.headerCtaLabel || t(settings, 'stickyQuoteLabel')}</Btn>
            <CallBtn settings={settings} />
          </div>
          {settings.hours && (
            <ul className="hero-meta">
              <li><Clock />{settings.hours}</li>
            </ul>
          )}
        </div>
        <div className="form-card" id="hero-quote">
          <FormTitle s={s} />
          <QuoteForm settings={settings} formId="heroForm"
            serviceArea={areaLabel} consentText={f(s, 'consentText')} />
        </div>
      </div>
      {trust.length > 0 && (
        <div className="container">
          <ul className="trust-grid">
            {trust.map(({ title, sub, icon }) => {
              const Icon = TRUST_ICONS[icon ?? ''] ?? Clock;
              return (
                <li className="trust-tile" key={title}>
                  <span className="icon-tile"><Icon /></span>
                  <span><strong>{title}</strong>{sub && <small>{sub}</small>}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

const HeadlineTag = ({ h1, className, children }: { h1: boolean; className: string; children: React.ReactNode }) =>
  h1 ? <h1 className={className}>{children}</h1> : <p className={className}>{children}</p>;

/** Leading figure of a trust title, e.g. "5+ Years Experience" -> ["5+", "Years Experience"]. */
const splitStat = (title: string) => title.match(/^(\S*\d\S*)\s+(.+)$/)?.slice(1) as [string, string] | undefined;

/** Showcase hero: copy on the left, a bento of real work on the right. It borrows
 *  the first project and the reviews from sections further down the same page, so
 *  it needs no content of its own beyond the regular hero fields. */
function HeroShowcase({ s, settings, page }: { s: Section; settings: Settings; page: Page }) {
  const lines: string[] = f(s, 'headingLines') ?? [];
  const sections = page.sections ?? [];
  const project = sections.flatMap(x => x._type === 'proofSection' ? f(x, 'projects') ?? [] : [])[0];
  const reviews: any[] = sections.flatMap(x => x._type === 'reviewsSection' ? f(x, 'reviews') ?? [] : []);
  const avg = reviews.length ? reviews.reduce((t, r) => t + (r.rating ?? 5), 0) / reviews.length : 0;
  const trust = settings.trustItems ?? [];
  const statItem = trust.find(t => splitStat(t.title));
  const stat = statItem && splitStat(statItem.title);
  const quoteHref = sections.some(x => x._type === 'quoteSection')
    ? '#quote' : settings.headerCtaHref ?? '/contact#quote';

  return (
    <section className="sheet hero hero-showcase">
      <div className="container showcase-grid">
        <div className="hero-copy">
          {/* Blueprint H1 = main service + city. When a separate H1 is set the
              headline above it becomes display text; otherwise it is the H1. */}
          {f(s, 'h1')
            ? <h1 className="eyebrow hero-h1">{f(s, 'h1')}</h1>
            : settings.serviceAreaLabel && <span className="eyebrow">{t(settings, 'servingLabel', { area: settings.serviceAreaLabel })}</span>}
          <HeadlineTag className="hero-title" h1={!f(s, 'h1')}>{lines.map((l, i) => (
            <span key={i} className={i === lines.length - 1 && lines.length > 1 ? 'accent' : undefined}>{l}</span>
          ))}</HeadlineTag>
          {f(s, 'intro') && <p className="lede">{f(s, 'intro')}</p>}
          <div className="btn-row">
            <Btn href={quoteHref}>{f(s, 'formHeading') || settings.headerCtaLabel || t(settings, 'stickyQuoteLabel')}</Btn>
            <CallBtn settings={settings} />
          </div>
          <ul className="proof-row">
            {avg > 0 && (
              <li className="proof-rating"><Stars n={Math.round(avg)} label={t(settings, 'starsLabel', { count: Math.round(avg) })} /><strong>{avg.toFixed(1)}</strong>
                <span>{t(settings, 'ratingLabel')}</span></li>
            )}
            {trust.filter(t => t !== statItem).slice(0, 2).map(({ title, icon }) => {
              const Icon = TRUST_ICONS[icon ?? ''] ?? Clock;
              return <li key={title}><Icon />{title}</li>;
            })}
          </ul>
        </div>

        <div className="bento">
          <div className="bento-tall">
            {project
              ? <BeforeAfter title={project.title} before={project.beforeImage} after={project.afterImage}
                  labels={compareLabels(settings, project.title)} priority />
              : <div className="bento-photo"><HeroBg images={f(s, 'images') ?? []} sizes="(max-width: 1080px) 100vw, 30vw" /></div>}
          </div>
          {stat && statItem && (
            <div className="bento-stat">
              <span className="bento-stat-top">{statItem.sub}</span>
              <span><strong>{stat[0]}</strong><small>{stat[1]}</small></span>
            </div>
          )}
          <div className="bento-photo">
            <HeroBg images={f(s, 'images') ?? []} sizes="(max-width: 1080px) 50vw, 25vw" />
            {settings.serviceAreaLabel && <span className="pill-tag left bottom"><Pin />{settings.serviceAreaLabel}</span>}
          </div>
        </div>
      </div>
    </section>
  );
}

const PageHero = ({ s, settings }: { s: Section; settings: Settings }) => {
  const img = f(s, 'image');
  const h1 = f(s, 'h1');
  return (
    <section className="page-hero">
      <div className={`page-hero-card${f(s, 'centered') !== false ? ' center' : ''}`}>
        {img && <Image src={urlFor(img).width(1920).quality(78).url()} alt={img.alt ?? ''}
          fill priority sizes="100vw" className="page-hero-img" />}
        <div className="page-hero-copy">
          {h1
            ? <h1 className="eyebrow on-dark hero-h1">{h1}</h1>
            : f(s, 'eyebrow') && <span className="eyebrow on-dark">{f(s, 'eyebrow')}</span>}
          <HeadlineTag className="page-hero-title" h1={!h1}>{f(s, 'heading')}</HeadlineTag>
          {f(s, 'intro') && <p className="lede">{f(s, 'intro')}</p>}
          {f(s, 'showCtas') !== false && (
            <div className="btn-row">
              <Btn href="#quote">{settings.headerCtaLabel || t(settings, 'stickyQuoteLabel')}</Btn>
              <CallBtn settings={settings} variant="glass" label={t(settings, 'stickyCallLabel')} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const Statement = ({ s }: { s: Section }) => (
  <section className="band-dark statement">
    <div className="container">
      <Reveal><p className="statement-text"><Emph text={f(s, 'text')} em={f(s, 'emphasis')} /></p></Reveal>
    </div>
  </section>
);

const Services = ({ s, settings }: { s: Section; settings: Settings }) => (
  <section className="sheet services" id="services">
    <div className="container">
      <Head s={s} action={f(s, 'ctaLabel') &&
        <Btn href={f(s, 'ctaHref') ?? '#hero-quote'} variant="outline">{f(s, 'ctaLabel')}</Btn>} />
      <div className="service-grid">
        {(settings.serviceCategories ?? []).map(c => (
          <Reveal key={c.id}>
            <Link href={c.href ?? '#'} className="service-card" id={c.id}>
              {c.image && <Image src={urlFor(c.image).width(1000).url()} alt="" fill
                sizes="(max-width: 860px) 100vw, 60vw"
                placeholder={c.image.asset?.metadata?.lqip ? 'blur' : 'empty'}
                blurDataURL={c.image.asset?.metadata?.lqip} />}
              {!!c.services?.length && (
                <span className="pill-tag left">
                  {t(settings, c.services.length === 1 ? 'serviceCountOne' : 'serviceCountMany', { count: c.services.length })}
                </span>
              )}
              <span className="service-card-body">
                <span>
                  <h3>{c.title}</h3>
                  {c.blurb && <p>{c.blurb}</p>}
                </span>
                <span className="round-arrow" aria-hidden="true"><ArrowRight /></span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

const CtaBand = ({ s, settings }: { s: Section; settings: Settings }) => {
  const img = f(s, 'image');
  return (
    <section className="cta-island">
      <div className="cta-card">
        {img && <Image src={urlFor(img).width(1920).quality(72).url()} alt="" fill sizes="100vw"
          aria-hidden="true" className="cta-img" />}
        <Reveal>
          <div className="cta-copy">
            <h2>{f(s, 'heading')}</h2>
            <div className="btn-row center">
              {f(s, 'showCall') !== false && (
                <CallBtn settings={settings} variant="primary" label={t(settings, 'stickyCallLabel')} />
              )}
              {f(s, 'ctaLabel') && (
                <Btn href={f(s, 'ctaHref') ?? '#quote'} variant="glass">{f(s, 'ctaLabel')}</Btn>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

const Proof = ({ s, settings, city }: { s: Section; settings: Settings; city?: string }) => {
  const all = f(s, 'projects') ?? [];
  const local = f(s, 'local') && city ? all.filter((p: any) => p.city === city) : all;
  // no jobs tagged to this city yet: keep the general work, flag the gap
  const projects = local.length ? local : all;
  const missingLocal = f(s, 'local') && city && !local.length;
  const videos = f(s, 'videos') ?? [];
  const cta = f(s, 'ctaLabel') &&
    <Btn href={f(s, 'ctaHref') ?? '/projects'} variant="outline-light">{f(s, 'ctaLabel')}</Btn>;
  return (
    <section className="band-dark proof" id="proof" data-category={f(s, 'category') || undefined}>
      <div className="container">
        {hasHead(s) && <Head s={s} action={cta} />}
        {missingLocal && <Needed block what={`Before & after jobs done in ${city} (tag projects with their city)`} />}
        {projects.length + videos.length === 0 && <Needed block what="Before & after photos of this service" />}
        <div className={`work-grid${projects.length + videos.length === 1 ? ' single' : ''}`}>
          {projects.map((p: any) => (
            <Reveal key={p._id}>
              <BeforeAfter title={p.title} caption={p.caption}
                before={p.beforeImage} after={p.afterImage}
                labels={compareLabels(settings, p.title)} />
            </Reveal>
          ))}
          {videos.map((v: any) => (
            <Reveal key={v._id}>
              <figure className="work-card">
                <div className="work-media">
                  <video src={v.videoUrl} autoPlay muted loop playsInline
                    poster={v.poster ? urlFor(v.poster).width(1100).url() : undefined} />
                  <span className="pill-tag left icon-only" aria-hidden="true"><Play /></span>
                </div>
                <figcaption><h3>{v.title}</h3>{v.caption && <p>{v.caption}</p>}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        {!hasHead(s) && cta && <div className="after-grid">{cta}</div>}
      </div>
    </section>
  );
};

const Faq = ({ s }: { s: Section }) => {
  // the FAQs page carries its title in the page hero, so the intro column is optional
  const intro = hasHead(s) || f(s, 'ctaLabel');
  return (
    <section className="sheet faq" id="faq">
      <div className={`container faq-layout${intro ? '' : ' solo'}`}>
        {intro && (
          <Reveal>
            <div className="faq-intro">
              {f(s, 'eyebrow') && <span className="eyebrow">{f(s, 'eyebrow')}</span>}
              {f(s, 'heading') && <h2>{f(s, 'heading')}</h2>}
              {f(s, 'subheading') && <p className="lede">{f(s, 'subheading')}</p>}
              {f(s, 'ctaLabel') && <Btn href={f(s, 'ctaHref') ?? '#quote'}>{f(s, 'ctaLabel')}</Btn>}
            </div>
          </Reveal>
        )}
        <Reveal>
          <FaqList groups={f(s, 'groups')} faqs={[...(f(s, 'faqs') ?? []),
            ...(f(s, 'items') ?? []).map((q: any) => ({ _id: q._key, question: q.question, answer: q.answer }))]} />
          {f(s, 'needed') && <Needed block what={f(s, 'needed')} />}
        </Reveal>
      </div>
    </section>
  );
};

const About = ({ s, settings }: { s: Section; settings: Settings }) => {
  const v = f(s, 'video');
  return (
    <section className="sheet about" id="about">
      <div className={`container about-layout${v ? '' : ' no-media'}`}>
        {v && (
          <Reveal><AboutVideo src={v.videoUrl}
            unmuteLabel={t(settings, 'videoUnmuteLabel')} muteLabel={t(settings, 'videoMuteLabel')} /></Reveal>
        )}
        <Reveal>
          <div className="about-copy">
            {f(s, 'eyebrow') && <span className="eyebrow">{f(s, 'eyebrow')}</span>}
            <h2><Emph text={f(s, 'heading')} em={f(s, 'headingEmphasis')} /></h2>
            {f(s, 'intro') && <p className="lede">{f(s, 'intro')}</p>}
            <ul className="check-list">
              {(f(s, 'bullets') ?? []).map((b: string) => (
                <li key={b}><span className="icon-tile sm"><Check /></span>{b}</li>
              ))}
            </ul>
            {(f(s, 'ctaLabel') || f(s, 'showCall')) && (
              <div className="btn-row">
                {f(s, 'ctaLabel') && <Btn href={f(s, 'ctaHref') ?? '#quote'}>{f(s, 'ctaLabel')}</Btn>}
                {f(s, 'showCall') && <CallBtn settings={settings} />}
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

/* ponytail: the map lives on /contact only (mapSection); areaSection.mapQuery is
   now unused. Drop the field from the schema once the old design is retired. */
const Area = ({ s, settings }: { s: Section; settings: Settings }) => (
  <section className="sheet tint area" id="area">
    <div className="container">
      <Head s={s} center />
      <Reveal>
        <div className="chip-cloud">
          {(settings.serviceAreas ?? []).map(a => (
            <Link href={a.slug ? `/${a.slug}` : '/contact'} className="chip" key={a.name}>
              <Pin />{a.name}
            </Link>
          ))}
          {settings.serviceAreasNote && <span className="chip muted">{settings.serviceAreasNote}</span>}
        </div>
      </Reveal>
      {f(s, 'ctaLabel') && (
        <div className="after-grid center"><Btn href={f(s, 'ctaHref') ?? '#quote'}>{f(s, 'ctaLabel')}</Btn></div>
      )}
    </div>
  </section>
);

const Stars = ({ n, label }: { n: number; label: string }) => (
  <span className="stars" aria-label={label}>
    {Array.from({ length: n }).map((_, i) => <Star key={i} />)}
  </span>
);

const Reviews = ({ s, settings, city }: { s: Section; settings: Settings; city?: string }) => {
  const all: any[] = f(s, 'reviews') ?? [];
  const local = f(s, 'local') && city ? all.filter(r => r.city === city) : all;
  const reviews = local.length ? local : all;
  const missingLocal = f(s, 'local') && city && !local.length;
  const widget = settings.integrations?.reviewsWidgetUrl;
  const avg = reviews.length
    ? reviews.reduce((t, r) => t + (r.rating ?? 5), 0) / reviews.length : 0;
  const summary = reviews.length > 0 && (
    <div className="rating-card">
      <strong>{avg.toFixed(1)}</strong>
      <span><Stars n={Math.round(avg)} label={t(settings, 'starsLabel', { count: Math.round(avg) })} /><small>{t(settings, 'ratingLabel')}</small></span>
    </div>
  );
  return (
    <section className="sheet reviews" id="reviews">
      <div className="container">
        <Head s={s} action={summary} />
        {missingLocal && <Needed block what={`Reviews from ${city} customers (add the city to each review)`} />}
        <div className="review-grid">
          {reviews.map(r => (
            <Reveal key={r._id}>
              <article className="review-card">
                <Stars n={r.rating ?? 5} label={t(settings, 'starsLabel', { count: r.rating ?? 5 })} />
                <p>&ldquo;{r.quote}&rdquo;</p>
                <div className="review-author">
                  <span className="avatar">{r.initials}</span>
                  <span><strong>{r.author}</strong>
                    <small>{r.city ?? <Needed what="City" />}</small></span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        {f(s, 'showWidget') && (
          <div className="reviews-widget">
            {widget
              ? <iframe src={widget} title={t(settings, 'reviewsWidgetTitle')} loading="lazy" />
              : <Needed block what="Google reviews widget (GHL Reputation embed URL in Site Settings)" />}
          </div>
        )}
        {f(s, 'ctaLabel') && (
          <div className="after-grid center"><Btn href={f(s, 'ctaHref') ?? '#quote'}>{f(s, 'ctaLabel')}</Btn></div>
        )}
      </div>
    </section>
  );
};

const Quote = ({ s, settings, areaLabel }: { s: Section; settings: Settings; areaLabel: string }) => {
  const band = f(s, 'showContactDetails') === false;
  const img = f(s, 'image');
  const items = [
    { Icon: Phone, label: t(settings, 'contactPhoneLabel'), value: settings.phone, href: settings.phoneHref, wide: true },
    { Icon: Mail, label: t(settings, 'contactEmailLabel'), value: settings.email, href: `mailto:${settings.email}`, wide: true },
    { Icon: Pin, label: t(settings, 'contactAreaLabel'), value: settings.serviceAreaLabel },
    { Icon: Clock, label: t(settings, 'contactHoursLabel'), value: settings.hours },
  ].filter(i => i.value);

  return (
    <section className={band ? 'cta-island quote' : 'band-dark quote'} id="quote">
      <div className={band ? 'cta-card quote-band' : undefined}>
        {band && img && <Image src={urlFor(img).width(1920).quality(72).url()} alt="" fill sizes="100vw"
          aria-hidden="true" className="cta-img" />}
        <div className="container quote-layout">
          <Reveal>
            <div className="quote-copy">
              {f(s, 'eyebrow') && <span className="eyebrow on-dark">{f(s, 'eyebrow')}</span>}
              <h2>{f(s, 'heading')}</h2>
              {f(s, 'subheading') && <p className="lede">{f(s, 'subheading')}</p>}
              {band ? (
                <div className="btn-row">
                  <CallBtn settings={settings} variant="primary" label={t(settings, 'stickyCallLabel')} />
                </div>
              ) : (
                <div className="contact-grid">
                  {items.map(({ Icon, label, value, href, wide }) => {
                    const inner = (<><span className="icon-tile"><Icon /></span>
                      <span><small>{label}</small><strong>{value}</strong></span></>);
                    const cls = `contact-tile${wide ? ' wide' : ''}`;
                    return href
                      ? <a className={cls} href={href} key={label}>{inner}</a>
                      : <div className={cls} key={label}>{inner}</div>;
                  })}
                </div>
              )}
            </div>
          </Reveal>
          <Reveal>
            <div className="form-card">
              <FormTitle s={s} />
              <QuoteForm settings={settings} formId="quoteForm"
                serviceArea={areaLabel} consentText={f(s, 'consentText')} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const Breakdown = ({ s }: { s: Section }) => {
  const cards: any[] = f(s, 'cards') ?? [];
  const variant = f(s, 'variant') ?? 'cards';
  const tint = variant !== 'cards';
  // column count follows the item count, so no row ends with a lone card
  const count = ` count-${Math.min(cards.length, 5)}`;
  return (
    <section className={`sheet breakdown${tint ? ' tint' : ''}`}>
      <div className="container">
        {hasHead(s) && <Head s={s} center={variant === 'cards'} />}
        {cards.length === 0 && <Needed block what={`Items for "${f(s, 'heading') ?? 'this section'}"`} />}
        {variant === 'steps' ? (
          <ol className={`step-grid${count}`}>
            {cards.map((c, i) => (
              <Reveal key={c._key}>
                <li className="step-card">
                  <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{txt(c.title)}</h3>{c.body && <p>{txt(c.body)}</p>}
                </li>
              </Reveal>
            ))}
          </ol>
        ) : variant === 'checks' ? (
          <ul className={`check-grid${count}`}>
            {cards.map(c => (
              <Reveal key={c._key}>
                <li><span className="icon-tile sm"><Check /></span>
                  <span><strong>{txt(c.title)}</strong>{c.body && <small>{txt(c.body)}</small>}</span></li>
              </Reveal>
            ))}
          </ul>
        ) : (
          <div className={`feature-grid${count}${cards.length === 1 ? ' single' : ''}`}>
            {cards.map(c => (
              <Reveal key={c._key}>
                <div className="feature-card">
                  <span className="icon-tile"><Check /></span>
                  <h3>{txt(c.title)}</h3>{c.body && <p>{txt(c.body)}</p>}
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const Photos = ({ s }: { s: Section }) => (
  <section className="sheet photos" data-category={f(s, 'category') || undefined}>
    <div className="container">
      {hasHead(s) && <Head s={s} />}
      <div className="photo-grid">
        {(f(s, 'photos') ?? []).map((ph: any) => (
          <Reveal key={ph._key}>
            <figure className="photo-card">
              <Image src={urlFor(ph.image).width(900).url()} alt={ph.alt ?? ph.caption ?? ''}
                width={900} height={675} sizes="(max-width: 720px) 100vw, 33vw"
                placeholder={ph.image?.asset?.metadata?.lqip ? 'blur' : 'empty'}
                blurDataURL={ph.image?.asset?.metadata?.lqip} />
              {ph.caption && <figcaption className="pill-tag left bottom">{ph.caption}</figcaption>}
            </figure>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

const MapBlock = ({ s, settings }: { s: Section; settings: Settings }) => (
  <section className="sheet map-block">
    <div className="container">
      {hasHead(s) && <Head s={s} center />}
      <Reveal>
        <div className="map-frame">
          <MapEmbed query={f(s, 'mapQuery') || settings.serviceAreaLabel || settings.businessName} title={mapTitle(settings)} />
        </div>
      </Reveal>
    </div>
  </section>
);

/** A paragraph that still reads "[CONTENT NEEDED] ..." renders as the placeholder block. */
const proseComponents = {
  block: {
    normal: ({ children, value }: any) => {
      const text = (value.children ?? []).map((c: any) => c.text).join('');
      return text.startsWith(NEEDED)
        ? <Needed block what={text.slice(NEEDED.length).trim()} />
        : <p>{children}</p>;
    },
  },
};

const Prose = ({ s }: { s: Section }) => (
  <section className="sheet prose-section">
    <div className="container">
      <Reveal>
        <div className="prose">
          {f(s, 'eyebrow') && <span className="eyebrow">{f(s, 'eyebrow')}</span>}
          {f(s, 'heading') && <h2>{f(s, 'heading')}</h2>}
          <PortableText value={f(s, 'body') ?? []} components={proseComponents} />
        </div>
      </Reveal>
    </div>
  </section>
);

const Booking = ({ s, settings }: { s: Section; settings: Settings }) => {
  const url = settings.integrations?.calendarEmbedUrl;
  if (!url) return null;   // no calendar configured -> section renders nothing
  return (
    <section className="sheet booking" id="booking">
      <div className="container">
        <Head s={s} center />
        <div className="booking-frame">
          <iframe src={url} title={f(s, 'buttonLabel') || t(settings, 'bookingTitle')} loading="lazy" />
        </div>
      </div>
    </section>
  );
};

/* ---------- Blueprint sections ---------- */

/** Blueprint #4. Everything comes from Site Settings; anything the client hasn't
 *  supplied shows as [CONTENT NEEDED] rather than a guess. */
const TrustBar = ({ settings }: { settings: Settings }) => {
  const rating = settings.googleRating;
  return (
    <section className="trust-bar">
      <div className="container">
        <ul className="trust-strip">
          {(settings.trustItems ?? []).map(({ title, sub, icon }) => {
            const Icon = TRUST_ICONS[icon ?? ''] ?? Clock;
            return (
              <li key={title}><span className="icon-tile sm"><Icon /></span>
                <span><strong>{txt(title)}</strong>{sub && <small>{txt(sub)}</small>}</span></li>
            );
          })}
          <li><span className="icon-tile sm"><Shield /></span>
            <span><strong>{settings.licenseNumber ? t(settings, 'licenseLabel', { number: settings.licenseNumber }) : <Needed what="License number" />}</strong></span></li>
          <li><span className="icon-tile sm"><Star /></span>
            <span><strong>{rating ? t(settings, 'googleRatingLabel', { rating: rating.toFixed(1) }) : <Needed what="Google rating" />}</strong>
              {settings.googleReviewCount && <small>{t(settings, 'reviewCountLabel', { count: settings.googleReviewCount })}</small>}</span></li>
        </ul>
        {!!settings.brandLogos?.length && (
          <div className="brand-logos">
            {settings.brandLogos.map((b, i) => (
              <Image key={i} src={urlFor(b).height(80).url()} alt={b.alt ?? ''} width={120} height={40} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

/** Service page: 2–3 other service pages, from the category list. */
const RelatedServices = ({ s, settings, page }: { s: Section; settings: Settings; page: Page }) => {
  const here = `/${page.slug?.current}`;
  const others = (settings.serviceCategories ?? []).filter(c => c.href !== here).slice(0, 3);
  return (
    <section className="sheet related">
      <div className="container">
        {hasHead(s) && <Head s={s} />}
        <div className="related-grid">
          {others.map(c => (
            <Reveal key={c.id}>
              <Link href={c.href ?? '#'} className="service-card compact">
                {c.image && <Image src={urlFor(c.image).width(700).url()} alt="" fill
                  sizes="(max-width: 860px) 100vw, 33vw" />}
                <span className="service-card-body">
                  <span><h3>{c.title}</h3>{c.blurb && <p>{c.blurb}</p>}</span>
                  <span className="round-arrow" aria-hidden="true"><ArrowRight /></span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

const nearbyAreas = (page: Page, settings: Settings) => {
  const areas = settings.serviceAreas ?? [];
  const nearby = areaFor(page, settings)?.nearby ?? [];
  return nearby.map(slug => areas.find(a => a.slug === slug)).filter(Boolean) as typeof areas;
};

/** City page: map, response time, nearby areas. */
const Coverage = ({ s, settings, page }: { s: Section; settings: Settings; page: Page }) => {
  const nearby = nearbyAreas(page, settings);
  return (
    <section className="sheet coverage">
      <div className="container coverage-layout">
        <Reveal>
          <div className="coverage-copy">
            {f(s, 'eyebrow') && <span className="eyebrow">{f(s, 'eyebrow')}</span>}
            {f(s, 'heading') && <h2>{f(s, 'heading')}</h2>}
            {f(s, 'subheading') && <p className="lede">{f(s, 'subheading')}</p>}
            <div className="coverage-facts">
              <div className="coverage-fact"><span className="icon-tile"><Clock /></span>
                <span><small>{t(settings, 'responseTimeLabel')}</small>
                  <strong>{f(s, 'responseTime') || <Needed what="Response time" />}</strong></span></div>
              <div className="coverage-fact"><span className="icon-tile"><Pin /></span>
                <span><small>{t(settings, 'nearbyAreasLabel')}</small>
                  {nearby.length
                    ? <span className="chip-row">{nearby.map(a => (
                        <Link href={`/${a.slug}`} className="chip" key={a.name}>{a.name}</Link>))}</span>
                    : <strong><Needed what="Nearby areas" /></strong>}</span></div>
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="map-frame">
            <MapEmbed query={f(s, 'mapQuery') || settings.serviceAreaLabel || settings.businessName} title={mapTitle(settings)} />
          </div>
        </Reveal>
      </div>
    </section>
  );
};

/** City page footer links: every service page + nearby city pages. */
const InternalLinks = ({ s, settings, page }: { s: Section; settings: Settings; page: Page }) => {
  const nearby = nearbyAreas(page, settings);
  const areasLabel = settings.navLinks?.find(l => l.menu === 'areas')?.label || t(settings, 'serviceAreasLabel');
  const servicesLabel = settings.navLinks?.find(l => l.menu === 'services')?.label || t(settings, 'servicesLabel');
  return (
    <section className="sheet tint internal-links">
      <div className="container">
        {hasHead(s) && <Head s={s} />}
        <div className="link-columns">
          <div>
            <h3>{servicesLabel}</h3>
            <div className="chip-row">
              {(settings.serviceCategories ?? []).map(c => (
                <Link href={c.href ?? '#'} className="chip" key={c.id}>{c.title}<ArrowRight /></Link>
              ))}
            </div>
          </div>
          <div>
            <h3>{areasLabel}</h3>
            <div className="chip-row">
              {nearby.length
                ? nearby.map(a => <Link href={`/${a.slug}`} className="chip" key={a.name}><Pin />{a.name}</Link>)
                : <Needed what="Nearby city pages" />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* Built-in marks for common listings; anything else uses an uploaded logo. */
const BADGE_ICONS: Record<string, { Icon: () => React.JSX.Element; tone?: string }> = {
  google: { Icon: GoogleG }, yelp: { Icon: Yelp, tone: '#d32323' },
  facebook: { Icon: Facebook, tone: '#1877f2' }, instagram: { Icon: Instagram, tone: '#c13584' },
  shield: { Icon: Shield }, star: { Icon: Star }, check: { Icon: Check },
};

/** Third-party listings and credentials. Only what the client really holds is
 *  listed; the Google badge reads the rating from Site Settings. */
const Badges = ({ s, settings }: { s: Section; settings: Settings }) => {
  const badges = settings.badges ?? [];
  const rating = settings.googleRating;
  return (
    <section className="sheet badges-section">
      <div className="container">
        {hasHead(s) && <Head s={s} center />}
        {badges.length === 0 && <Needed block what="Badges and listings the client holds (Google, Yelp, Thumbtack, BBB, awards)" />}
        <ul className="badge-strip">
          {badges.map(b => {
            const mark = BADGE_ICONS[b.icon ?? ''];
            const sub = b.icon === 'google' && !b.sub
              ? (rating ? t(settings, 'badgeRatingLabel', { rating: rating.toFixed(1) }) : <Needed what="Google rating" />)
              : b.sub;
            const body = (
              <>
                <span className="badge-mark" style={mark?.tone ? { color: mark.tone } : undefined}>
                  {b.logo
                    ? <Image src={urlFor(b.logo).height(96).url()} alt="" width={48} height={48} />
                    : mark ? <mark.Icon /> : <Check />}
                </span>
                <strong>{b.title}</strong>
                {sub && <small>{sub}</small>}
              </>
            );
            return (
              <li key={b._key}>
                {b.href ? <a href={b.href} target="_blank" rel="noopener" className="badge">{body}</a>
                        : <div className="badge">{body}</div>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
