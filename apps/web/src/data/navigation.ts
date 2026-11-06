import {
  BookOpen,
  CalendarDays,
  Flame,
  Info,
  LayoutGrid,
  Map,
  MapPin,
  Megaphone,
  MessagesSquare,
  Newspaper,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  /** One line under the label in the navbar menus. */
  description: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// Shared by both navbars (landing and inner pages) so they always list the same pages.
export const NAV_HACKATHONS: NavGroup = {
  label: 'Explore',
  items: [
    { label: 'All hackathons', href: '/hackathons', description: 'Every open event, with every filter', icon: LayoutGrid },
    { label: 'Near me', href: '/near-me', description: 'The closest ones first, by GPS or city', icon: MapPin },
    { label: 'Cities', href: '/cities', description: 'Shortlist hackathons city by city', icon: Map },
    { label: 'Calendar', href: '/calendar', description: 'What’s on, day by day', icon: CalendarDays },
    { label: 'Closing soon', href: '/hackathons?status=closing-soon', description: 'Deadlines in the next 3 days', icon: Flame },
  ],
};

export const NAV_COMMUNITY: NavGroup = {
  label: 'Community',
  items: [
    { label: 'Discussions', href: '/community', description: 'Ask, share and talk with students', icon: MessagesSquare },
    { label: 'Team Finder', href: '/teams', description: 'Find teammates anywhere', icon: Users },
    { label: 'Winning stories', href: '/wins', description: 'Students share how they won', icon: Trophy },
    { label: 'News & trends', href: '/news', description: 'AI, skills and market briefings', icon: Newspaper },
    { label: 'Blog & guides', href: '/blog', description: 'Tips to pick, build and pitch', icon: BookOpen },
    { label: 'How it works', href: '/how-it-works', description: 'Where our listings come from', icon: Info },
    { label: 'For organizers', href: '/organizers', description: 'List and promote your event', icon: Megaphone },
  ],
};
