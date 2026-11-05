import { PHOTOS } from '@/components/landing/photos';
import { cn } from '@/lib/cn';
import BannerImage from './BannerImage';

interface EventArtProps {
  /** Kept for callers that pass it; the cover no longer depends on the theme. */
  theme?: string;
  title: string;
  label?: string;
  className?: string;
  size?: 'card' | 'hero';
  /** The event's own banner or poster. Without one, a real event photo is shown. */
  imageUrl?: string;
  /** Load straight away (above the fold). */
  eager?: boolean;
}

const FALLBACK_PHOTOS = Object.values(PHOTOS).map((p) => p.src);

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** A real event photo picked from the title, so the same event always gets the same one. */
export function fallbackPhoto(title: string): string {
  return FALLBACK_PHOTOS[hash(title) % FALLBACK_PHOTOS.length];
}

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(?:[a-z]_[^/]*\/)?(v\d+\/.+)$/;

/**
 * Banners we store on Cloudinary are asked for at the size the box needs (a card is
 * ~400px wide), so cards load fast. Other links are used as they are.
 */
export function sizedImage(url: string, width: number): string {
  const m = url.match(CLOUDINARY_UPLOAD);
  return m ? `${m[1]}f_auto,q_auto,c_limit,w_${width}/${m[2]}` : url;
}

/**
 * Cover image for an event or story. The organizer's banner is shown whole (posters and
 * wide banners both fit, over a blurred copy of themselves); without one, a real photo
 * from a hackathon fills the box. Never an empty or generated box.
 */
export default function EventArt({ title, label, className, size = 'card', imageUrl: rawImage, eager = false }: EventArtProps) {
  const photo = fallbackPhoto(title);
  const imageUrl = rawImage ? sizedImage(rawImage, size === 'hero' ? 1400 : 640) : undefined;

  return (
    // Neutral grey while the banner downloads, so a loading card never looks like an empty black box.
    <div className={cn('relative overflow-hidden bg-[#e6dfd1] dark:bg-[#26231d]', className)}>
      {imageUrl ? (
        <>
          {/* Blurred copy behind, so a poster or an odd-sized banner never leaves bare bars. */}
          <div aria-hidden="true" className="absolute inset-0 scale-110 opacity-60 blur-xl">
            <BannerImage src={imageUrl} fallback={photo} alt="" className="object-cover" eager={eager} />
          </div>
          <div className="absolute inset-0">
            <BannerImage src={imageUrl} fallback={photo} alt={`${title} banner`} className="object-contain" eager={eager} />
          </div>
        </>
      ) : (
        <div className="absolute inset-0">
          <BannerImage src={photo} fallback={photo} alt="" className="object-cover" eager={eager} />
        </div>
      )}
      {label && (
        <span
          className={cn(
            'absolute left-3 top-3 rounded-md bg-black/70 px-2 py-1 font-semibold uppercase tracking-wider text-white',
            size === 'hero' ? 'text-xs' : 'text-[10px]'
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
