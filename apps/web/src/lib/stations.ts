/** A stable 7-digit ticket number for an event, so its ticket always reads the same. */
export function ticketNo(slug: string): string {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) h = Math.imul(h ^ slug.charCodeAt(i), 16777619);
  return String((h >>> 0) % 10_000_000).padStart(7, '0');
}
