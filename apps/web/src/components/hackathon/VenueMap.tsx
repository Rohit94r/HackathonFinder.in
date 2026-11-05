import { MapPin, Navigation } from 'lucide-react';
import type { LatLng } from '@hackathonfinder/shared';
import DistanceFromYou from './DistanceFromYou';

interface VenueMapProps {
  point: LatLng;
  venue: string;
  /** Google Maps destination: exact coordinates when we have them, else the venue text. */
  destination: string;
}

/** Map, distance and directions for an in-person event. */
export default function VenueMap({ point, venue, destination }: VenueMapProps) {
  const pad = 0.02;
  const bbox = [point.lng - pad, point.lat - pad * 0.6, point.lng + pad, point.lat + pad * 0.6].map((n) => n.toFixed(4)).join(',');
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${point.lat},${point.lng}`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;

  return (
    <div className="card mt-8 overflow-hidden">
      <iframe title={`Map of ${venue}`} src={embed} loading="lazy" className="block h-56 w-full border-0 sm:h-64" />
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-semibold text-ink">
            <MapPin className="h-4 w-4 shrink-0" />
            {venue}
          </p>
          <DistanceFromYou point={point} />
        </div>
        <a href={directions} target="_blank" rel="noopener noreferrer" className="btn-secondary shrink-0">
          <Navigation className="h-4 w-4" />
          Get directions
        </a>
      </div>
      <p className="px-5 pb-4 text-xs text-ink/60">
        Map ©{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">
          OpenStreetMap
        </a>{' '}
        contributors
      </p>
    </div>
  );
}
