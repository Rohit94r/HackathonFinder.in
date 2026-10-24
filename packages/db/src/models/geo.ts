import { Schema, type Types } from 'mongoose';
import { defineModel } from './define';

/**
 * Geocoding answers we already looked up (venue or city text → point), so each place
 * is asked about once. Misses are kept too, so we don't ask again for a while.
 */
export interface IGeoCache {
  _id: Types.ObjectId;
  /** Normalised query text: lowercase, single spaces. */
  query: string;
  found: boolean;
  lat?: number;
  lng?: number;
  city?: string;
  state?: string;
  country?: string;
  displayName?: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}

const geoCacheSchema = new Schema<IGeoCache>(
  {
    query: { type: String, required: true, maxlength: 300 },
    found: { type: Boolean, required: true },
    lat: Number,
    lng: Number,
    city: String,
    state: String,
    country: String,
    displayName: { type: String, maxlength: 400 },
    provider: { type: String, default: 'nominatim' },
  },
  { timestamps: true }
);
geoCacheSchema.index({ query: 1 }, { unique: true });

export const GeoCache = defineModel<IGeoCache>('GeoCache', geoCacheSchema);
