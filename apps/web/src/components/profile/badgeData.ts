import {
  Bookmark,
  Compass,
  Crown,
  Flag,
  HeartHandshake,
  MapPin,
  Medal,
  MessageSquare,
  Rocket,
  Ticket,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { countResults, type Person } from '@/data/people';

export type BadgeId =
  | 'first-save'
  | 'registered'
  | 'shipped'
  | 'finisher'
  | 'explorer'
  | 'city-scout'
  | 'team-player'
  | 'voice'
  | 'helper'
  | 'podium'
  | 'winner'
  | 'hat-trick';

export interface BadgeDef {
  id: BadgeId;
  name: string;
  description: string;
  icon: LucideIcon;
  /** Fill and icon colour for the earned badge. */
  tone: string;
}

export const BADGES: BadgeDef[] = [
  { id: 'first-save', name: 'First save', description: 'Saved a hackathon', icon: Bookmark, tone: 'bg-accent text-white' },
  { id: 'registered', name: 'Registered', description: 'Registered for a hackathon', icon: Ticket, tone: 'bg-accent text-white' },
  { id: 'shipped', name: 'Shipped', description: 'Submitted a project', icon: Rocket, tone: 'bg-accent text-white' },
  { id: 'finisher', name: 'Finisher', description: 'Finished a hackathon', icon: Flag, tone: 'bg-accent text-white' },
  { id: 'explorer', name: 'Explorer', description: 'Saved 5 hackathons', icon: Compass, tone: 'bg-accent text-white' },
  { id: 'city-scout', name: 'City scout', description: 'Follows 3 cities', icon: MapPin, tone: 'bg-ink text-surface' },
  { id: 'team-player', name: 'Team player', description: 'Posted in Team Finder', icon: Users, tone: 'bg-ink text-surface' },
  { id: 'voice', name: 'Voice', description: 'Started a discussion', icon: MessageSquare, tone: 'bg-ink text-surface' },
  { id: 'helper', name: 'Helper', description: 'Replied 5 times in discussions', icon: HeartHandshake, tone: 'bg-ink text-surface' },
  { id: 'podium', name: 'Podium', description: 'Won or came second', icon: Medal, tone: 'bg-brand-800 text-white' },
  { id: 'winner', name: 'Winner', description: 'Won a hackathon', icon: Trophy, tone: 'bg-brand-800 text-white' },
  { id: 'hat-trick', name: 'Hat-trick', description: 'Won 3 hackathons', icon: Crown, tone: 'bg-brand-800 text-white' },
];

export interface BadgeState {
  id: BadgeId;
  earned: boolean;
  /** Shown on locked badges that need more than one step, e.g. 2 of 5. */
  progress?: { value: number; goal: number };
}

function step(id: BadgeId, value: number, goal = 1): BadgeState {
  return { id, earned: value >= goal, progress: goal > 1 ? { value: Math.min(value, goal), goal } : undefined };
}

/** Sample students: worked out from their hackathon record. */
export function personBadges(p: Person): BadgeState[] {
  const r = countResults(p.record);
  const earned: Record<BadgeId, boolean> = {
    'first-save': true,
    registered: r.hackathons >= 1,
    shipped: r.hackathons >= 1,
    finisher: r.hackathons >= 1,
    explorer: r.hackathons >= 2,
    'city-scout': p.joinedMonthsAgo >= 6,
    'team-player': p.lookingForTeam || r.hackathons >= 3,
    voice: r.hackathons >= 2,
    helper: r.hackathons >= 4,
    podium: r.podiums >= 1,
    winner: r.wins >= 1,
    'hat-trick': r.wins >= 3,
  };
  return BADGES.map((b) => ({
    id: b.id,
    earned: earned[b.id],
    progress: b.id === 'hat-trick' && !earned[b.id] ? { value: r.wins, goal: 3 } : undefined,
  }));
}

export interface MyBadgeInput {
  saves: number;
  registered: number;
  submitted: number;
  done: number;
  cities: number;
  teamPosts: number;
  threads: number;
  replies: number;
  podiums: number;
  wins: number;
}

/** The student's own badges, from their tracker, activity log and posted stories. */
export function myBadges(m: MyBadgeInput): BadgeState[] {
  const states: Record<BadgeId, BadgeState> = {
    'first-save': step('first-save', m.saves),
    registered: step('registered', m.registered),
    shipped: step('shipped', m.submitted),
    finisher: step('finisher', m.done),
    explorer: step('explorer', m.saves, 5),
    'city-scout': step('city-scout', m.cities, 3),
    'team-player': step('team-player', m.teamPosts),
    voice: step('voice', m.threads),
    helper: step('helper', m.replies, 5),
    podium: step('podium', m.podiums),
    winner: step('winner', m.wins),
    'hat-trick': step('hat-trick', m.wins, 3),
  };
  return BADGES.map((b) => states[b.id]);
}
