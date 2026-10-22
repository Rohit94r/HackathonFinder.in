'use client';

import { useEffect, useState } from 'react';
import { Check, Facebook, Link2, Linkedin, MessageCircle, Share2 } from 'lucide-react';

export default function ShareButtons({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  // The phone's share sheet (Instagram, Telegram and the rest) only exists in some browsers.
  const [canShare, setCanShare] = useState(false);

  useEffect(() => setCanShare(typeof navigator.share === 'function'), []);

  const url = () => `${window.location.origin}${path}`;
  const text = () => `${title}: found on HackathonFinder ${url()}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; nothing else to do.
    }
  };

  const shareSheet = () => {
    navigator.share({ title, text: `${title}: found on HackathonFinder`, url: url() }).catch(() => {
      // Closing the share sheet rejects; nothing to do.
    });
  };

  const open = (href: string) => window.open(href, '_blank', 'noopener,noreferrer');

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => open(`https://wa.me/?text=${encodeURIComponent(text())}`)}
        className="chip"
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </button>
      <button
        type="button"
        onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url())}`)}
        className="chip"
      >
        <Linkedin className="h-4 w-4" />
        LinkedIn
      </button>
      <button
        type="button"
        onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`)}
        className="chip"
      >
        <Facebook className="h-4 w-4" />
        Facebook
      </button>
      {canShare && (
        <button type="button" onClick={shareSheet} className="chip">
          <Share2 className="h-4 w-4" />
          More apps
        </button>
      )}
      <button type="button" onClick={copy} className="chip">
        {copied ? <Check className="h-4 w-4 text-ink" /> : <Link2 className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  );
}
