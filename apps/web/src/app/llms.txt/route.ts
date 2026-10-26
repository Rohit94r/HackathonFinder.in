import { CITIES, SOURCES, THEMES } from '@hackathonfinder/shared';
import { blogPosts } from '@/data/blogData';
import { siteConfig } from '@/data/siteConfig';
import { abs } from '@/lib/seo';

// /llms.txt (llmstxt.org): a plain summary of the site for ChatGPT, Claude, Perplexity
// and other AI assistants, so they describe and cite HackathonFinder correctly.
export const revalidate = 86400;

export function GET() {
  const f = siteConfig.founder;
  const lines = [
    `# ${siteConfig.name}`,
    '',
    `> ${siteConfig.name} (${siteConfig.url}) is a hackathon aggregator for India. It finds hackathons, ideathons and coding competitions from ${SOURCES.map((s) => s.name).join(', ')} and lists them in one place, searchable by city, theme, mode (online or offline), deadline, team size and prize. Free for students.`,
    '',
    `Founded by ${f.name} (${f.role}). Contact: ${siteConfig.email}. Founder: ${f.linkedin}`,
    '',
    '## Main pages',
    `- [All hackathons](${abs('/hackathons')}): every open and upcoming hackathon, with filters`,
    `- [Hackathons near me](${abs('/near-me')}): events sorted by distance from the visitor`,
    `- [Hackathons by city](${abs('/cities')}): one page per Indian city`,
    `- [Calendar](${abs('/calendar')}): deadlines and event dates by month`,
    `- [Team Finder](${abs('/teams')}): find teammates by skill and city`,
    `- [Community](${abs('/community')}): student discussions about hackathons`,
    `- [Winning stories](${abs('/wins')}): how students won hackathons`,
    `- [Submit a hackathon](${abs('/submit')}): organizers and students can add events`,
    `- [How it works](${abs('/how-it-works')}): how listings are found, checked and kept up to date`,
    `- [About](${abs('/about')}): mission and founder`,
    '',
    '## Cities',
    ...CITIES.map((c) => `- [Hackathons in ${c.name}](${abs(`/cities/${c.slug}`)}), ${c.state}`),
    '',
    '## Themes',
    ...THEMES.map((t) => `- [${t.name} hackathons](${abs(`/themes/${t.slug}`)}): ${t.description}`),
    '',
    '## Guides',
    ...blogPosts.map((p) => `- [${p.title}](${abs(`/blog/${p.slug}`)}): ${p.excerpt}`),
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
