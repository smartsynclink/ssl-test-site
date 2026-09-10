import Header from './Header';
import Footer from './Footer';
import StickyCta from './StickyCta';
import { Sections } from './Sections';
import type { Page, Settings } from '@/lib/types';

/** Wraps the whole document in the page's theme class. The ported stylesheet
 *  scopes its two variants under .pt-landing / .pt-inner, and the footer is one
 *  of the rules that differs, so the class has to sit outside it. */
export default function SiteShell({ page, settings }: { page: Page; settings: Settings }) {
  return (
    <div className={page.theme === 'inner' ? 'pt-inner' : 'pt-landing'}>
      <Header settings={settings} />
      <main>
        <Sections page={page} settings={settings} />
      </main>
      <Footer settings={settings} />
      <StickyCta settings={settings} />
    </div>
  );
}
