'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Cycles through words in place. The slot eases to the width of the current word, so a
 * centred line stays tight and centred. Screen readers get the static sentence from the
 * parent heading instead (this is aria-hidden there).
 */
export default function RotatingWord({
  words,
  interval = 2400,
  className,
  wordClassName,
}: {
  words: string[];
  interval?: number;
  className?: string;
  /** Styles for each word (gradient text has to sit on the word itself). */
  wordClassName?: string;
}) {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState<number>();
  const refs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  // Track the current word's width, including after fonts load or the viewport resizes.
  useEffect(() => {
    const measure = () => setWidth(refs.current[index]?.offsetWidth);
    measure();
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener('resize', measure);
  }, [index]);

  return (
    <span
      className={cn('relative inline-grid justify-items-start whitespace-nowrap align-bottom transition-[width] duration-500 ease-out', className)}
      style={width ? { width } : undefined}
    >
      {words.map((word, i) => (
        <span
          key={word}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={cn(
            '[grid-area:1/1] transition-[opacity,transform,filter] duration-500 ease-out',
            wordClassName,
            i === index
              ? 'translate-y-0 opacity-100 blur-0'
              : i === (index + words.length - 1) % words.length
                ? '-translate-y-[0.4em] opacity-0 blur-sm'
                : 'translate-y-[0.4em] opacity-0 blur-sm'
          )}
        >
          {word}
        </span>
      ))}
    </span>
  );
}
