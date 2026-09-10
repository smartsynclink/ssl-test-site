'use client';
import { useEffect, useRef } from 'react';

/** Ports the site's reveal-on-scroll: adds .in when the element enters view.
 *  Elements start visible if IntersectionObserver never fires, so content is
 *  never trapped invisible. */
export default function Reveal({ children, id }: { children: React.ReactNode; id?: string }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    if (!('IntersectionObserver' in window)) { node.classList.add('in'); return; }
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
      { threshold: 0.12 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return <div className="reveal" id={id} ref={el}>{children}</div>;
}
