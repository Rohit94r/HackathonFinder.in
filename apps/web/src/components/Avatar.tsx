'use client';

import { useState } from 'react';
import { avatarColor, initials } from '@/data/people';
import { cn } from '@/lib/cn';

const SIZES = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-28 w-28 text-4xl',
};

/**
 * The student's photo (e.g. from Google or GitHub) when there is one, otherwise their
 * initials in a colour picked from the name, so the same person always looks the same.
 */
export default function Avatar({
  name,
  image,
  size = 'md',
  className,
}: {
  name: string;
  image?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(image && /^https?:\/\//i.test(image) && !broken);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display font-bold text-white ring-2 ring-surface',
        showImage ? 'bg-ink/10' : avatarColor(name),
        SIZES[size],
        className
      )}
      aria-hidden="true"
    >
      {showImage ? (
        // OAuth avatars come from several hosts, so a plain img (not next/image) keeps config simple.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image!}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setBroken(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
