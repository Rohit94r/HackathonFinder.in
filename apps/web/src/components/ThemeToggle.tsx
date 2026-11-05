'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/useTheme';
import { cn } from '@/lib/cn';

/**
 * Light/dark switch. The icon is picked by CSS from <html data-theme> (not the nearest
 * data-theme, since the navbar and footer are always dark), so it is right on the first paint;
 * only the label waits for the hook.
 */
export default function ThemeToggle({ className, iconClassName = 'h-[18px] w-[18px]' }: { className?: string; iconClassName?: string }) {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className={className}>
      <Sun className={cn(iconClassName, 'hidden [html[data-theme=dark]_&]:block')} aria-hidden="true" />
      <Moon className={cn(iconClassName, '[html[data-theme=dark]_&]:hidden')} aria-hidden="true" />
    </button>
  );
}
