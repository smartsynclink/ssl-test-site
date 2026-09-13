'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { urlFor, type SanityImage } from '@/sanity/image';

/** Crossfading hero backgrounds. The first image is the LCP element, so it is
 *  eager + priority; the rest are lazy and only cycle once mounted. */
export default function HeroBg({ images, sizes = '100vw' }: { images: SanityImage[]; sizes?: string }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => setActive(i => (i + 1) % images.length), 5000);
    return () => clearInterval(t);
  }, [images.length]);

  return (
    <div className="hero-bg">
      {images.map((img, i) => (
        <Image key={i} src={urlFor(img).width(1920).quality(78).url()} alt=""
          className={i === active ? 'active' : ''} fill priority={i === 0}
          sizes={sizes} aria-hidden="true"
          placeholder={img.asset?.metadata?.lqip ? 'blur' : 'empty'}
          blurDataURL={img.asset?.metadata?.lqip} />
      ))}
    </div>
  );
}
