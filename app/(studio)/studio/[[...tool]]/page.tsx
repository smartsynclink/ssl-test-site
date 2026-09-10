'use client';

/**
 * Sanity Studio mounted at /studio.
 *
 * Loaded entirely client-side via `next/dynamic({ ssr: false })`. Studio's
 * auth store touches `window` at module-load time, so server rendering it
 * fails; skipping SSR sidesteps that. Nothing is lost — the Studio shell is
 * empty until it hydrates, and it is admin UI with no SEO value.
 */
import dynamic from 'next/dynamic';

const Studio = dynamic(() => import('./Studio'), { ssr: false, loading: () => null });

const StudioPage = () => <Studio />;

export default StudioPage;
