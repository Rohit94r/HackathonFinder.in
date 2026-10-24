import type { Connector } from '../types';
import { devfolio } from './devfolio';
import { devpost } from './devpost';
import { hackerearth } from './hackerearth';
import { knowafest } from './knowafest';
import { lablab } from './lablab';
import { mlh } from './mlh';
import { facebook, instagram, linkedin } from './social';
import { unstop } from './unstop';
import { web } from './web';

// Every source the Scout knows. To add one, write a connector (see README) and list it here.
// Platforms and event sites first: they are the most reliable and their listings can go live directly.
export const CONNECTORS: Connector[] = [unstop, devfolio, devpost, mlh, hackerearth, lablab, knowafest, web, instagram, linkedin, facebook];

export function connectorBySlug(slug: string): Connector | undefined {
  return CONNECTORS.find((c) => c.slug === slug);
}

/** Required env vars that aren't set (the connector is skipped until they are). */
export function missingEnv(connector: Connector, env: NodeJS.ProcessEnv = process.env): string[] {
  return (connector.requiredEnv ?? []).filter((k) => !env[k]);
}

export { devfolio, devpost, facebook, hackerearth, instagram, knowafest, lablab, linkedin, mlh, unstop, web };
