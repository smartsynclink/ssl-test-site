'use client';
import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';
import { urlFor, type SanityImage } from '@/sanity/image';

type Props = { title: string; caption?: string; before: SanityImage; after: SanityImage;
  labels: { before: string; after: string; drag: string; compare: string } };

/** Drag-to-compare slider. Pointer events cover mouse, touch and pen in one
 *  path; arrow keys move it from the keyboard. */
export default function BeforeAfter({ title, caption, before, after, labels }: Props) {
  const [pct, setPct] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = useCallback((clientX: number) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    setPct(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  return (
    <figure className="work-card">
      <div
        className="ba-slider"
        ref={box}
        onPointerDown={e => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX); }}
        onPointerMove={e => { if (dragging.current) move(e.clientX); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerCancel={() => { dragging.current = false; }}
        role="slider"
        aria-label={labels.compare}
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'ArrowLeft') setPct(p => Math.max(0, p - 5));
          if (e.key === 'ArrowRight') setPct(p => Math.min(100, p + 5));
        }}
      >
        <Image src={urlFor(after).width(1100).url()} alt={`${title} — ${labels.after}`} fill draggable={false}
          sizes="(max-width: 860px) 100vw, 50vw"
          placeholder={after.asset?.metadata?.lqip ? 'blur' : 'empty'}
          blurDataURL={after.asset?.metadata?.lqip} />
        <div className="ba-before" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>
          <Image src={urlFor(before).width(1100).url()} alt={`${title} — ${labels.before}`} fill draggable={false}
            sizes="(max-width: 860px) 100vw, 50vw" />
        </div>
        <span className="pill-tag left">{labels.before}</span>
        <span className="pill-tag right">{labels.after}</span>
        <div className="ba-handle" style={{ left: `${pct}%` }}>
          <span className="ba-knob">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7l-5 5 5 5M15 7l5 5-5 5" /></svg>
          </span>
        </div>
        <span className="ba-hint">{labels.drag}</span>
      </div>
      <figcaption>
        <h3>{title}</h3>
        {caption && <p>{caption}</p>}
      </figcaption>
    </figure>
  );
}
