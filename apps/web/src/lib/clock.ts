/** The visitor's own time zone; "UTC" on the server, so the first render matches the HTML. */
export function localZone(): string {
  return typeof window === 'undefined' ? 'UTC' : Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

/** "14:32:07" and the zone's short name ("PST", "GMT+5:30") for a station clock. */
export function stationClock(ms: number, zone: string): { time: string; zone: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZone: zone,
    timeZoneName: 'short',
  }).formatToParts(ms);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return { time: `${get('hour')}:${get('minute')}:${get('second')}`, zone: get('timeZoneName') || zone };
}
