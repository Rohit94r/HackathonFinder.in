// Shared by the auth pages (server) and their forms (browser).

const AUTH_PAGES = /^\/(login|signup|forgot-password|reset-password)(?:[/?#]|$)/;

/**
 * Where to go after signing in. Only paths on this site are allowed (no open redirects);
 * full URLs, like next-auth's callbackUrl, are cut down to their path.
 */
export function safeNext(value: string | string[] | undefined | null): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  let path = raw.trim();
  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path);
      path = `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return null;
    }
  }
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  // Browsers drop tabs and newlines and read "\" as "/", so "/\t/evil.com" would leave the site.
  if (/[\u0000- \\\u007f]/.test(path)) return null;
  try {
    const base = 'https://hackathonfinder.invalid';
    const url = new URL(path, base);
    if (url.origin !== base) return null;
    path = `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
  if (AUTH_PAGES.test(path) || path.startsWith('/api/')) return null;
  return path.slice(0, 500);
}

/** Adds ?next= to an auth page link, when there is somewhere to go back to. */
export function withNext(href: string, next: string | null | undefined): string {
  return next ? `${href}${href.includes('?') ? '&' : '?'}next=${encodeURIComponent(next)}` : href;
}

/** Friendly text for next-auth's error codes (from ?error= or signIn()). */
export function authErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case 'CredentialsSignin':
      return 'That email and password don’t match. Check them, or reset your password.';
    case 'TooManyAttempts':
      return 'Too many sign-in attempts. Wait 15 minutes and try again, or reset your password.';
    case 'AccountBanned':
      return 'This account has been suspended. If you think that’s a mistake, write to us from the email on your account.';
    case 'OAuthAccountNotLinked':
      return 'This email is already linked to another sign-in method. Sign in the way you did before.';
    case 'AccessDenied':
      return 'We couldn’t sign you in with that account. It may have been suspended or deleted.';
    case 'SessionRequired':
      return 'Please sign in to see that page.';
    case 'Verification':
      return 'That sign-in link has expired or was already used.';
    case 'OAuthSignin':
    case 'OAuthCallback':
    case 'OAuthCreateAccount':
    case 'Callback':
      return 'Signing in with that provider didn’t work. Try again, or use your email and password.';
    case 'Configuration':
      return 'Sign-in isn’t set up properly on our side. Please try again in a little while.';
    default:
      return 'Something went wrong while signing you in. Please try again.';
  }
}

export interface PasswordStrength {
  /** 0 = doesn't meet the rules yet, 1 = okay, 2 = good, 3 = strong. */
  score: 0 | 1 | 2 | 3;
  label: string;
  /** Same rules the server checks (passwordProblem in server/users.ts). */
  rules: { text: string; ok: boolean }[];
}

export function passwordStrength(password: string): PasswordStrength {
  const rules = [
    { text: 'At least 8 characters', ok: password.length >= 8 },
    { text: 'A letter and a number', ok: /[a-z]/i.test(password) && /\d/.test(password) },
  ];
  if (!password || rules.some((r) => !r.ok) || password.length > 128) {
    return { score: 0, label: password ? 'Too weak' : '', rules };
  }
  let extra = 0;
  if (password.length >= 12) extra++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) extra++;
  if (/[^a-z0-9]/i.test(password)) extra++;
  if (/^(.)\1+$/.test(password) || /password|12345|qwerty/i.test(password)) extra = 0;
  const score = (extra >= 2 ? 3 : extra === 1 ? 2 : 1) as 1 | 2 | 3;
  return { score, label: ['', 'Okay', 'Good', 'Strong'][score], rules };
}
