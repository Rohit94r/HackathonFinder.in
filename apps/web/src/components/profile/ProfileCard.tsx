import { Building2, CalendarDays, Code2, GraduationCap, Linkedin, MapPin, Trophy, Users } from 'lucide-react';
import { cityName } from '@hackathonfinder/shared';
import Avatar from '@/components/Avatar';
import { skillChip } from '@/components/teams/TeamParts';
import type { ProfileInfo } from './profileData';

/** Only web links become links, whatever an old profile saved. */
const webLink = (url?: string) => (url && /^https?:\/\/\S+$/i.test(url) ? url : undefined);

/** Left column of a profile: who they are, what they do, where to find them. */
export default function ProfileCard({
  profile,
  highlight,
  badge,
  children,
}: {
  profile: ProfileInfo;
  /** A short achievement next to the name, e.g. "3× winner". */
  highlight?: string;
  /** Extra label after the name, e.g. the "Sample" tag. */
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const facts = [
    { icon: GraduationCap, text: profile.about },
    { icon: Building2, text: profile.college },
    { icon: MapPin, text: profile.city ? cityName(profile.city) : '' },
    { icon: CalendarDays, text: profile.joined ?? '' },
  ].filter((f) => f.text);
  const github = webLink(profile.github);
  const linkedin = webLink(profile.linkedin);

  return (
    <section className="card p-6" aria-label={`About ${profile.name}`}>
      <Avatar name={profile.name} image={profile.image} size="xl" className="ring-4 ring-accent/15" />
      <h1 className="mt-4 flex flex-wrap items-center gap-2 font-sans text-2xl font-bold normal-case leading-tight tracking-normal">
        {profile.name}
        {badge}
      </h1>
      <p className="text-sm text-ink/60">@{profile.handle}</p>

      {(profile.lookingForTeam || highlight) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.lookingForTeam && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              Looking for a team
            </span>
          )}
          {highlight && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-ink/[0.06] px-3 py-1 text-xs font-semibold text-ink/80">
              <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
              {highlight}
            </span>
          )}
        </div>
      )}

      {profile.bio && <p className="mt-4 text-sm leading-6 text-ink/80">{profile.bio}</p>}

      {facts.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm text-ink/70">
          {facts.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-2">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink/60" aria-hidden="true" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      )}

      {profile.skills.length > 0 && (
        <div className="mt-5">
          <h2 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-ink/60">Skills</h2>
          <ul className="flex flex-wrap gap-1.5">
            {profile.skills.map((s) => (
              <li key={s} className={skillChip()}>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(github || linkedin) && (
        <div className="mt-5 flex flex-wrap gap-2">
          {github && (
            <a href={github} target="_blank" rel="noopener noreferrer nofollow" className="chip text-xs">
              <Code2 className="h-4 w-4" aria-hidden="true" />
              GitHub
            </a>
          )}
          {linkedin && (
            <a href={linkedin} target="_blank" rel="noopener noreferrer nofollow" className="chip text-xs">
              <Linkedin className="h-4 w-4" aria-hidden="true" />
              LinkedIn
            </a>
          )}
        </div>
      )}

      {children && <div className="mt-6 space-y-3 border-t border-ink/10 pt-5">{children}</div>}
    </section>
  );
}
