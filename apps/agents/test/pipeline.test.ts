import { describe, expect, it } from 'vitest';
import { inferThemes, parseTeamSize, templateSummary, templateTagline } from '@hackathonfinder/ai';
import { DedupeIndex, type IndexEntry } from '../src/pipeline/dedupe';
import { cityLabel, feeFromText, resolveCity, statedCity } from '../src/pipeline/normalize';

describe('dedupe', () => {
  const entry = (id: string, title: string, reg: string, refs: IndexEntry['refs'] = []): IndexEntry => ({
    id,
    title,
    norm: title.toLowerCase(),
    start: Date.parse('2026-11-01T09:00:00+05:30'),
    mode: 'offline',
    city: 'chennai',
    regUrl: reg,
    refs,
    sources: ['knowafest'],
  });

  it('does not merge different events that share a generic registration page', () => {
    const index = DedupeIndex.from([entry('a', 'fullstackathon full stack workshop', 'topengineersindia.com/events', [{ source: 'knowafest', externalId: '66721', url: 'knowafest.com/event/fullstackathon' }])]);
    const q = { listingSource: 'knowafest', externalId: '66800', url: 'https://www.knowafest.com/event/thinkathon', registrationUrl: 'https://topengineersindia.com/events', title: 'Thinkathon 2026 - 10 Hour Design Thinking Workshop', mode: 'offline' as const, city: 'chennai', start: new Date('2026-11-20T09:00:00+05:30') };
    expect(index.find(q)).toBeNull();
    // The same event listed elsewhere with the same form still matches.
    expect(index.find({ ...q, listingSource: 'unstop', externalId: '1', url: 'https://unstop.com/x', title: 'Fullstackathon 2026 Full Stack Workshop' })?.reason).toBe('registration-url');
  });
});

describe('rule-based readers', () => {
  it('reads team sizes only next to "team" or "members"', () => {
    expect(parseTeamSize('Event Date: 29–30 October 2026 Team Size: 3–5 members')).toEqual({ min: 3, max: 5 });
    expect(parseTeamSize('Participants must form teams of 2 - 4 members.')).toEqual({ min: 2, max: 4 });
    expect(parseTeamSize('Hackathon on 29–30 October 2026 at the main campus, with prizes')).toBeNull();
    expect(parseTeamSize('2-4')).toEqual({ min: 2, max: 4 });
    expect(parseTeamSize('up to 4 members per team')).toEqual({ min: 1, max: 4 });
    expect(parseTeamSize('This is a solo coding challenge')).toEqual({ min: 1, max: 1 });
  });

  it('reads fees from run-together text', () => {
    expect(feeFromText('Registration Deadline: 27 October 2026Registration Fee: ₹400 per participant')).toBe(400);
    expect(feeFromText('Free registration for all students')).toBe(0);
  });

  it('does not call machine learning EdTech', () => {
    expect(inferThemes('Machine Learning/AI, Beginner Friendly')).toEqual(['ai-ml']);
    expect(inferThemes('learning tools for teachers')).toContain('edtech');
  });

  it('names cities outside the catalog', () => {
    expect(resolveCity({ city: 'Bhopal', region: 'Madhya Pradesh' })).toBe('bhopal');
    expect(cityLabel('bhopal', statedCity('BHOPAL, MP'))).toBe('Bhopal');
    expect(cityLabel('pune', 'Pune')).toBeUndefined();
    expect(resolveCity({ city: 'Rohini', region: 'Delhi' })).toBe('rohini');
    expect(resolveCity({ city: '', region: 'Delhi' })).toBe('delhi-ncr');
  });

  it('writes our own summary and tagline, with the city label', () => {
    const s = templateSummary({ type: 'hackathon', mode: 'offline', organizer: 'MANIT', city: 'bhopal', cityName: 'Bhopal', themes: ['ai-ml'], teamMin: 2, teamMax: 4, fee: 1500, beginnerFriendly: true });
    expect(s).toBe('An in-person hackathon by MANIT, in Bhopal. Tracks include AI / ML. Teams of 2–4. Entry fee ₹1,500. First-timers are welcome.');
    expect(templateSummary({ type: 'hackathon', mode: 'hybrid', themes: [], teamMin: 1, teamMax: 4, fee: 0, beginnerFriendly: false })).toMatch(/^A hybrid hackathon: take part in person or online\./);
    expect(templateTagline({ type: 'ideathon', mode: 'offline', city: 'bhopal', cityName: 'Bhopal', themes: ['fintech'] })).toBe('In-person ideathon in Bhopal on FinTech');
  });
});
