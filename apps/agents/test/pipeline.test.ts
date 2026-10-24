import { describe, expect, it } from 'vitest';
import { inferThemes, parseTeamSize, templateSummary, templateTagline } from '@hackathonfinder/ai';
import { firstImage } from '../src/connectors/util';
import { DedupeIndex, type IndexEntry } from '../src/pipeline/dedupe';
import { cityLabel, feeFromText, normalize, resolveCity, statedCity, strongThemes } from '../src/pipeline/normalize';
import { derivedUpdate, isTemplateSummary, writeCopy } from '../src/pipeline/refresh';
import { notHackathonReason } from '../src/pipeline/relevance';
import { isPlaceholderImage } from '../src/text';

describe('accuracy rules', () => {
  it('turns away fest events that are not hackathons, keeps the ones that are', () => {
    expect(notHackathonReason('Drone Soccer | TECHKRITI | IIT KANPUR', ['Drone', 'Robotics'])).toMatch(/^not a hackathon-type event/);
    expect(notHackathonReason('Multirotor | TECHKRITI | IIT KANPUR')).toMatch(/not a hackathon-type event/);
    expect(notHackathonReason('Techkriti Grand Prix | TECHKRITI | IIT KANPUR')).toMatch(/grand prix/);
    expect(notHackathonReason('IARC | TECHKRITI | IIT KANPUR', ['Drone', 'Robotics', 'Games & Sports'])).toMatch(/not a hackathon-type event/);
    expect(notHackathonReason('BGMI Tournament 2026', ['Esports'])).toBeTruthy();
    expect(notHackathonReason('Tech Quiz 2026')).toBeTruthy();
    expect(notHackathonReason('Robo Hackathon 2026', ['Robotics'])).toBeUndefined();
    expect(notHackathonReason('AQX Sports Analytics Data Bowl 4.0', ['Machine Learning/AI'])).toBeUndefined();
    expect(notHackathonReason('Hack-to-Ween 2026 | Halloween Hackathon')).toBeUndefined();
    expect(notHackathonReason('Campus Quest', ['Software Development'])).toBeUndefined();
    expect(notHackathonReason('Pitch Perfect: Startup Pitch Competition')).toBeUndefined();
    // Unstop tags real hackathons "Quizzes & Treasure Hunt"; tags alone never reject on that.
    expect(notHackathonReason('NASA Space Apps Challenge 2026', ['Quizzes & Treasure Hunt', 'Research Skills', 'Analytical Skills'])).toBeUndefined();
    expect(notHackathonReason('Campus Quest', ['Quizzes & Treasure Hunt', 'Problem Solving'])).toBeUndefined();
    expect(notHackathonReason('Circuit Debugging', ['Electronics Engineer', 'Quizzes & Treasure Hunt', 'Debugging'])).toBeUndefined();
    expect(notHackathonReason('IARC | TECHKRITI | IIT KANPUR', ['Embedded Systems Engineer', 'Robotics Engineer', 'Robotics Control Systems', 'Sensor Integration', 'Embedded Systems Design', 'Robotics Kinematics', 'Computer-Aided Design (CAD)'])).toMatch(/robotic/);
  });

  it('treats site default pictures as no image', () => {
    expect(isPlaceholderImage('https://www.knowafest.com/images/knowafest-event-default.png')).toBe(true);
    expect(isPlaceholderImage('https://cdn.example.com/img/placeholder.jpg')).toBe(true);
    expect(isPlaceholderImage('https://assets.devfolio.co/hackathons/x/assets/cover/424.png')).toBe(false);
    expect(firstImage('https://www.knowafest.com/images/knowafest-event-default.png', 'https://www.knowafest.com/storage/141/60789.jpg')).toBe('https://www.knowafest.com/storage/141/60789.jpg');
  });

  it('tags themes only from strong signals', () => {
    const desc = 'Get ready for Version Beta, the ultimate 36-hour hackathon. Go green, save the environment of coding, IDE for your code.';
    expect(strongThemes('Version Beta 9.0', [], desc)).toEqual([]);
    expect(strongThemes('Version Beta 9.0', [], 'Hackathon Themes: Artificial Intelligence and Generative AI, FinTech and Blockchain')).toEqual(['ai-ml', 'web3', 'fintech']);
    expect(strongThemes('GreenCode Climate Hack', [], '')).toEqual(['climate']);
    expect(strongThemes('Open Hack', [], 'This is an open innovation hackathon')).toEqual(['open-innovation']);
  });

  it('marks unknown team sizes and leaves them out of the summary', () => {
    const d = normalize({ url: 'https://x.example/e', title: 'Version Beta 9.0', text: '36 hours of building in Bhopal', data: { title: 'Version Beta 9.0', mode: 'offline', city: 'Bhopal', startDate: '2026-11-01', registrationUrl: 'https://x.example/e' }, imageUrls: [] }, { slug: 'devfolio', trust: 0.9 }, { now: new Date('2026-10-24') });
    expect(d.teamSizeKnown).toBe(false);
    expect(d.themes).toEqual([]);
    writeCopy(d);
    expect(d.summary).toBe('An in-person hackathon, in Bhopal. Free to enter.');
    expect(d.tagline).toBe('In-person hackathon in Bhopal');
    expect(isTemplateSummary(d.summary)).toBe(true);
    expect(isTemplateSummary('Join us for 36 hours of building!')).toBe(false);
  });

  it('rewrites derived fields and drops placeholder banners', () => {
    const d = normalize({ url: 'https://x.example/e', title: 'MARK-A-THON', text: '', data: { title: 'MARK-A-THON', mode: 'online', startDate: '2026-11-01', registrationUrl: 'https://x.example/e' }, imageUrls: [] }, { slug: 'knowafest', trust: 0.8 }, { now: new Date('2026-10-24') });
    writeCopy(d);
    const doc = { teamMin: 1, teamMax: 4, themes: ['climate'], tagline: 'Online hackathon on Climate', summary: 'An online hackathon. Tracks include Climate.', verified: false, prizePool: 3, prizeCurrency: 'INR', prizes: [], startDate: d.startDate!, endDate: d.endDate!, registrationDeadline: d.registrationDeadline!, imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/hackathonfinder/banners/k-1.png', sourceImageUrl: 'https://www.knowafest.com/images/knowafest-event-default.png' } as any;
    const up = derivedUpdate(doc, d, { dates: false });
    expect(up.set).toMatchObject({ teamSizeKnown: false, themes: [], prizePool: 0 });
    expect(up.unset).toEqual(['imageUrl', 'sourceImageUrl']);
    expect(derivedUpdate({ ...doc, verified: true, sourceImageUrl: undefined }, d, { dates: false }).set.themes).toBeUndefined();
  });
});

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
