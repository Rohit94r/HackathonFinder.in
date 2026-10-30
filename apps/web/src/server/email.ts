import 'server-only';
import { appUrl } from './appUrl';

export interface Email {
  to: string;
  subject: string;
  /** Plain text version; also used to build simple HTML. */
  text: string;
  /** Optional call-to-action button. */
  action?: { label: string; url: string };
}

/** Public base URL for links in emails. */
export function siteUrl(): string {
  return appUrl();
}

function toHtml(email: Email): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const paragraphs = email.text
    .split(/\n\s*\n/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.55">${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  const button = email.action
    ? `<p style="margin:24px 0"><a href="${email.action.url}" style="background:#ec3750;color:#ffffff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block">${esc(email.action.label)}</a></p>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#f9fafc;font-family:Figtree,Arial,sans-serif;color:#17171d"><div style="max-width:520px;margin:0 auto;padding:32px 24px"><p style="font-weight:800;font-size:18px;margin:0 0 24px">Hackathon<span style="color:#ec3750">Finder</span></p>${paragraphs}${button}<p style="margin:32px 0 0;font-size:12px;color:#6b6b76">You got this email because of your HackathonFinder account. If it wasn’t you, you can ignore it.</p></div></body></html>`;
}

/**
 * Sends through Resend when RESEND_API_KEY is set. Without it (local development),
 * the email is printed to the server log so links can still be clicked.
 */
export async function sendEmail(email: Email): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`\n[email] To: ${email.to}\n[email] Subject: ${email.subject}\n${email.text}${email.action ? `\n${email.action.label}: ${email.action.url}` : ''}\n`);
    return true;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'HackathonFinder <hello@hackathonfinder.in>',
        to: email.to,
        subject: email.subject,
        text: email.action ? `${email.text}\n\n${email.action.label}: ${email.action.url}` : email.text,
        html: toHtml(email),
      }),
    });
    if (!res.ok) console.error('[email] Resend error', res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error('[email] Could not send:', err);
    return false;
  }
}
