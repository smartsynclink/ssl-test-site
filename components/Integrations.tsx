import Script from 'next/script';
import type { Settings } from '@/lib/types';

/* IDs are pasted into Studio and end up inside inline scripts, so only exact ID
   shapes are accepted -- anything else is dropped instead of being executed. */
const GTM = /^GTM-[A-Z0-9]+$/;
const GA4 = /^G-[A-Z0-9]+$/;
const PIXEL = /^\d{5,20}$/;
const WIDGET = /^[\w-]{6,64}$/;   // only used as an attribute value, so shape-checking is enough

/**
 * Blueprint GHL block: chat widget on every page, plus Pixel / Google Analytics /
 * Google Tag Manager when the client asks for them. Each one loads only when its
 * ID is set in Site Settings → Integrations, and after the page is interactive.
 */
export default function Integrations({ integrations: i = {} }: { integrations: Settings['integrations'] }) {
  const gtm = i.gtmId?.trim(), ga4 = i.ga4Id?.trim(), pixel = i.metaPixelId?.trim(), widget = i.chatWidgetId?.trim();
  return (
    <>
      {widget && WIDGET.test(widget) && (
        <Script src="https://widgets.leadconnectorhq.com/loader.js" strategy="lazyOnload"
          data-resources-url={i.chatWidgetResourcesUrl || 'https://widgets.leadconnectorhq.com/chat-widget/loader.js'}
          data-widget-id={widget} />
      )}

      {gtm && GTM.test(gtm) && (
        <>
          <Script id="gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}</Script>
          <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${gtm}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} title="Google Tag Manager" /></noscript>
        </>
      )}

      {ga4 && GA4.test(ga4) && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4}');`}</Script>
        </>
      )}

      {pixel && PIXEL.test(pixel) && (
        <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}</Script>
      )}
    </>
  );
}
