'use client';
import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';
import { urlFor, type SanityImage } from '@/sanity/image';

type Props = { title: string; caption?: string; before: SanityImage; after: SanityImage;
  labels?: { before?: string; after?: string; drag?: string; captionPrefix?: string } };

/** Drag-to-compare slider, ported from the original. Pointer events cover
 *  mouse, touch and pen in one path. */
export default function BeforeAfter({ title, caption, before, after, labels = {} }: Props) {
  const [pct, setPct] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = useCallback((clientX: number) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    setPct(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  return (
    <figure className="gallery-card">
      <div
        className="ba-slider"
        ref={box}
        onPointerDown={e => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX); }}
        onPointerMove={e => { if (dragging.current) move(e.clientX); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerCancel={() => { dragging.current = false; }}
        role="slider"
        aria-label={`${title}: drag to compare before and after`}
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'ArrowLeft') setPct(p => Math.max(0, p - 5));
          if (e.key === 'ArrowRight') setPct(p => Math.min(100, p + 5));
        }}
      >
        <Image src={urlFor(after).width(900).url()} alt={`${title} — after`} fill draggable={false}
          sizes="(max-width: 720px) 100vw, 45vw"
          placeholder={after.asset?.metadata?.lqip ? 'blur' : 'empty'}
          blurDataURL={after.asset?.metadata?.lqip} />
        <div className="ba-before-wrap" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>
          <Image src={urlFor(before).width(900).url()} alt={`${title} — before`} fill draggable={false}
            sizes="(max-width: 720px) 100vw, 45vw" />
        </div>
        <span className="ba-tag before">{labels.before ?? 'Before'}</span>
        <span className="ba-tag after">{labels.after ?? 'After'}</span>
        <div className="ba-handle" style={{ left: `${pct}%` }}>
          <div className="ba-handle-line" />
          <div className="ba-handle-btn">
            <div className="ba-handle-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </div>
            <span className="ba-handle-label">{labels.drag ?? 'Drag'}</span>
          </div>
        </div>
      </div>
      <figcaption><h4>{title}</h4>
        <p>{labels.captionPrefix ?? 'Drag to compare.'} {caption}</p></figcaption>
    </figure>
  );
}
