import { deleteModel, model, models, type Model, type Schema } from 'mongoose';

/**
 * Registers a model once; module reloads in development reuse the existing one. A reload
 * can find the model still registered with an older schema, which silently drops new
 * fields, so it is re-registered when the schema gained fields.
 */
export function defineModel<T>(name: string, schema: Schema<T>): Model<T> {
  const existing = models[name] as Model<T> | undefined;
  if (existing && Object.keys(schema.paths).some((p) => !existing.schema.path(p))) deleteModel(name);
  return (models[name] as Model<T> | undefined) ?? model<T>(name, schema);
}

/** Lowercase URL slug: letters, digits and single dashes. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
