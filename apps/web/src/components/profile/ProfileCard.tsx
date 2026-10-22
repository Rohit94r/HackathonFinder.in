import { Building2, CalendarDays, Code2, GraduationCap, Linkedin, MapPin, Users } from 'lucide-react';
import { cityName } from '@hackathonfinder/shared';
import Avatar from '@/components/Avatar';
import Sticker from '@/components/art/Sticker';
import { themeStyle } from '@/lib/themeStyles';
import { cn } from '@/lib/cn';
import { skillTheme, type ProfileInfo } from './profileData';

function Banner({ profile, sticker }: { profile: ProfileInfo; sticker?: string }) {
  const { gradient, icon: Icon } = themeStyle(skillTheme(profile.skills));
  const patternId = `profile-dots-${profile.handle}`;
  return (
    <div className={cn('relative h-28 overflow-hidden bg-gradient-to-br', gradient)}>
      <svg className="absolute inset-0 h-full w-full opacity-30" aria-hidden="true">
        <defs>
          <pattern id={patternId} width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/20 blur-2xl" aria-hidden="true" />
      <span className="absolute bottom-3 right-3 inline-flex rounded-2xl bg-white/20 p-2 text-white backdrop-blur" aria-hidden="true">
        <Icon className="h-5 w-5" />
      </span>
      {sticker && <Sticker text={sticker} tone="yellow" className="right-4 top-4 rotate-6" />}
    </div>
  );
}

/** Left column of a profile: who they are, what they do, where to find them. */
export default function ProfileCard({
  profile,
  sticker,
  children,
}: {
  profile: ProfileInfo;
  /** Short label stuck on the banner, e.g. "3× winner". */
  sticker?: string;
  children?: React.ReactNode;
}) {
  const facts = [
    { icon: GraduationCap, text: profile.about },
    { icon: Building2, text: profile.college },
    { icon: MapPin, text: profile.city ? cityName(profile.city) : '' },
    { icon: CalendarDays, text: profile.joined ?? '' },
  ].filter((f) => f.text);

  return (
    <section className="card overflow-hidden" aria-label={`About ${profile.name}`}>
      <Banner profile={profile} sticker={sticker} />
      <div className="px-5 pb-6">
        <span className="relative -mt-14 inline-flex rounded-full bg-card p-1">
          <Avatar name={profile.name} image={profile.image} size="xl" className="ring-0" />
        </span>
        <h1 className="mt-3 font-sans text-2xl font-bold normal-case leading-tight tracking-normal">{profile.name}</h1>
        <p className="text-sm text-ink/60">@{profile.handle}</p>
        {profile.lookingForTeam && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-pop px-3 py-1 text-xs font-bold text-navy">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            Looking for a team
          </p>
        )}
        {profile.bio && <p className="mt-4 text-sm leading-6 text-ink/80">{profile.bio}</p>}

        {facts.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm text-ink/70">
            {facts.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink/50" aria-hidden="true" />
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
                <li key={s} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(profile.github || profile.linkedin) && (
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.github && (
              <a href={profile.github} target="_blank" rel="noopener noreferrer nofollow" className="chip text-xs">
                <Code2 className="h-4 w-4" aria-hidden="true" />
                GitHub
              </a>
            )}
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer nofollow" className="chip text-xs">
                <Linkedin className="h-4 w-4" aria-hidden="true" />
                LinkedIn
              </a>
            )}
          </div>
        )}

        {children && <div className="mt-6 space-y-3 border-t border-ink/10 pt-5">{children}</div>}
      </div>
    </section>
  );
}
