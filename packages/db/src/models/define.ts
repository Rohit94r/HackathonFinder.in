import { model, models, type Model, type Schema } from 'mongoose';

/** Registers a model once; module reloads in development reuse the existing one. */
export function defineModel<T>(name: string, schema: Schema<T>): Model<T> {
  return (models[name] as Model<T> | undefined) ?? model<T>(name, schema);
}

/** Lowercase URL slug: letters, digits and single dashes. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
