import { PHOTOS, type Photo } from '@/components/landing/photos';
import { cn } from '@/lib/cn';

/**
 * A real photo with a short message, for empty and unavailable states (chats, Team
 * Finder). Defaults to students laughing around a table.
 */
export default function ChatPhoto({
  title,
  text,
  children,
  photo = PHOTOS.collegeGroupProject,
  alt = 'Five students laughing together around a table',
  className,
}: {
  title: string;
  text: string;
  children?: React.ReactNode;
  photo?: Photo;
  alt?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex h-full flex-col items-center justify-center px-6 py-10 text-center', className)}>
      <figure className="w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={alt} className="aspect-[3/2] w-full rounded-lg object-cover" loading="lazy" />
        <figcaption className="mt-1.5 text-[11px] text-ink/45">
          Photo:{' '}
          <a href={photo.page} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {photo.by} on Unsplash
          </a>
        </figcaption>
      </figure>
      <h2 className="mt-5 font-sans text-xl font-bold normal-case tracking-normal">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-ink/70">{text}</p>
      {children && <div className="mt-5 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}
