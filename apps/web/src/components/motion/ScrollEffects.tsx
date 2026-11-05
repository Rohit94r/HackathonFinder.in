'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Site-wide scroll motion, driven by data attributes so pages stay server-rendered:
 * - data-reveal="up|left|right|zoom|fade" fades an element in when it scrolls into view.
 * - data-reveal-stagger on a container reveals its children one after another.
 * - data-parallax="0.15" (optionally data-parallax-axis="x") drifts an element while scrolling.
 * Also drives the scroll progress bar it renders at the top of the page.
 */
export default function ScrollEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pending = () =>
      document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-visible), [data-reveal-stagger]:not(.is-visible)');

    if (reduce) {
      pending().forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.1 }
    );
    const observeAll = () => pending().forEach((el) => io.observe(el));
    observeAll();
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
        const speed = parseFloat(el.dataset.parallax || '0');
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        const offset = Math.round(-(rect.top + rect.height / 2 - vh / 2) * speed);
        el.style.translate = el.dataset.parallaxAxis === 'x' ? `${offset}px 0` : `0 ${offset}px`;
      });
      const max = Math.max(1, root.scrollHeight - root.clientHeight);
      root.style.setProperty('--scroll-progress', String(Math.min(1, root.scrollTop / max)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px] origin-left bg-accent"
      style={{ transform: 'scaleX(var(--scroll-progress, 0))' }}
    />
  );
}
