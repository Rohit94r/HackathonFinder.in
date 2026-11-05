'use client';

import { SpeedInsights as VercelSpeedInsights } from '@vercel/speed-insights/next';

/** True when the browser asks not to be tracked (Do Not Track or Global Privacy Control). */
function optedOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  const win = window as Window & { doNotTrack?: string };
  return nav.globalPrivacyControl === true || nav.doNotTrack === '1' || nav.doNotTrack === 'yes' || win.doNotTrack === '1' || nav.msDoNotTrack === '1';
}

/**
 * Real-user page speed (Core Web Vitals) through Vercel Speed Insights. It loads after the page,
 * sets no cookies, and, like our own analytics (Tracker), sends nothing from /admin or when the
 * browser asks not to be tracked. Described in the privacy policy (data/legalData.ts).
 */
export default function SpeedInsights() {
  return <VercelSpeedInsights beforeSend={(event) => (optedOut() || new URL(event.url).pathname.startsWith('/admin') ? null : event)} />;
}
