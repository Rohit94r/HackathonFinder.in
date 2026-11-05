'use client';

import { useEffect, useState } from 'react';

/**
 * The current year for the footer. Pre-built pages carry the year they were built in, so the
 * browser corrects it on load; the server's year is used for the first render.
 */
export default function CopyrightYear({ initial }: { initial: number }) {
  const [year, setYear] = useState(initial);
  useEffect(() => setYear(new Date().getFullYear()), []);
  return <>{year}</>;
}
