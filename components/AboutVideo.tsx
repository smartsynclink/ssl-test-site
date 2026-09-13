'use client';
import { useRef, useState } from 'react';

/** Autoplays muted; the whole frame is a mute toggle. */
export default function AboutVideo({ src, unmuteLabel, muteLabel }: {
  src: string; unmuteLabel: string; muteLabel: string;
}) {
  const [muted, setMuted] = useState(true);
  const video = useRef<HTMLVideoElement>(null);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) v.play().catch(() => {});
  };

  return (
    <div className="video-frame" role="button" tabIndex={0}
      aria-label={muted ? unmuteLabel : muteLabel}
      onClick={toggle}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}>
      <video ref={video} src={src} autoPlay muted loop playsInline />
      <span className="pill-tag bottom">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5 6 9H3v6h3l5 4V5z" />
          {muted
            ? <path strokeLinecap="round" d="M16 9l5 5M21 9l-5 5" />
            : <path strokeLinecap="round" d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" />}
        </svg>
        {muted ? unmuteLabel : muteLabel}
      </span>
    </div>
  );
}
