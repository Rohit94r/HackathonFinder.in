'use client';

import { useState } from 'react';
import { CheckCircle2, Mail } from 'lucide-react';

export default function NewsletterForm({ dark = true }: { dark?: boolean }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className={`flex items-center gap-2 text-sm font-medium ${dark ? 'text-lime' : 'text-ink'}`}>
        <CheckCircle2 className="h-5 w-5" />
        You’re on the list. The weekly digest starts soon.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (email.includes('@')) setDone(true);
      }}
      className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <div className="relative flex-1">
        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@college.edu"
          className="input pl-11"
        />
      </div>
      <button type="submit" className={dark ? 'btn-lime' : 'btn-primary'}>
        Get the weekly digest
      </button>
    </form>
  );
}
