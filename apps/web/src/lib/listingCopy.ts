import { themeName, type City, type Theme } from '@hackathonfinder/shared';
import type { HackathonView } from '@/lib/hackathons';
import { formatDay } from '@/lib/format';

const openEvents = (items: HackathonView[]) => items.filter((h) => h.status !== 'completed');

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "a, b and c" with an Oxford-free join that reads naturally in a sentence. */
function list(values: string[]): string {
  if (values.length === 0) return '';
  if (values.length === 1) return values[0];
  return `${values.slice(0, -1).join(', ')} and ${values[values.length - 1]}`;
}

export interface ListingCopy {
  title: string;
  paragraphs: string[];
  faqs: { q: string; a: string }[];
}

/**
 * Data-backed copy for a city page. Every sentence is derived from the current
 * listings, so the page says something concrete and changes when the data does
 * instead of repeating the same template across fifteen cities.
 */
export function cityCopy(city: City, items: HackathonView[]): ListingCopy {
  const open = openEvents(items).filter((h) => h.city === city.slug);
  const count = open.length;
  const themes = [...new Set(open.flatMap((h) => h.themes))].slice(0, 3).map(themeName);
  const free = open.filter((h) => h.fee === 0).length;
  const beginner = open.filter((h) => h.beginnerFriendly).length;
  const online = open.filter((h) => h.mode !== 'offline').length;
  const next = [...open].sort((a, b) => Date.parse(a.registrationDeadline) - Date.parse(b.registrationDeadline))[0];

  const paragraphs = count
    ? [
        `${plural(count, 'hackathon, ideathon or coding competition')} in ${city.name} ${count === 1 ? 'is' : 'are'} open for registration right now${themes.length ? `, across ${list(themes)}` : ''}. ${free > 0 ? `${free} of them ${free === 1 ? 'is' : 'are'} free to enter` : 'Check each listing for the entry fee'}, and ${beginner > 0 ? `${beginner} ${beginner === 1 ? 'is' : 'are'} marked beginner friendly` : 'the beginner filter shows which ones suit first-timers'}.`,
        next
          ? `The next deadline is ${formatDay(next.registrationDeadline)}. ${city.name} organizers usually close registrations before the event, so shortlist two or three events instead of one and keep an eye on the calendar.`
          : `Deadlines in ${city.name} move quickly, so shortlist two or three events instead of one and keep an eye on the calendar.`,
        `Most ${city.name} events are in person, which makes them a good place to meet students from nearby colleges. ${online > 0 ? `${online} of the open listings can also be joined online.` : `If the dates do not work, online hackathons are open to anyone in ${city.state}.`} New to this? Start with the first-timer guide, then find teammates from ${city.name}.`,
      ]
    : [
        `There are no open hackathons in ${city.name} in our listings right now. We check event pages and platforms twice a day, so a new ${city.name} event usually appears within a day of being announced.`,
        `In the meantime, online hackathons are open to students in ${city.state}, and the calendar shows every upcoming start date and registration deadline in one view.`,
        `Organising something in ${city.name}? You can add it for free and it will be reviewed before it goes live.`,
      ];

  return {
    title: `Hackathons in ${city.name}: the details`,
    paragraphs,
    faqs: [
      {
        q: `Are there free hackathons in ${city.name}?`,
        a:
          count === 0
            ? `There are no open ${city.name} events listed right now. When events open, the fee filter on the page shows which ones are free, and most student-run hackathons charge nothing to enter.`
            : `${free === 0 ? 'None of the currently open events' : `${free} of the ${count} open ${count === 1 ? 'event' : 'events'}`} in ${city.name} ${free === 1 ? 'is' : 'are'} free to enter. The fee filter on this page shows free events first, and each listing states the entry fee before you register.`,
      },
      {
        q: `Can I join an online hackathon from ${city.name}?`,
        a: `Yes. Online hackathons have no location requirement, so students in ${city.name} and anywhere else in ${city.state} can enter. They are a good fallback when an in-person event clashes with exams or is too far to travel.`,
      },
      {
        q: `How do I find teammates for a hackathon in ${city.name}?`,
        a: `Post on the Team Finder board with your skills, the event you have in mind and your city, then message people whose stack complements yours. College coding clubs and department groups in ${city.name} are the other reliable route, especially for in-person events.`,
      },
    ],
  };
}

/** The same idea for a theme page: what is open, what it costs and how to start. */
export function themeCopy(theme: Theme, items: HackathonView[]): ListingCopy {
  const open = openEvents(items).filter((h) => h.themes.includes(theme.slug));
  const count = open.length;
  const online = open.filter((h) => h.mode !== 'offline').length;
  const free = open.filter((h) => h.fee === 0).length;
  const beginner = open.filter((h) => h.beginnerFriendly).length;
  const cities = [...new Set(open.filter((h) => h.mode !== 'online' && h.city).map((h) => h.cityName ?? h.city))].slice(0, 3) as string[];
  const next = [...open].sort((a, b) => Date.parse(a.registrationDeadline) - Date.parse(b.registrationDeadline))[0];

  const paragraphs = count
    ? [
        `${plural(count, `${theme.name} hackathon`)} ${count === 1 ? 'is' : 'are'} open for registration right now. ${online > 0 ? `${online} can be joined online` : 'They are in-person events'}, ${free > 0 ? `${free} ${free === 1 ? 'is' : 'are'} free to enter` : 'check each listing for the fee'}${beginner > 0 ? `, and ${beginner} ${beginner === 1 ? 'is' : 'are'} marked beginner friendly` : ''}.`,
        next
          ? `The next deadline is ${formatDay(next.registrationDeadline)}. ${cities.length ? `Open events are running in ${list(cities)}.` : ''} Registration usually closes before the build starts, so apply early even if the event itself is weeks away.`
          : `Registration usually closes before the build starts, so apply early even if the event itself is weeks away.`,
        `${theme.description} A narrow, working demo that solves one problem clearly scores better than a broad prototype, so pick a single user and a single workflow. Our project ideas guide has shapes that fit this track, and the pitch guide covers how to present the trade-offs.`,
      ]
    : [
        `There are no open ${theme.name} hackathons in our listings right now. We check platforms and event pages twice a day, so new ${theme.name} events usually appear within a day of being announced.`,
        `In the meantime, the full hackathon list includes events where you can choose your own theme, and the calendar shows every upcoming deadline.`,
        `If you are building for ${theme.name} anyway, the project ideas guide has directions that judges tend to reward.`,
      ];

  return {
    title: `${theme.name} hackathons: what to expect`,
    paragraphs,
    faqs: [
      {
        q: `Are ${theme.name} hackathons beginner friendly?`,
        a:
          beginner > 0
            ? `Yes. ${beginner} of the ${count} open ${theme.name} events are marked beginner friendly on HackathonFinder, which means the organizer welcomes first-timers. Look for the beginner filter on this page, and read the first-timer guide before you register.`
            : `Some ${theme.name} events welcome first-timers even when they are not marked. Check the eligibility section of each listing and ask the organizer; most student-run events care more about a clear idea than about prior experience.`,
      },
      {
        q: `Can I join a ${theme.name} hackathon online?`,
        a:
          online > 0
            ? `Yes. ${online} of the ${count} open ${theme.name} events can be joined online, so you do not need to travel. Online events usually ask for a recorded demo and a repository instead of a stage pitch.`
            : `The currently open ${theme.name} events are in person. Online hackathons with an open theme are a good alternative if you cannot travel.`,
      },
      {
        q: `What should I build for a ${theme.name} hackathon?`,
        a: `${theme.description} Pick one user with a specific problem, build the shortest working flow that solves it, and prepare a demo that shows the before and after. The project ideas guide has several shapes that fit this space.`,
      },
    ],
  };
}
