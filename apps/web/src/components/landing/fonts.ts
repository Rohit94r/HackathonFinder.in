import { Figtree, Young_Serif } from 'next/font/google';

// Free Google Fonts standing in for the original design's licensed Phantom Sans and Zarathustra.
export const landingSans = Figtree({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--landing-sans-src',
  display: 'swap',
});

export const landingSerif = Young_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--landing-serif-src',
  display: 'swap',
});
