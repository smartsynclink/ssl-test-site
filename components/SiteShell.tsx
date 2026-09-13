import Header from './Header';
import Footer from './Footer';
import StickyCta from './StickyCta';
import QuoteModal from './QuoteModal';
import { Sections, areaLabelFor } from './Sections';
import type { Page, Settings } from '@/lib/types';

export default function SiteShell({ page, settings }: { page: Page; settings: Settings }) {
  // the modal reuses the page's own form copy when a section on the page carries it
  const formSection = (page.sections ?? []).find(s => s.formHeading || s.consentText) as
    { formHeading?: string; formHeadingEmphasis?: string; consentText?: string } | undefined;
  return (
    <div className="frame" id="top">
      <Header settings={settings} />
      <main>
        <Sections page={page} settings={settings} />
      </main>
      <Footer settings={settings} />
      <StickyCta settings={settings} />
      <QuoteModal settings={settings} serviceArea={areaLabelFor(page)}
        consentText={settings.ui?.consentText ?? formSection?.consentText}
        heading={formSection?.formHeading} emphasis={formSection?.formHeadingEmphasis} />
    </div>
  );
}
