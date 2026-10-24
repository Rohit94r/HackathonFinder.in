'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';

interface BannerImageProps {
  src: string;
  /** Shown instead when `src` fails to load (a broken or expired banner link). */
  fallback: string;
  alt: string;
  className?: string;
  /** Load straight away (the first cards on a page) instead of when scrolled near. */
  eager?: boolean;
}

/**
 * A banner from another site, with a backup photo if its link breaks. A plain img, since
 * banners come from many hosts (Cloudinary, Unstop, Devfolio, Devpost, …).
 */
export default function BannerImage({ src, fallback, alt, className, eager = false }: BannerImageProps) {
  const [failed, setFailed] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={failed ? fallback : src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn('h-full w-full', className)}
    />
  );
}
