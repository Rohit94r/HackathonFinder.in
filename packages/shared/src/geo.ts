import { CITIES } from './catalog';
import type { City, Hackathon, LatLng } from './types';

const EARTH_RADIUS_KM = 6371;

/** A city centre closer than this counts as "near" that city. */
const NEAR_CITY_KM = 60;

/** Straight-line distance in km between two points. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Where an event happens in person: the venue, else the city centre. Online events have no place. */
export function eventPoint(h: Pick<Hackathon, 'mode' | 'city' | 'lat' | 'lng'>): LatLng | undefined {
  if (h.mode === 'online') return undefined;
  if (h.lat !== undefined && h.lng !== undefined) return { lat: h.lat, lng: h.lng };
  const city = CITIES.find((c) => c.slug === h.city);
  return city ? { lat: city.lat, lng: city.lng } : undefined;
}

/** Km from `origin` to the event, or undefined for online events. */
export function distanceFrom(h: Pick<Hackathon, 'mode' | 'city' | 'lat' | 'lng'>, origin: LatLng): number | undefined {
  const point = eventPoint(h);
  return point ? distanceKm(origin, point) : undefined;
}

/** The listed city closest to a point, if it is close enough to call it "near". */
export function nearbyCity(point: LatLng): City | undefined {
  const closest = CITIES.reduce((best, c) => (distanceKm(point, c) < distanceKm(point, best) ? c : best));
  return distanceKm(point, closest) <= NEAR_CITY_KM ? closest : undefined;
}
