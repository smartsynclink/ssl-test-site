'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from './icons';

/**
 * Horizontal review slider. The scrolling is the browser's own (scroll-snap +
 * overflow), so touch, trackpad and keyboard already work; the arrows are a
 * convenience for mouse users and appear only when there is something to scroll.
 */
export default function ReviewSlider({ children, label, prevLabel, nextLabel }: {
  children: React.ReactNode; label: string; prevLabel: string; nextLabel: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => setScrollable(el.scrollWidth - el.clientWidth > 8);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const page = (direction: 1 | -1) => {
    const el = track.current;
    el?.scrollBy({ left: direction * el.clientWidth * 0.9 });   // smoothing comes from CSS
  };

  return (
    <div className="review-slider">
      <div className="review-track" ref={track} tabIndex={0} role="group" aria-label={label}>
        {children}
      </div>
      {scrollable && (
        <div className="slider-nav">
          <button type="button" aria-label={prevLabel} onClick={() => page(-1)}><ArrowLeft /></button>
          <button type="button" aria-label={nextLabel} onClick={() => page(1)}><ArrowRight /></button>
        </div>
      )}
    </div>
  );
}
